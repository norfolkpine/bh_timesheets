from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from .models import Customer, Project, Timesheet, TimesheetDetail, EmployeeProfile, AuditLog, RateHistory
from .serializers import (
    CustomerSerializer, ProjectSerializer, TimesheetSerializer, 
    TimesheetDetailSerializer, EmployeeProfileSerializer, AuditLogSerializer, RateHistorySerializer
)
from .mixins import AuditLogMixin, TimesheetSubmissionMixin
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction, models

User = get_user_model()

# Signal to create employee profile when user is created
@receiver(post_save, sender=User)
def create_employee_profile(sender, instance, created, **kwargs):
    if created:
        EmployeeProfile.objects.create(
            user=instance,
            role='employee',  # Default role
            employee_id=f"{settings.EMPLOYEE_ID_PREFIX}{instance.id:0{settings.EMPLOYEE_ID_PADDING}d}"  # Use settings for ID format
        )

class IsOwnerOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow authenticated users to access the view
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow staff users to do anything
        if request.user.is_staff:
            return True

        # For timesheets
        if isinstance(obj, Timesheet):
            # Allow users to access their own timesheets
            if obj.user == request.user:
                return True
            # Allow managers to access their team's timesheets
            if hasattr(request.user, 'profile') and request.user.profile.role == 'manager':
                return True
            return False

        # For timesheet details
        if isinstance(obj, TimesheetDetail):
            # Allow users to access their own timesheet details
            if obj.timesheet.user == request.user:
                return True
            # Allow managers to access their team's timesheet details
            if hasattr(request.user, 'profile') and request.user.profile.role == 'manager':
                return True
            return False

        return False

@extend_schema(tags=['Customers'])
class CustomerViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing customers.
    
    Provides CRUD operations for customer records.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    lookup_field = 'uuid'
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Log changes before saving
        self._log_changes(instance, serializer.validated_data, request.user)
        
        self.perform_update(serializer)
        return Response(serializer.data)

@extend_schema(tags=['Projects'])
class ProjectViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing projects.
    
    Provides CRUD operations for project records, including their relationship with customers.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    lookup_field = 'uuid'
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Check for rate changes
        rate_fields = {
            'hourly_rate': 'project_hourly',
            'daily_rate': 'project_daily',
            'fixed_price': 'project_fixed',
            'retainer_amount': 'project_retainer'
        }
        
        for field, rate_type in rate_fields.items():
            if field in serializer.validated_data:
                new_rate = serializer.validated_data[field]
                old_rate = getattr(instance, field)
                if new_rate != old_rate:
                    # Create rate history entry
                    RateHistory.objects.create(
                        rate_type=rate_type,
                        project=instance,
                        rate=new_rate,
                        effective_from=timezone.now().date(),
                        created_by=request.user,
                        notes=f"{field.replace('_', ' ').title()} changed from {old_rate} to {new_rate}"
                    )
        
        # Log changes before saving
        self._log_changes(instance, serializer.validated_data, request.user)
        
        self.perform_update(serializer)
        return Response(serializer.data)

@extend_schema(tags=['Timesheets'])
class TimesheetViewSet(AuditLogMixin, TimesheetSubmissionMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing timesheets.
    
    Provides CRUD operations for timesheet records, including submission, approval,
    and payment workflows.
    """
    serializer_class = TimesheetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManager]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Timesheet.objects.all()
        if hasattr(user, 'profile') and user.profile.role == 'manager':
            return Timesheet.objects.all()  # Managers can see all timesheets
        return Timesheet.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        description="Get summary statistics for timesheets",
        responses={200: None}
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for timesheets"""
        queryset = self.get_queryset()
        
        # Get date range from query params or default to current month
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        
        if from_date:
            queryset = queryset.filter(week_starting__gte=from_date)
        if to_date:
            queryset = queryset.filter(week_starting__lte=to_date)
            
        # Calculate total hours
        total_hours = queryset.aggregate(
            total=models.Sum('total_hours')
        )['total'] or 0
        
        # Calculate hours by status
        hours_by_status = {}
        for status, _ in Timesheet.STATUS_CHOICES:
            hours = queryset.filter(status=status).aggregate(
                total=models.Sum('total_hours')
            )['total'] or 0
            hours_by_status[status] = hours
            
        # Calculate count by status
        count_by_status = {}
        for status, _ in Timesheet.STATUS_CHOICES:
            count = queryset.filter(status=status).count()
            count_by_status[status] = count
            
        # Calculate hours by project
        hours_by_project = {}
        for timesheet in queryset:
            project_name = timesheet.project.name
            if project_name not in hours_by_project:
                hours_by_project[project_name] = 0
            hours_by_project[project_name] += timesheet.total_hours or 0
            
        # Calculate hours by user (for managers)
        hours_by_user = {}
        if request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'manager'):
            for timesheet in queryset:
                user_name = f"{timesheet.user.first_name} {timesheet.user.last_name}".strip() or timesheet.user.email
                if user_name not in hours_by_user:
                    hours_by_user[user_name] = 0
                hours_by_user[user_name] += timesheet.total_hours or 0
        
        return Response({
            'total_hours': total_hours,
            'hours_by_status': hours_by_status,
            'count_by_status': count_by_status,
            'hours_by_project': hours_by_project,
            'hours_by_user': hours_by_user if request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'manager') else None,
            'total_timesheets': queryset.count(),
        })

    @extend_schema(
        description="Submit a timesheet for approval",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def submit(self, request, uuid=None):
        return self.submit_timesheet(request, uuid)

    @extend_schema(
        description="Approve a submitted timesheet",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def approve(self, request, uuid=None):
        return self.approve_timesheet(request, uuid)

    @extend_schema(
        description="Reject a submitted timesheet",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reject(self, request, uuid=None):
        return self.reject_timesheet(request, uuid)

    @extend_schema(
        description="Mark an approved timesheet as pending payment",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def send_for_payment(self, request, uuid=None):
        return self.send_for_payment(request, uuid)

    @extend_schema(
        description="Mark a pending payment timesheet as paid",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def mark_as_paid(self, request, uuid=None):
        return self.mark_as_paid(request, uuid)

@extend_schema(tags=['Timesheet Details'])
class TimesheetDetailViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing timesheet details.
    
    Provides CRUD operations for individual day entries within timesheets.
    """
    queryset = TimesheetDetail.objects.all()
    serializer_class = TimesheetDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrManager]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return TimesheetDetail.objects.all()
        if hasattr(user, 'profile') and user.profile.role == 'manager':
            return TimesheetDetail.objects.all()  # Managers can see all timesheet details
        return TimesheetDetail.objects.filter(timesheet__user=user)

@extend_schema(tags=['Audit Logs'])
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing audit logs.
    
    Provides read-only access to audit log records.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        queryset = AuditLog.objects.all()
        
        # Filter by record type if provided
        record_type = self.request.query_params.get('record_type')
        if record_type:
            queryset = queryset.filter(record_type=record_type)
            
        # Filter by record UUID if provided
        record_uuid = self.request.query_params.get('record_uuid')
        if record_uuid:
            queryset = queryset.filter(record_uuid=record_uuid)
            
        # Filter by field type if provided
        field_type = self.request.query_params.get('field_type')
        if field_type:
            queryset = queryset.filter(field_type=field_type)
            
        # Non-staff users can only see their own changes
        if not user.is_staff:
            queryset = queryset.filter(changed_by=user)
            
        return queryset

@extend_schema(tags=['Rate History'])
class RateHistoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing rate history.
    
    Provides CRUD operations for tracking rate changes over time.
    """
    serializer_class = RateHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        queryset = RateHistory.objects.all()
        
        # Filter by employee or project if provided
        employee_uuid = self.request.query_params.get('employee_uuid')
        project_uuid = self.request.query_params.get('project_uuid')
        
        if employee_uuid:
            queryset = queryset.filter(employee__uuid=employee_uuid)
        if project_uuid:
            queryset = queryset.filter(project__uuid=project_uuid)
            
        # Non-staff users can only see their own rate history
        if not user.is_staff and not (hasattr(user, 'profile') and user.profile.role == 'manager'):
            queryset = queryset.filter(employee__user=user)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

@extend_schema(tags=['Employees'])
class EmployeeProfileViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing employee profiles.
    
    Provides CRUD operations for employee profile records.
    """
    serializer_class = EmployeeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return EmployeeProfile.objects.all()
        if hasattr(user, 'profile') and user.profile.role == 'manager':
            return EmployeeProfile.objects.all()  # Managers can see all profiles
        return EmployeeProfile.objects.filter(user=user)

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except EmployeeProfile.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(responses={200: EmployeeProfileSerializer})
    @action(detail=False, methods=['get'], url_path='current-profile')
    def current_profile(self, request):
        try:
            profile = request.user.profile
            serializer = EmployeeProfileSerializer(profile)
            return Response(serializer.data)
        except EmployeeProfile.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Check if hourly rate is being changed
        if 'hourly_rate' in serializer.validated_data:
            new_rate = serializer.validated_data['hourly_rate']
            if new_rate != instance.hourly_rate:
                # Create rate history entry
                RateHistory.objects.create(
                    rate_type='employee_hourly',
                    employee=instance,
                    rate=new_rate,
                    effective_from=timezone.now().date(),
                    created_by=request.user,
                    notes=f"Rate changed from {instance.hourly_rate} to {new_rate}"
                )
        
        # Log changes before saving
        self._log_changes(instance, serializer.validated_data, request.user)
        
        self.perform_update(serializer)
        return Response(serializer.data)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_info(request):
    """
    Return information about the current user including role
    """
    user = request.user
    is_manager = False
    
    # Check if user has a profile and is a manager
    if hasattr(user, 'profile') and user.profile.role == 'manager':
        is_manager = True
    
    return Response({
        'id': user.id,
        'email': user.email,
        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'role': 'manager' if is_manager else 'employee',
        'is_staff': user.is_staff
    })
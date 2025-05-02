from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from .models import Customer, Project, Timesheet, TimesheetDetail, EmployeeProfile
from .serializers import CustomerSerializer, ProjectSerializer, TimesheetSerializer, TimesheetDetailSerializer, EmployeeProfileSerializer
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction

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

# Create your views here.

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
class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing customers.
    
    Provides CRUD operations for customer records.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    lookup_field = 'uuid'
    permission_classes = [permissions.IsAuthenticated]

@extend_schema(tags=['Projects'])
class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing projects.
    
    Provides CRUD operations for project records, including their relationship with customers.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    lookup_field = 'uuid'
    permission_classes = [permissions.IsAuthenticated]

@extend_schema(tags=['Timesheets'])
class TimesheetViewSet(viewsets.ModelViewSet):
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
        description="Submit a timesheet for approval",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def submit(self, request, uuid=None):
        timesheet = Timesheet.objects.select_for_update().get(uuid=uuid)
        if timesheet.status != 'draft':
            return Response(
                {'error': 'Only draft timesheets can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        timesheet.status = 'submitted'
        timesheet.submitted_at = timezone.now()
        timesheet.save()
        serializer = self.get_serializer(timesheet)
        return Response(serializer.data)

    @extend_schema(
        description="Approve a submitted timesheet",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def approve(self, request, uuid=None):
        timesheet = Timesheet.objects.select_for_update().get(uuid=uuid)
        if timesheet.status != 'submitted':
            return Response(
                {'error': 'Only submitted timesheets can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if timesheet.approved_by:
            return Response(
                {'error': 'This timesheet has already been approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        timesheet.status = 'approved'
        timesheet.approved_by = request.user
        timesheet.approved_at = timezone.now()
        timesheet.save()
        serializer = self.get_serializer(timesheet)
        return Response(serializer.data)

    @extend_schema(
        description="Reject a submitted timesheet",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def reject(self, request, uuid=None):
        timesheet = Timesheet.objects.select_for_update().get(uuid=uuid)
        if timesheet.status != 'submitted':
            return Response(
                {'error': 'Only submitted timesheets can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if timesheet.approved_by:
            return Response(
                {'error': 'This timesheet has already been approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        timesheet.status = 'rejected'
        timesheet.approved_by = request.user
        timesheet.approved_at = timezone.now()
        timesheet.rejection_reason = reason
        timesheet.save()
        serializer = self.get_serializer(timesheet)
        return Response(serializer.data)

    @extend_schema(
        description="Mark an approved timesheet as pending payment",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def send_for_payment(self, request, uuid=None):
        timesheet = Timesheet.objects.select_for_update().get(uuid=uuid)
        if timesheet.status != 'approved':
            return Response(
                {'error': 'Only approved timesheets can be sent for payment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if timesheet.sent_for_payment_at:
            return Response(
                {'error': 'This timesheet has already been sent for payment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        timesheet.status = 'pending_payment'
        timesheet.sent_for_payment_by = request.user
        timesheet.sent_for_payment_at = timezone.now()
        timesheet.save()
        serializer = self.get_serializer(timesheet)
        return Response(serializer.data)

    @extend_schema(
        description="Mark a pending payment timesheet as paid",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def mark_as_paid(self, request, uuid=None):
        timesheet = Timesheet.objects.select_for_update().get(uuid=uuid)
        if timesheet.status != 'pending_payment':
            return Response(
                {'error': 'Only pending payment timesheets can be marked as paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if timesheet.paid_at:
            return Response(
                {'error': 'This timesheet has already been marked as paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        timesheet.status = 'paid'
        timesheet.paid_by = request.user
        timesheet.paid_at = timezone.now()
        timesheet.save()
        serializer = self.get_serializer(timesheet)
        return Response(serializer.data)

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


@extend_schema(tags=['Employees'])
class EmployeeProfileViewSet(viewsets.ModelViewSet):
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
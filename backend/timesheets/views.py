from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from .models import Customer, Project, Timesheet, TimesheetDetail
from .serializers import CustomerSerializer, ProjectSerializer, TimesheetSerializer, TimesheetDetailSerializer

# Create your views here.

class IsOwnerOrManager(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow managers to do anything
        if request.user.is_staff:
            return True
        # Allow users to access their own timesheets
        return obj.user == request.user

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
        return Timesheet.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        description="Submit a timesheet for approval",
        responses={200: TimesheetSerializer}
    )
    @action(detail=True, methods=['post'])
    def submit(self, request, uuid=None):
        timesheet = self.get_object()
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
    def approve(self, request, uuid=None):
        timesheet = self.get_object()
        if timesheet.status != 'submitted':
            return Response(
                {'error': 'Only submitted timesheets can be approved'},
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
    def reject(self, request, uuid=None):
        timesheet = self.get_object()
        if timesheet.status != 'submitted':
            return Response(
                {'error': 'Only submitted timesheets can be rejected'},
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
    def send_for_payment(self, request, uuid=None):
        timesheet = self.get_object()
        if timesheet.status != 'approved':
            return Response(
                {'error': 'Only approved timesheets can be sent for payment'},
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
    def mark_as_paid(self, request, uuid=None):
        timesheet = self.get_object()
        if timesheet.status != 'pending_payment':
            return Response(
                {'error': 'Only pending payment timesheets can be marked as paid'},
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
        return TimesheetDetail.objects.filter(timesheet__user=user)

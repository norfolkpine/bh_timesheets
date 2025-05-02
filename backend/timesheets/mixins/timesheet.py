from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

class TimesheetSubmissionMixin:
    """Mixin to handle timesheet submission logic"""
    
    def _capture_rates_at_submission(self, timesheet):
        """Capture current rates when timesheet is submitted"""
        if timesheet.project.billing_type == 'hourly':
            timesheet.hourly_rate_at_submission = timesheet.project.hourly_rate
        elif timesheet.project.billing_type == 'daily':
            timesheet.daily_rate_at_submission = timesheet.project.daily_rate
        elif timesheet.project.billing_type == 'fixed':
            timesheet.fixed_price_at_submission = timesheet.project.fixed_price
        elif timesheet.project.billing_type == 'retainer':
            timesheet.retainer_amount_at_submission = timesheet.project.retainer_amount

    def submit_timesheet(self, request, uuid=None):
        """Submit a timesheet for approval"""
        timesheet = self.get_object()
        
        if timesheet.status != 'draft':
            return Response(
                {'error': 'Only draft timesheets can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Capture rates at submission time
        self._capture_rates_at_submission(timesheet)
        
        # Update timesheet status
        timesheet.status = 'submitted'
        timesheet.submitted_at = timezone.now()
        timesheet.save()
        
        serializer = self.get_serializer(timesheet)
        return Response(serializer.data)

    def approve_timesheet(self, request, uuid=None):
        """Approve a submitted timesheet"""
        timesheet = self.get_object()
        
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

    def reject_timesheet(self, request, uuid=None):
        """Reject a submitted timesheet"""
        timesheet = self.get_object()
        
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

    def send_for_payment(self, request, uuid=None):
        """Mark an approved timesheet as pending payment"""
        timesheet = self.get_object()
        
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

    def mark_as_paid(self, request, uuid=None):
        """Mark a pending payment timesheet as paid"""
        timesheet = self.get_object()
        
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
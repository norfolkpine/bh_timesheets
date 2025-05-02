from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction, connection
from datetime import datetime

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

    def _update_timestamp(self, timesheet, field_name):
        """Update a timestamp field using raw SQL to avoid timezone issues"""
        with connection.cursor() as cursor:
            cursor.execute(
                f"UPDATE timesheets_timesheet SET {field_name} = CURRENT_TIMESTAMP WHERE id = %s",
                [timesheet.id]
            )

    def submit_timesheet(self, request, uuid=None):
        """Submit a timesheet for approval"""
        timesheet = self.get_object()
        
        # Check if user is the timesheet owner
        if timesheet.user != request.user:
            return Response(
                {'error': 'Only the timesheet owner can submit it'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if timesheet.status != 'draft':
            return Response(
                {'error': 'Only draft timesheets can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                # Capture rates at submission time
                self._capture_rates_at_submission(timesheet)
                
                # Update timesheet status
                old_status = timesheet.status
                timesheet.status = 'submitted'
                timesheet.save(update_fields=['status', 'hourly_rate_at_submission', 
                                           'daily_rate_at_submission', 'fixed_price_at_submission', 
                                           'retainer_amount_at_submission'])
                
                # Log the status change
                if hasattr(self, '_log_change'):
                    self._log_change(
                        instance=timesheet,
                        field_name='status',
                        old_value=old_status,
                        new_value='submitted',
                        user=request.user,
                        notes='Timesheet submitted for approval'
                    )
                
                serializer = self.get_serializer(timesheet)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to submit timesheet: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def approve_timesheet(self, request, uuid=None):
        """Approve a submitted timesheet"""
        timesheet = self.get_object()
        
        # Check if user is a manager
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'manager':
            return Response(
                {'error': 'Only managers can approve timesheets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if timesheet.status != 'submitted':
            return Response(
                {'error': 'Only submitted timesheets can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                old_status = timesheet.status
                timesheet.status = 'approved'
                timesheet.approved_by = request.user
                timesheet.save(update_fields=['status', 'approved_by'])
                
                # Log the status change
                if hasattr(self, '_log_change'):
                    self._log_change(
                        instance=timesheet,
                        field_name='status',
                        old_value=old_status,
                        new_value='approved',
                        user=request.user,
                        notes='Timesheet approved'
                    )
                
                serializer = self.get_serializer(timesheet)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to approve timesheet: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def undo_approval(self, request, uuid=None):
        """Undo approval of a timesheet"""
        timesheet = self.get_object()
        
        # Check if user is a manager
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'manager':
            return Response(
                {'error': 'Only managers can undo approvals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if timesheet.status != 'approved':
            return Response(
                {'error': 'Only approved timesheets can have their approval undone'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                old_status = timesheet.status
                timesheet.status = 'submitted'
                timesheet.approved_by = None
                timesheet.approved_at = None
                timesheet.save(update_fields=['status', 'approved_by', 'approved_at'])
                
                # Log the status change
                if hasattr(self, '_log_change'):
                    self._log_change(
                        instance=timesheet,
                        field_name='status',
                        old_value=old_status,
                        new_value='submitted',
                        user=request.user,
                        notes='Timesheet approval undone'
                    )
                
                serializer = self.get_serializer(timesheet)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to undo timesheet approval: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def reject_timesheet(self, request, uuid=None):
        """Reject a submitted timesheet"""
        timesheet = self.get_object()
        
        # Check if user is a manager
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'manager':
            return Response(
                {'error': 'Only managers can reject timesheets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
            
        try:
            with transaction.atomic():
                old_status = timesheet.status
                timesheet.status = 'rejected'
                timesheet.rejection_reason = reason
                timesheet.save(update_fields=['status', 'rejection_reason'])
                
                # Log the status change
                if hasattr(self, '_log_change'):
                    self._log_change(
                        instance=timesheet,
                        field_name='status',
                        old_value=old_status,
                        new_value='rejected',
                        user=request.user,
                        notes=f'Timesheet rejected: {reason}'
                    )
                
                serializer = self.get_serializer(timesheet)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to reject timesheet: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def send_for_payment(self, request, uuid=None):
        """Mark an approved timesheet as pending payment"""
        timesheet = self.get_object()
        
        # Check if user is a manager
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'manager':
            return Response(
                {'error': 'Only managers can send timesheets for payment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
            
        try:
            with transaction.atomic():
                old_status = timesheet.status
                timesheet.status = 'pending_payment'
                timesheet.sent_for_payment_by = request.user
                timesheet.save(update_fields=['status', 'sent_for_payment_by'])
                
                # Log the status change
                if hasattr(self, '_log_change'):
                    self._log_change(
                        instance=timesheet,
                        field_name='status',
                        old_value=old_status,
                        new_value='pending_payment',
                        user=request.user,
                        notes='Timesheet sent for payment'
                    )
                
                serializer = self.get_serializer(timesheet)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to send timesheet for payment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def mark_as_paid(self, request, uuid=None):
        """Mark a pending payment timesheet as paid"""
        timesheet = self.get_object()
        
        # Check if user is a manager
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'manager':
            return Response(
                {'error': 'Only managers can mark timesheets as paid'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
            
        try:
            with transaction.atomic():
                old_status = timesheet.status
                timesheet.status = 'paid'
                timesheet.paid_by = request.user
                timesheet.save(update_fields=['status', 'paid_by'])
                
                # Log the status change
                if hasattr(self, '_log_change'):
                    self._log_change(
                        instance=timesheet,
                        field_name='status',
                        old_value=old_status,
                        new_value='paid',
                        user=request.user,
                        notes='Timesheet marked as paid'
                    )
                
                serializer = self.get_serializer(timesheet)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to mark timesheet as paid: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 
from django.conf import settings
from ..models import AuditLog

class AuditLogMixin:
    """Mixin to handle audit logging for model changes"""
    
    def _get_field_type(self, field_name):
        """Determine the type of field being changed"""
        if field_name in ['first_name', 'last_name', 'email']:
            return 'user_details'
        elif field_name in ['bank_name', 'account_number', 'sort_code']:
            return 'bank_details'
        elif field_name in ['hourly_rate', 'daily_rate', 'fixed_price', 'retainer_amount']:
            return 'rate'
        elif field_name == 'status':
            return 'status'
        return 'other'

    def _log_change(self, instance, field_name, old_value, new_value, user, notes=None):
        """Create an audit log entry for a field change"""
        if old_value != new_value:
            AuditLog.objects.create(
                record_type=instance._meta.model_name,
                record_uuid=instance.uuid,
                field_type=self._get_field_type(field_name),
                field_name=field_name,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
                changed_by=user,
                notes=notes
            )

    def _log_changes(self, instance, validated_data, user, notes=None):
        """Log changes for multiple fields"""
        for field_name, new_value in validated_data.items():
            if hasattr(instance, field_name):
                old_value = getattr(instance, field_name)
                self._log_change(instance, field_name, old_value, new_value, user, notes) 
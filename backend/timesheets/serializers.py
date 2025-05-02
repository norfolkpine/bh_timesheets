from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from .models import Customer, Project, Timesheet, TimesheetDetail, EmployeeProfile, AuditLog, RateHistory, Invoice

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'email']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    remember = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                email=email,
                password=password
            )
            
            if user:
                if not user.is_active:
                    raise serializers.ValidationError('User account is disabled.')
                data['user'] = user
                return data
            raise serializers.ValidationError('Invalid email or password.')
        raise serializers.ValidationError('Must include "email" and "password".')

from dj_rest_auth.registration.serializers import RegisterSerializer

class CustomRegisterSerializer(RegisterSerializer):
    username = None

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data.pop('username', None)
        return data


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['uuid', 'name', 'email', 'phone', 'contact_name', 'address', 'notes', 'is_active']

class ProjectSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_uuid = serializers.UUIDField(write_only=True)

    class Meta:
        model = Project
        fields = ['uuid', 'name', 'customer', 'customer_uuid', 'description', 'billing_type', 
                 'hourly_rate', 'daily_rate', 'fixed_price', 'retainer_amount', 'is_active']

    def create(self, validated_data):
        customer_uuid = validated_data.pop('customer_uuid')
        customer = Customer.objects.get(uuid=customer_uuid)
        return Project.objects.create(customer=customer, **validated_data)

    def update(self, instance, validated_data):
        if 'customer_uuid' in validated_data:
            customer_uuid = validated_data.pop('customer_uuid')
            instance.customer = Customer.objects.get(uuid=customer_uuid)
        return super().update(instance, validated_data)

class TimesheetDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimesheetDetail
        fields = ['uuid', 'day', 'date', 'hours', 'start_time', 'end_time', 'break_minutes', 
                 'use_detailed_time', 'note']

class RateHistorySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    rate_type_display = serializers.CharField(source='get_rate_type_display', read_only=True)

    class Meta:
        model = RateHistory
        fields = [
            'uuid', 'rate_type', 'rate_type_display', 'employee', 'project',
            'rate', 'effective_from', 'effective_to', 'notes',
            'created_by_name', 'created_at'
        ]
        read_only_fields = ['uuid', 'created_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return None

class TimesheetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    project_uuid = serializers.UUIDField(write_only=True)
    details = TimesheetDetailSerializer(many=True, read_only=True)
    details_data = serializers.ListField(write_only=True, required=False)
    approved_by = UserSerializer(read_only=True)
    sent_for_payment_by = UserSerializer(read_only=True)
    paid_by = UserSerializer(read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Timesheet
        fields = [
            'uuid', 'user', 'project', 'project_uuid', 'week_starting', 'status',
            'total_hours', 'total_amount', 'notes', 'submitted_at', 'approved_by', 'approved_at',
            'rejection_reason', 'sent_for_payment_at', 'sent_for_payment_by',
            'paid_at', 'paid_by', 'details', 'details_data',
            'hourly_rate_at_submission', 'daily_rate_at_submission',
            'fixed_price_at_submission', 'retainer_amount_at_submission'
        ]

    def create(self, validated_data):
        details_data = validated_data.pop('details_data', [])
        project_uuid = validated_data.pop('project_uuid')
        project = Project.objects.get(uuid=project_uuid)
        timesheet = Timesheet.objects.create(
            user=self.context['request'].user,
            project=project,
            **validated_data
        )
        
        # Create details
        for detail in details_data:
            TimesheetDetail.objects.create(timesheet=timesheet, **detail)
        
        return timesheet

    def update(self, instance, validated_data):
        details_data = validated_data.pop('details_data', None)
        if 'project_uuid' in validated_data:
            project_uuid = validated_data.pop('project_uuid')
            instance.project = Project.objects.get(uuid=project_uuid)
        
        # Update timesheet
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update details if provided
        if details_data is not None:
            # Delete existing details
            instance.details.all().delete()
            # Create new details
            for detail in details_data:
                TimesheetDetail.objects.create(timesheet=instance, **detail)
        
        return instance 
    

class EmployeeProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True, allow_null=True)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_null=True, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            'uuid', 'name', 'email', 'first_name', 'last_name', 'role', 'employee_id', 
            'department', 'position', 'hourly_rate', 'bank_name', 'account_number', 
            'sort_code', 'tax_id', 'address', 'phone', 'start_date', 'is_active', 
            'notes', 'created_at'
        ]
        read_only_fields = ['uuid', 'created_at', 'employee_id']

    def get_name(self, obj):
        if not obj.user:
            return ''
        return obj.user.get_full_name() or ''

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure all user-related fields have default values if user is None
        if not instance.user:
            data.update({
                'name': '',
                'email': None,
                'first_name': '',
                'last_name': ''
            })
        return data

    def validate(self, data):
        # Validate bank details if provided
        bank_fields = ['bank_name', 'account_number', 'sort_code']
        if any(data.get(field) for field in bank_fields):
            if not all(data.get(field) for field in bank_fields):
                raise serializers.ValidationError(
                    "If any bank details are provided, all bank details must be provided."
                )
        return data

    def update(self, instance, validated_data):
        # Handle nested user data
        user_data = validated_data.pop('user', {})
        if user_data and instance.user:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

class AuditLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'uuid', 'record_type', 'record_uuid', 'field_type', 'field_name',
            'old_value', 'new_value', 'changed_by_name', 'changed_at', 'notes'
        ]
        read_only_fields = fields

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.email
        return None

class InvoiceSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    timesheets = TimesheetSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    # Write-only fields for creation/update
    customer_uuid = serializers.UUIDField(write_only=True)
    project_uuid = serializers.UUIDField(write_only=True)
    timesheet_uuids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Invoice
        fields = [
            'uuid', 'invoice_number', 'customer', 'customer_uuid', 'project', 'project_uuid',
            'start_date', 'end_date', 'total_hours', 'hourly_rate', 'daily_rate',
            'fixed_price', 'retainer_amount', 'total_amount', 'status', 'due_date',
            'sent_date', 'paid_date', 'timesheets', 'timesheet_uuids', 'notes',
            'terms', 'created_by', 'created_at', 'updated_at', 'is_overdue'
        ]
        read_only_fields = [
            'uuid', 'invoice_number', 'created_at', 'updated_at', 'sent_date',
            'paid_date', 'created_by'
        ]

    def create(self, validated_data):
        # Extract UUIDs for relationships
        customer_uuid = validated_data.pop('customer_uuid')
        project_uuid = validated_data.pop('project_uuid')
        timesheet_uuids = validated_data.pop('timesheet_uuids', [])

        # Get related objects
        customer = Customer.objects.get(uuid=customer_uuid)
        project = Project.objects.get(uuid=project_uuid)
        timesheets = Timesheet.objects.filter(uuid__in=timesheet_uuids) if timesheet_uuids else []

        # Create invoice
        invoice = Invoice.objects.create(
            customer=customer,
            project=project,
            created_by=self.context['request'].user,
            **validated_data
        )

        # Add timesheets
        if timesheets:
            invoice.timesheets.set(timesheets)

        return invoice

    def update(self, instance, validated_data):
        # Handle customer and project updates
        if 'customer_uuid' in validated_data:
            customer_uuid = validated_data.pop('customer_uuid')
            instance.customer = Customer.objects.get(uuid=customer_uuid)
        
        if 'project_uuid' in validated_data:
            project_uuid = validated_data.pop('project_uuid')
            instance.project = Project.objects.get(uuid=project_uuid)

        # Handle timesheet updates
        if 'timesheet_uuids' in validated_data:
            timesheet_uuids = validated_data.pop('timesheet_uuids')
            timesheets = Timesheet.objects.filter(uuid__in=timesheet_uuids)
            instance.timesheets.set(timesheets)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance
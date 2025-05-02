from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from .models import Customer, Project, Timesheet, TimesheetDetail

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
        fields = ['uuid', 'day', 'hours', 'start_time', 'end_time', 'break_minutes', 
                 'use_detailed_time', 'note']

class TimesheetSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    project_uuid = serializers.UUIDField(write_only=True)
    details = TimesheetDetailSerializer(many=True, read_only=True)
    details_data = serializers.ListField(write_only=True, required=False)
    approved_by = UserSerializer(read_only=True)
    sent_for_payment_by = UserSerializer(read_only=True)
    paid_by = UserSerializer(read_only=True)

    class Meta:
        model = Timesheet
        fields = ['uuid', 'user', 'project', 'project_uuid', 'week_starting', 'status',
                 'total_hours', 'notes', 'submitted_at', 'approved_by', 'approved_at',
                 'rejection_reason', 'sent_for_payment_at', 'sent_for_payment_by',
                 'paid_at', 'paid_by', 'details', 'details_data']

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
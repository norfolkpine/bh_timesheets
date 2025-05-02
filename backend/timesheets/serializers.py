from rest_framework import serializers
from .models import Customer, Project, Timesheet, TimesheetDetail

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class TimesheetDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimesheetDetail
        fields = '__all__'

class TimesheetSerializer(serializers.ModelSerializer):
    details = TimesheetDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Timesheet
        fields = '__all__' 
from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Customer, Project, Timesheet, TimesheetDetail
from .serializers import CustomerSerializer, ProjectSerializer, TimesheetSerializer, TimesheetDetailSerializer

# Create your views here.

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    lookup_field = 'uuid'

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    lookup_field = 'uuid'

class TimesheetViewSet(viewsets.ModelViewSet):
    queryset = Timesheet.objects.all()
    serializer_class = TimesheetSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

class TimesheetDetailViewSet(viewsets.ModelViewSet):
    queryset = TimesheetDetail.objects.all()
    serializer_class = TimesheetDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

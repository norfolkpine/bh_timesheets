from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet, ProjectViewSet, TimesheetViewSet, 
    TimesheetDetailViewSet, EmployeeProfileViewSet, AuditLogViewSet,
    RateHistoryViewSet, InvoiceViewSet
)
from . import views

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'timesheets', TimesheetViewSet, basename='timesheet')
router.register(r'timesheet-details', TimesheetDetailViewSet, basename='timesheet-detail')
router.register(r'employees', EmployeeProfileViewSet, basename='employee-profile')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'rate-history', RateHistoryViewSet, basename='rate-history')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
    path('user-info/', views.current_user_info, name='user-info'),
]
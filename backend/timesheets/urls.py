from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ProjectViewSet, TimesheetViewSet, TimesheetDetailViewSet, EmployeeProfileViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'timesheets', TimesheetViewSet, basename='timesheet')
router.register(r'timesheet-details', TimesheetDetailViewSet, basename='timesheet-detail')
router.register(r'employees', EmployeeProfileViewSet, basename='employee-profile')


urlpatterns = [
    path('', include(router.urls)),
] 
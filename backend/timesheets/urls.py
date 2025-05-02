from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ProjectViewSet, TimesheetViewSet, TimesheetDetailViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'timesheets', TimesheetViewSet, basename='timesheet')
router.register(r'timesheet-details', TimesheetDetailViewSet, basename='timesheet-detail')

urlpatterns = [
    path('', include(router.urls)),
] 
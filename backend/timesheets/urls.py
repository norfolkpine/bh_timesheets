from rest_framework import routers
from .views import CustomerViewSet, ProjectViewSet, TimesheetViewSet, TimesheetDetailViewSet
from django.urls import path, include

router = routers.DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'timesheets', TimesheetViewSet)
router.register(r'timesheet-details', TimesheetDetailViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 
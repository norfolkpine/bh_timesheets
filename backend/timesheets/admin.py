from django.contrib import admin
from .models import Customer, Project, Timesheet, TimesheetDetail

admin.site.register(Customer)
admin.site.register(Project)
admin.site.register(Timesheet)
admin.site.register(TimesheetDetail)

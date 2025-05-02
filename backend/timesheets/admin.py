from django.contrib import admin
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Customer, Project, Timesheet, TimesheetDetail, EmployeeProfile

User = get_user_model()

# === Custom Forms ===

class ProjectAdminForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = '__all__'
        widgets = {
            'customer': forms.Select(attrs={'class': 'select2'}),
        }

class TimesheetAdminForm(forms.ModelForm):
    class Meta:
        model = Timesheet
        fields = '__all__'
        widgets = {
            'user': forms.Select(attrs={'class': 'select2'}),
            'project': forms.Select(attrs={'class': 'select2'}),
        }

class TimesheetDetailAdminForm(forms.ModelForm):
    class Meta:
        model = TimesheetDetail
        fields = '__all__'
        widgets = {
            'timesheet': forms.Select(attrs={'class': 'select2'}),
            'note': forms.Textarea(attrs={'rows': 3}),
        }

# === Employee Profile Inline ===

class EmployeeProfileInline(admin.StackedInline):
    model = EmployeeProfile
    can_delete = False
    verbose_name_plural = "Employee Profile"
    fk_name = 'user'

class CustomUserAdmin(BaseUserAdmin):
    inlines = (EmployeeProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    list_select_related = ('profile',)

# Unregister the original User and re-register with extended admin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# === Model Admins ===

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'employee_id', 'role', 'department', 'position',
        'hourly_rate', 'is_active', 'start_date'
    )
    search_fields = ('user__email', 'employee_id', 'department', 'position')
    list_filter = ('role', 'department', 'is_active')

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'is_active', 'created_at', 'updated_at')
    search_fields = ('name', 'email', 'phone', 'contact_name')
    list_filter = ('is_active', 'created_at', 'updated_at')
    ordering = ('name',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectAdminForm
    list_display = ('name', 'customer', 'billing_type', 'is_active', 'created_at')
    list_filter = ('billing_type', 'is_active', 'customer', 'created_at')
    search_fields = ('name', 'customer__name', 'description')
    raw_id_fields = ('customer',)
    ordering = ('-created_at',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "customer":
            kwargs["queryset"] = Customer.objects.filter(is_active=True).order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Timesheet)
class TimesheetAdmin(admin.ModelAdmin):
    form = TimesheetAdminForm
    list_display = ('user', 'project', 'week_starting', 'total_hours', 'status', 'created_at')
    list_filter = ('status', 'week_starting', 'project', 'user')
    search_fields = ('user__email', 'project__name', 'notes')
    raw_id_fields = ('approved_by', 'sent_for_payment_by', 'paid_by')
    ordering = ('-week_starting',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(is_active=True).order_by('email')
        elif db_field.name == "project":
            kwargs["queryset"] = Project.objects.filter(is_active=True).order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(TimesheetDetail)
class TimesheetDetailAdmin(admin.ModelAdmin):
    form = TimesheetDetailAdminForm
    list_display = ('timesheet', 'day', 'hours', 'start_time', 'end_time', 'break_minutes', 'use_detailed_time')
    list_filter = ('day', 'use_detailed_time', 'timesheet__week_starting')
    search_fields = ('note', 'timesheet__user__email', 'timesheet__project__name')
    raw_id_fields = ('timesheet',)
    ordering = ('-timesheet__week_starting', 'day')
    fieldsets = (
        (None, {
            'fields': ('timesheet', 'day', 'hours', 'use_detailed_time')
        }),
        ('Detailed Time', {
            'fields': ('start_time', 'end_time', 'break_minutes'),
            'classes': ('collapse',),
            'description': 'Fill these fields if you want to use detailed time tracking'
        }),
        ('Notes', {
            'fields': ('note',),
            'classes': ('collapse',),
            'description': 'Optional notes for this day'
        }),
    )

from django.contrib import admin
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Customer, Project, Timesheet, TimesheetDetail, EmployeeProfile, AuditLog, RateHistory

User = get_user_model()

# === Custom Forms ===

class ProjectAdminForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = '__all__'

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

class ProjectInline(admin.StackedInline):
    model = Project
    extra = 1
    fields = ('name', 'billing_type', 'is_active', 'description')

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'is_active', 'created_at', 'updated_at')
    search_fields = ('name', 'email', 'phone', 'contact_name')
    list_filter = ('is_active', 'created_at', 'updated_at')
    ordering = ('name',)
    inlines = [ProjectInline]

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectAdminForm
    list_display = ('name', 'customer', 'billing_type', 'is_active', 'created_at')
    list_filter = ('billing_type', 'is_active', 'customer', 'created_at')
    search_fields = ('name', 'customer__name', 'description')
    autocomplete_fields = ['customer']
    ordering = ('-created_at',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "customer":
            kwargs["queryset"] = Customer.objects.filter(is_active=True).order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Timesheet)
class TimesheetAdmin(admin.ModelAdmin):
    form = TimesheetAdminForm
    list_display = ('uuid', 'user', 'project', 'week_starting', 'total_hours', 'status', 'created_at')
    list_filter = ('status', 'week_starting', 'project', 'user')
    search_fields = ('user__email', 'project__name', 'notes', 'uuid')
    raw_id_fields = ('approved_by', 'sent_for_payment_by', 'paid_by')
    ordering = ('-week_starting',)
    readonly_fields = ('uuid', 'created_at', 'updated_at')
    actions = ['undo_approval']

    def undo_approval(self, request, queryset):
        """Undo approval of selected timesheets"""
        updated = 0
        for timesheet in queryset:
            if timesheet.status == 'approved':
                timesheet.status = 'submitted'
                timesheet.approved_by = None
                timesheet.approved_at = None
                timesheet.save()
                updated += 1
        
        if updated == 1:
            message = "1 timesheet was successfully unapproved."
        else:
            message = f"{updated} timesheets were successfully unapproved."
        self.message_user(request, message)
    undo_approval.short_description = "Undo approval of selected timesheets"

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(is_active=True).order_by('email')
        elif db_field.name == "project":
            kwargs["queryset"] = Project.objects.filter(is_active=True).order_by('name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(TimesheetDetail)
class TimesheetDetailAdmin(admin.ModelAdmin):
    form = TimesheetDetailAdminForm
    list_display = ('uuid', 'timesheet', 'day', 'hours', 'start_time', 'end_time', 'break_minutes', 'use_detailed_time')
    list_filter = ('day', 'use_detailed_time', 'timesheet__week_starting')
    search_fields = ('note', 'timesheet__user__email', 'timesheet__project__name', 'uuid')
    raw_id_fields = ('timesheet',)
    ordering = ('-timesheet__week_starting', 'day')
    readonly_fields = ('uuid', 'created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('uuid', 'timesheet', 'day', 'hours', 'use_detailed_time')
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

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('record_type', 'field_name', 'changed_by', 'changed_at', 'record_uuid')
    list_filter = ('record_type', 'field_type', 'changed_at')
    search_fields = ('field_name', 'old_value', 'new_value', 'notes', 'record_uuid')
    readonly_fields = ('uuid', 'record_type', 'record_uuid', 'field_type', 'field_name', 
                      'old_value', 'new_value', 'changed_by', 'changed_at', 'notes')
    ordering = ('-changed_at',)
    
    def has_add_permission(self, request):
        return False  # Audit logs should only be created by the system
    
    def has_change_permission(self, request, obj=None):
        return False  # Audit logs should not be editable
    
    def has_delete_permission(self, request, obj=None):
        return False  # Audit logs should not be deletable

@admin.register(RateHistory)
class RateHistoryAdmin(admin.ModelAdmin):
    list_display = ('rate_type', 'employee', 'project', 'rate', 'effective_from', 'effective_to', 'created_by', 'created_at')
    list_filter = ('rate_type', 'effective_from', 'effective_to')
    search_fields = ('employee__user__email', 'project__name', 'notes')
    readonly_fields = ('uuid', 'created_at')
    raw_id_fields = ('employee', 'project', 'created_by')
    ordering = ('-effective_from',)
    
    def has_add_permission(self, request):
        return request.user.is_staff  # Only staff can add rate history
    
    def has_change_permission(self, request, obj=None):
        return request.user.is_staff  # Only staff can modify rate history
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_staff  # Only staff can delete rate history

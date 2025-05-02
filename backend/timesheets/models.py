from django.db import models
from django.conf import settings
import uuid
from decimal import Decimal
from django.contrib.auth.models import User
from datetime import timedelta
from django.utils import timezone

# Create your models here.

class Customer(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Project(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    BILLING_TYPE_CHOICES = [
        ("hourly", "Hourly"),
        ("daily", "Daily"),
        ("fixed", "Fixed"),
        ("retainer", "Retainer"),
    ]
    name = models.CharField(max_length=255)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="projects")
    description = models.TextField(blank=True, null=True)
    billing_type = models.CharField(max_length=20, choices=BILLING_TYPE_CHOICES)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    fixed_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    retainer_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Timesheet(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("paid", "Paid"),
        ("pending_payment", "Pending Payment"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="timesheets")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="timesheets")
    week_starting = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="approved_timesheets")
    approved_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    sent_for_payment_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    sent_for_payment_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="sent_for_payment_timesheets")
    paid_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="paid_timesheets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Add fields to store the rate at the time of submission
    hourly_rate_at_submission = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    daily_rate_at_submission = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fixed_price_at_submission = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    retainer_amount_at_submission = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"Timesheet {self.id} - {self.user} - {self.week_starting}"

    def save(self, *args, **kwargs):
        # If this is a new timesheet or being submitted for the first time
        if not self.pk or (self.status == 'submitted' and not self.hourly_rate_at_submission):
            # Store the current rates
            if self.project.billing_type == 'hourly':
                self.hourly_rate_at_submission = self.project.hourly_rate
            elif self.project.billing_type == 'daily':
                self.daily_rate_at_submission = self.project.daily_rate
            elif self.project.billing_type == 'fixed':
                self.fixed_price_at_submission = self.project.fixed_price
            elif self.project.billing_type == 'retainer':
                self.retainer_amount_at_submission = self.project.retainer_amount
        
        # Calculate total hours from details
        total = Decimal('0.00')
        for detail in self.details.all():
            if detail.hours:
                total += Decimal(str(detail.hours))
        self.total_hours = total
        super().save(*args, **kwargs)

    def update_total_hours(self):
        """Force update of total hours from details"""
        total = Decimal('0.00')
        for detail in self.details.all():
            if detail.hours:
                total += Decimal(str(detail.hours))
        self.total_hours = total
        self.save(update_fields=['total_hours'])

    @property
    def hours_array(self):
        """Return an array of 7 hours (one for each day of the week)"""
        hours = [Decimal('0.00')] * 7
        for detail in self.details.all():
            if 0 <= detail.day < 7:  # Ensure day is valid
                hours[detail.day] = detail.hours or Decimal('0.00')
        return hours

    @property
    def day_notes_array(self):
        """Return an array of 7 notes (one for each day of the week)"""
        notes = [''] * 7
        for detail in self.details.all():
            if 0 <= detail.day < 7:  # Ensure day is valid
                notes[detail.day] = detail.note or ''
        return notes

    @property
    def total_amount(self):
        """Calculate the total amount based on the rates at submission time"""
        if self.project.billing_type == 'hourly':
            return self.total_hours * (self.hourly_rate_at_submission or 0)
        elif self.project.billing_type == 'daily':
            return (self.total_hours / 8) * (self.daily_rate_at_submission or 0)
        elif self.project.billing_type == 'fixed':
            return self.fixed_price_at_submission or 0
        elif self.project.billing_type == 'retainer':
            return self.retainer_amount_at_submission or 0
        return 0

class TimesheetDetail(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name="details")
    day = models.PositiveSmallIntegerField()  # 0=Monday, 6=Sunday
    date = models.DateField()  # The actual date for this timesheet detail
    hours = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    break_minutes = models.PositiveSmallIntegerField(blank=True, null=True)
    use_detailed_time = models.BooleanField(default=False)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Detail for {self.timesheet} day {self.day}"

    def save(self, *args, **kwargs):
        # Calculate hours from start/end time if detailed time is used
        if self.use_detailed_time and self.start_time and self.end_time:
            start_minutes = self.start_time.hour * 60 + self.start_time.minute
            end_minutes = self.end_time.hour * 60 + self.end_time.minute
            break_minutes = self.break_minutes or 0
            total_minutes = end_minutes - start_minutes - break_minutes
            self.hours = Decimal(str(total_minutes / 60))
        
        # Calculate the date based on week_starting and day if not set
        if not self.date and self.timesheet:
            # Convert day (0-6) to timedelta days (0-6)
            self.date = self.timesheet.week_starting + timedelta(days=self.day)
        
        # Save the detail
        super().save(*args, **kwargs)
        
        # Update the timesheet's total hours
        if self.timesheet:
            self.timesheet.update_total_hours()

    class Meta:
        unique_together = ('timesheet', 'day')  # Ensure only one detail per day per timesheet

class EmployeeProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    
    role = models.CharField(max_length=20, choices=[("employee", "Employee"), ("manager", "Manager")])
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    sort_code = models.CharField(max_length=20, blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id})"

    class Meta:
        ordering = ['-created_at', 'employee_id']  # Order by newest first, then by employee_id

class AuditLog(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    RECORD_TYPE_CHOICES = [
        ('employee_profile', 'Employee Profile'),
        ('customer', 'Customer'),
        ('project', 'Project'),
        ('timesheet', 'Timesheet'),
    ]
    
    FIELD_TYPE_CHOICES = [
        ('user_details', 'User Details'),
        ('bank_details', 'Bank Details'),
        ('rate', 'Rate'),
        ('status', 'Status'),
        ('other', 'Other'),
    ]
    
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES)
    record_uuid = models.UUIDField(db_index=True)  # UUID of the changed record
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    field_name = models.CharField(max_length=100)  # Name of the changed field
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['record_type', 'record_uuid']),
            models.Index(fields=['field_type']),
            models.Index(fields=['changed_at']),
        ]

    def __str__(self):
        return f"{self.record_type} - {self.field_name} changed at {self.changed_at}"

class RateHistory(models.Model):
    """Tracks historical rates for employees and projects"""
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    RATE_TYPE_CHOICES = [
        ('employee_hourly', 'Employee Hourly Rate'),
        ('project_hourly', 'Project Hourly Rate'),
        ('project_daily', 'Project Daily Rate'),
        ('project_fixed', 'Project Fixed Rate'),
        ('project_retainer', 'Project Retainer Rate'),
    ]
    
    rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='rate_history')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='rate_history')
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)  # Null means currently active
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_rate_changes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-effective_from']
        indexes = [
            models.Index(fields=['rate_type', 'effective_from']),
            models.Index(fields=['employee', 'effective_from']),
            models.Index(fields=['project', 'effective_from']),
        ]

    def __str__(self):
        if self.employee:
            return f"{self.employee} - {self.get_rate_type_display()} - {self.rate} ({self.effective_from})"
        return f"{self.project} - {self.get_rate_type_display()} - {self.rate} ({self.effective_from})"

    def save(self, *args, **kwargs):
        # If this is a new rate, end the previous rate
        if not self.pk:  # Only for new records
            if self.employee:
                RateHistory.objects.filter(
                    employee=self.employee,
                    rate_type=self.rate_type,
                    effective_to__isnull=True
                ).update(effective_to=self.effective_from)
            elif self.project:
                RateHistory.objects.filter(
                    project=self.project,
                    rate_type=self.rate_type,
                    effective_to__isnull=True
                ).update(effective_to=self.effective_from)
        super().save(*args, **kwargs)

class Invoice(models.Model):
    """Stores invoice data separately from timesheets for historical accuracy"""
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="invoices")
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name="invoices")
    
    # Invoice period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Financial data
    total_hours = models.DecimalField(max_digits=10, decimal_places=2)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fixed_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    retainer_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status tracking
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
        ("cancelled", "Cancelled"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    
    # Dates
    due_date = models.DateField()
    sent_date = models.DateTimeField(null=True, blank=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    
    # Related timesheets
    timesheets = models.ManyToManyField(Timesheet, related_name="invoices")
    
    # Additional information
    notes = models.TextField(blank=True, null=True)
    terms = models.TextField(blank=True, null=True)
    
    # Audit fields
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_invoices")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer.name}"

    def save(self, *args, **kwargs):
        # Generate invoice number if not provided
        if not self.invoice_number:
            last_invoice = Invoice.objects.order_by('-created_at').first()
            if last_invoice:
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                self.invoice_number = f"INV-{str(last_number + 1).zfill(6)}"
            else:
                self.invoice_number = f"INV-{str(1).zfill(6)}"
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Check if the invoice is overdue"""
        if self.status in ['paid', 'cancelled']:
            return False
        return timezone.now().date() > self.due_date

    def mark_as_sent(self):
        """Mark invoice as sent"""
        self.status = 'sent'
        self.sent_date = timezone.now()
        self.save(update_fields=['status', 'sent_date'])

    def mark_as_paid(self):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_date = timezone.now()
        self.save(update_fields=['status', 'paid_date'])

    def mark_as_overdue(self):
        """Mark invoice as overdue"""
        if self.status not in ['paid', 'cancelled']:
            self.status = 'overdue'
            self.save(update_fields=['status'])
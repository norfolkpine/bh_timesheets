from django.db import models
from django.conf import settings
import uuid
from decimal import Decimal

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
    submitted_at = models.DateTimeField(blank=True, null=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="approved_timesheets")
    approved_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    sent_for_payment_at = models.DateTimeField(blank=True, null=True)
    sent_for_payment_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="sent_for_payment_timesheets")
    paid_at = models.DateTimeField(blank=True, null=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="paid_timesheets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Timesheet {self.id} - {self.user} - {self.week_starting}"

    def save(self, *args, **kwargs):
        # Calculate total hours from details
        if self.id:  # Only calculate if the timesheet exists
            total = Decimal('0.00')
            for detail in self.details.all():
                if detail.hours:
                    total += Decimal(str(detail.hours))
            self.total_hours = total
        super().save(*args, **kwargs)

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

class TimesheetDetail(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    timesheet = models.ForeignKey(Timesheet, on_delete=models.CASCADE, related_name="details")
    day = models.PositiveSmallIntegerField()  # 0=Monday, 6=Sunday
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
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('timesheet', 'day')  # Ensure only one detail per day per timesheet

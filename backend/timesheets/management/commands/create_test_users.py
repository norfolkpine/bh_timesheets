from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from timesheets.models import EmployeeProfile  # Update with your actual app name

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates test users with different roles'

    def handle(self, *args, **options):
        # Create manager user
        manager, created = User.objects.get_or_create(
            username='manager',
            email='manager@example.com',
            defaults={
                'first_name': 'Manager',
                'last_name': 'User',
                'is_active': True
            }
        )
        
        if created:
            manager.set_password('password123')
            manager.save()
            EmployeeProfile.objects.create(
                user=manager,
                role='manager',
                employee_id='MGR001'
            )
            self.stdout.write(self.style.SUCCESS(f'Created manager user: {manager.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Manager user already exists: {manager.email}'))
            
        # Create employee user
        employee, created = User.objects.get_or_create(
            username='employee',
            email='employee@example.com',
            defaults={
                'first_name': 'Employee',
                'last_name': 'User',
                'is_active': True
            }
        )
        
        if created:
            employee.set_password('password123')
            employee.save()
            EmployeeProfile.objects.create(
                user=employee,
                role='employee',
                employee_id='EMP001'
            )
            self.stdout.write(self.style.SUCCESS(f'Created employee user: {employee.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Employee user already exists: {employee.email}'))
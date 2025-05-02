from django.core.management.base import BaseCommand
import psycopg2
from django.conf import settings

class Command(BaseCommand):
    help = 'Drops and recreates the database'

    def handle(self, *args, **options):
        db_name = settings.DATABASES['default']['NAME']
        db_user = settings.DATABASES['default']['USER']
        db_password = settings.DATABASES['default']['PASSWORD']
        db_host = settings.DATABASES['default']['HOST']
        db_port = settings.DATABASES['default']['PORT']

        # Connect to postgres database to drop/create the target database
        conn = psycopg2.connect(
            dbname='postgres',
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.autocommit = True
        cursor = conn.cursor()

        try:
            # Drop the database if it exists
            cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
            self.stdout.write(f"Dropped database {db_name}")

            # Create the database
            cursor.execute(f"CREATE DATABASE {db_name} OWNER {db_user}")
            self.stdout.write(self.style.SUCCESS(f'Successfully created database {db_name}'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
        finally:
            cursor.close()
            conn.close() 
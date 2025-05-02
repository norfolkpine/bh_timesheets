# Setup Guide

This guide will help you set up the development environment for the Timesheets project.

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm (comes with Node.js)
- Git

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up the database:
   ```bash
   python manage.py migrate
   ```

5. Create a superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following content:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Running the Development Servers

1. Make the start script executable:
   ```bash
   chmod +x start.sh
   ```

2. Run the development servers:
   ```bash
   ./start.sh
   ```

This will start:
- Backend server at http://localhost:8000
- Frontend server at http://localhost:3000

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Check if any other services are running on ports 8000 or 3000
   - Kill the processes using these ports or change the ports in the configuration

2. **Database connection issues**
   - Ensure the database service is running
   - Check database credentials in settings.py

3. **Node modules issues**
   - Delete node_modules folder and package-lock.json
   - Run `npm install` again

4. **Python virtual environment issues**
   - Ensure you're using the correct Python version
   - Recreate the virtual environment if necessary

## Next Steps

- Read the [Architecture](./architecture.md) documentation
- Review the [API Documentation](./api.md)
- Check the [Frontend Guide](./frontend.md) for frontend development details 
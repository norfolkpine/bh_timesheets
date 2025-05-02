# Ben Heath Pty Ltd Timesheets Documentation

## Project Overview
This is a full-stack timesheet management application built with Django (backend) and Next.js (frontend).

## Documentation Structure
- [Setup Guide](./setup.md) - How to set up the development environment
- [Architecture](./architecture.md) - System architecture and design decisions
- [API Documentation](./api.md) - Backend API endpoints and usage
- [Frontend Guide](./frontend.md) - Frontend development guide
- [Deployment](./deployment.md) - Deployment instructions
- [Development Workflow](./development.md) - Development workflow and best practices

## Quick Start
1. Clone the repository
2. Follow the [Setup Guide](./setup.md) to set up your development environment
3. Run the development servers using the start script:
   ```bash
   ./start.sh
   ```

## Project Structure
```
bh_timesheets/
├── backend/           # Django backend
│   ├── bh_timesheets/ # Main Django project
│   ├── timesheets/    # Timesheets app
│   ├── core/         # Core functionality
│   └── manage.py     # Django management script
├── frontend/         # Next.js frontend
│   ├── app/         # Next.js app directory
│   ├── components/  # React components
│   └── public/      # Static files
├── docs/            # Documentation
└── start.sh         # Development server startup script
```

## Contributing
Please read our [Development Workflow](./development.md) guide for details on our code of conduct and the process for submitting pull requests. 
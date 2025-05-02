# System Architecture

## Overview

The Ben Heath Pty Ltd Timesheets application follows a modern web application architecture with separate frontend and backend services.

## System Components

### Backend (Django)

The backend is built using Django and follows a RESTful architecture:

- **Django Framework**: Provides the core web framework
- **Django REST Framework**: Handles API endpoints and serialization
- **Database**: PostgreSQL for data persistence
- **Authentication**: JWT-based authentication system

### Frontend (Next.js)

The frontend is built using Next.js and follows modern React practices:

- **Next.js**: React framework for server-side rendering and routing
- **React**: UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI components

## Data Flow

1. **Client Request**:
   - User interacts with the Next.js frontend
   - Frontend makes API calls to Django backend

2. **Backend Processing**:
   - Django receives API requests
   - Processes data through views and serializers
   - Interacts with database through models
   - Returns JSON responses

3. **Frontend Rendering**:
   - Receives API responses
   - Updates state management
   - Renders UI components
   - Updates user interface

## Security

- JWT-based authentication
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection

## Development Architecture

```
bh_timesheets/
├── backend/
│   ├── bh_timesheets/    # Django project settings
│   ├── timesheets/       # Main timesheet app
│   │   ├── models.py     # Database models
│   │   ├── views.py      # API views
│   │   ├── urls.py       # URL routing
│   │   └── serializers.py # Data serialization
│   └── core/            # Shared functionality
├── frontend/
│   ├── app/             # Next.js app directory
│   │   ├── api/         # API integration
│   │   ├── components/  # React components
│   │   └── pages/       # Page components
│   └── public/          # Static assets
└── docs/               # Documentation
```

## API Architecture

The API follows RESTful principles:

- **Resources**: Timesheets, Users, Projects
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Response Format**: JSON
- **Authentication**: JWT tokens in Authorization header

## Frontend Architecture

The frontend follows a component-based architecture:

- **Pages**: Top-level route components
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks for business logic
- **Context**: Global state management
- **API**: Service layer for backend communication

## Deployment Architecture

The application can be deployed in various environments:

- **Development**: Local development servers
- **Staging**: Pre-production environment
- **Production**: Live environment

Each environment has its own:
- Database instance
- Environment variables
- API endpoints
- Build configurations

## Performance Considerations

- Database indexing
- API caching
- Frontend code splitting
- Asset optimization
- Lazy loading
- Server-side rendering where appropriate 
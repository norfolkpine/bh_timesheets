# API Documentation

## Authentication

All API endpoints require authentication using JWT tokens.

### Authentication Endpoints

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
    "username": "string",
    "password": "string"
}
```

Response:
```json
{
    "token": "string",
    "user": {
        "id": "integer",
        "username": "string",
        "email": "string"
    }
}
```

#### Refresh Token
```http
POST /api/auth/refresh/
Content-Type: application/json

{
    "refresh": "string"
}
```

Response:
```json
{
    "access": "string"
}
```

## Timesheet Endpoints

### List Timesheets
```http
GET /api/timesheets/
Authorization: Bearer <token>
```

Response:
```json
[
    {
        "id": "integer",
        "date": "date",
        "hours": "decimal",
        "project": "string",
        "description": "string",
        "status": "string"
    }
]
```

### Create Timesheet
```http
POST /api/timesheets/
Authorization: Bearer <token>
Content-Type: application/json

{
    "date": "date",
    "hours": "decimal",
    "project": "string",
    "description": "string"
}
```

Response:
```json
{
    "id": "integer",
    "date": "date",
    "hours": "decimal",
    "project": "string",
    "description": "string",
    "status": "string"
}
```

### Get Timesheet
```http
GET /api/timesheets/{id}/
Authorization: Bearer <token>
```

Response:
```json
{
    "id": "integer",
    "date": "date",
    "hours": "decimal",
    "project": "string",
    "description": "string",
    "status": "string"
}
```

### Update Timesheet
```http
PUT /api/timesheets/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
    "date": "date",
    "hours": "decimal",
    "project": "string",
    "description": "string"
}
```

Response:
```json
{
    "id": "integer",
    "date": "date",
    "hours": "decimal",
    "project": "string",
    "description": "string",
    "status": "string"
}
```

### Delete Timesheet
```http
DELETE /api/timesheets/{id}/
Authorization: Bearer <token>
```

Response: 204 No Content

## Project Endpoints

### List Projects
```http
GET /api/projects/
Authorization: Bearer <token>
```

Response:
```json
[
    {
        "id": "integer",
        "name": "string",
        "description": "string",
        "status": "string"
    }
]
```

### Create Project
```http
POST /api/projects/
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string",
    "description": "string"
}
```

Response:
```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "status": "string"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
    "error": "string",
    "details": {}
}
```

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
    "detail": "Internal server error."
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Pagination

List endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10, max: 100)

Response format for paginated endpoints:
```json
{
    "count": "integer",
    "next": "string",
    "previous": "string",
    "results": []
}
``` 
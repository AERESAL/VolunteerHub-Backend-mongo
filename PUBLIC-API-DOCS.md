# VolunteerHub Backend API - Public Documentation

A secure backend API for volunteer management with MongoDB integration.

## 🚀 Features

- User authentication with JWT tokens
- Activity management (CRUD operations)
- Community posts and interactions
- MongoDB Atlas integration
- API key authentication for apps
- Vercel deployment with protection

## 📋 Prerequisites

- API key (contact admin for access)
- Valid user account for protected endpoints

## 🔧 Authentication

This API uses two levels of authentication:

1. **API Key**: Required for all endpoints (except health checks)
2. **JWT Token**: Required for user-specific operations

### Headers Required

```javascript
// For app access
headers: {
  'X-API-Key': 'YOUR_API_KEY',
  'Content-Type': 'application/json'
}

// For authenticated operations
headers: {
  'X-API-Key': 'YOUR_API_KEY',
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

## 📋 Available Endpoints

### Public Endpoints (API Key Required)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Endpoints (API Key + JWT Required)  
- `GET /api/activities` - Get activities
- `POST /api/activities` - Create activity
- `POST /api/activities/:id/join` - Join activity
- `GET /api/community-posts` - Get community posts
- `POST /api/community-posts` - Create post

### System Endpoints (No Auth Required)
- `GET /api/health` - Health check
- `GET /api/test-db` - Database connection test

## 💻 Example Usage

### User Registration
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    username: 'johndoe',
    password: 'securepassword',
    phoneNumber: '123-456-7890',
    zipCode: '12345'
  })
});
```

### User Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'securepassword'
  })
});

const data = await response.json();
// Store data.token for authenticated requests
```

### Get Activities (Authenticated)
```javascript
const response = await fetch('/api/activities', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY',
    'Authorization': `Bearer ${storedToken}`
  }
});
```

## 🛡️ Security Features

- API key authentication for app access
- JWT tokens for user sessions
- Password hashing with bcrypt
- Rate limiting protection
- CORS configuration
- Vercel authentication for web access

## 📞 Support

For API key access or technical support, please contact the development team.

## 🔒 Security Notice

- Never expose API keys in client-side code
- Store API keys securely in environment variables
- Tokens expire after 7 days - implement refresh logic
- Use HTTPS for all API communications

---

**VolunteerHub Backend** - Secure, scalable volunteer management API

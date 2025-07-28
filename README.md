# VolunteerHub Backend

A Node.js/Express backend API for volunteer management with MongoDB integration.

## 🚀 Features

- **MongoDB Integration**: Full database connectivity with MongoDB Atlas
- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Activity Management**: CRUD operations for volunteer activities
- **Community Features**: Posts and user interactions
- **Security**: Helmet, CORS, and rate limiting
- **Error Handling**: Comprehensive error handling and validation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Replace `<db_password>` in your MongoDB URI with your actual password
   - Update JWT_SECRET and SESSION_SECRET with secure random strings

3. **Start the server:**
   ```bash
   # Development with auto-reload
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Activities
- `GET /api/activities` - Get all activities
- `POST /api/activities` - Create new activity
- `POST /api/activities/:id/join` - Join an activity

### Community
- `GET /api/community-posts` - Get community posts
- `POST /api/community-posts` - Create new post

### System
- `GET /api/health` - Health check
- `GET /api/test-db` - Test database connection

## 🗄️ Database Collections

- **users**: User accounts and profiles
- **activities**: Volunteer activities
- **communityPosts**: Community posts and interactions

## 🔐 Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
NODE_ENV=development
PORT=3000
```

## 🚀 Deployment

The server can be deployed to platforms like:
- Vercel
- Heroku
- Railway
- AWS
- Digital Ocean

Make sure to set your environment variables in your deployment platform.

## 📞 Support

For issues and questions, please check the API health endpoint at `/api/health` and database connectivity at `/api/test-db`.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Global database variable
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
    
    // Get database instance
    db = client.db("volunteerhub");
    
    return db;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    // Local development
    'http://localhost:3000',
    'http://localhost:5500', 
    'http://localhost:8081',
    'http://localhost:19006', // Expo web
    'http://localhost:8080',  // Alternative dev server
    // React Native Metro bundler
    'http://localhost:19000',
    'http://localhost:19001',
    'http://localhost:19002',
    // Expo development
    'http://127.0.0.1:19006',
    'http://127.0.0.1:8081',
    // Mobile development IPs (you may need to add your computer's IP)
    'http://192.168.1.0/24',  // Common local network range
    // Production domains (add your deployed app URLs here)
    'https://your-react-app.vercel.app',
    'https://your-react-native-web.netlify.app',
    // Allow any localhost port for development
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Key middleware for bypassing Vercel protection
const API_KEY = process.env.API_KEY || 'vh_api_key_2025_secure_access';

const apiKeyAuth = (req, res, next) => {
  // Check for API key in headers
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  // If API key is provided and valid, allow access
  if (apiKey === API_KEY) {
    return next();
  }
  
  // For health check and test endpoints, allow without API key for web browser access
  if (req.path === '/api/health' || req.path === '/api/test-db') {
    return next();
  }
  
  // For other endpoints, require API key or valid JWT
  const token = req.headers.authorization?.split(' ')[1];
  if (!apiKey && !token) {
    return res.status(401).json({
      message: 'API key or authentication token required',
      hint: 'Include X-API-Key header or Authorization header'
    });
  }
  
  next();
};

// Apply API key middleware to all routes except health checks
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/test-db') {
    return next();
  }
  return apiKeyAuth(req, res, next);
});

// Database helper functions
const getCollection = (collectionName) => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db.collection(collectionName);
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'VolunteerHub Backend is running',
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected'
  });
});

// Test endpoint to verify MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.admin().ping();
    res.status(200).json({
      message: 'Database connection successful',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// User Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, phoneNumber, zipCode } = req.body;
    
    const usersCollection = getCollection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }
    
    // Hash password (you'll need to install bcryptjs)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      phoneNumber,
      zipCode,
      createdAt: new Date(),
      isActive: true
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertedId
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const usersCollection = getCollection('users');
    
    // Find user
    const user = await usersCollection.findOne({
      $or: [{ username }, { email: username }]
    });
    
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token (you'll need to install jsonwebtoken)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
});

// Activities Routes
app.get('/api/activities', async (req, res) => {
  try {
    const activitiesCollection = getCollection('activities');
    const activities = await activitiesCollection.find({}).toArray();
    
    res.status(200).json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const { name, description, date, startTime, endTime, location, maxParticipants } = req.body;
    
    const activitiesCollection = getCollection('activities');
    
    const newActivity = {
      name,
      description,
      date,
      startTime,
      endTime,
      location,
      maxParticipants: parseInt(maxParticipants) || 0,
      participants: [],
      createdAt: new Date(),
      isActive: true
    };
    
    const result = await activitiesCollection.insertOne(newActivity);
    
    res.status(201).json({
      message: 'Activity created successfully',
      activityId: result.insertedId,
      activity: newActivity
    });
    
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      message: 'Failed to create activity',
      error: error.message
    });
  }
});

// Volunteer Participation Routes
app.post('/api/activities/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;
    
    const activitiesCollection = getCollection('activities');
    
    const result = await activitiesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: {
          participants: {
            userId,
            userName,
            joinedAt: new Date()
          }
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }
    
    res.status(200).json({
      message: 'Successfully joined activity'
    });
    
  } catch (error) {
    console.error('Join activity error:', error);
    res.status(500).json({
      message: 'Failed to join activity',
      error: error.message
    });
  }
});

// Community Posts Routes
app.get('/api/community-posts', async (req, res) => {
  try {
    const postsCollection = getCollection('communityPosts');
    const posts = await postsCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      message: 'Failed to fetch community posts',
      error: error.message
    });
  }
});

app.post('/api/community-posts', async (req, res) => {
  try {
    const { title, content, author, authorId } = req.body;
    
    const postsCollection = getCollection('communityPosts');
    
    const newPost = {
      title,
      content,
      author,
      authorId,
      likes: 0,
      comments: [],
      createdAt: new Date(),
      isActive: true
    };
    
    const result = await postsCollection.insertOne(newPost);
    
    res.status(201).json({
      message: 'Post created successfully',
      postId: result.insertedId,
      post: newPost
    });
    
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      message: 'Failed to create post',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/test-db',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/activities',
      'POST /api/activities',
      'POST /api/activities/:id/join',
      'GET /api/community-posts',
      'POST /api/community-posts'
    ]
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down gracefully...');
  try {
    await client.close();
    console.log('📔 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB first
    await connectToMongoDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 VolunteerHub Backend running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Test DB: http://localhost:${PORT}/api/test-db`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

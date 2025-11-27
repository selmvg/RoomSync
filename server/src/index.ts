import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import householdRoutes from './routes/households';
import choreRoutes from './routes/chores';
import expenseRoutes from './routes/expenses';
import shoppingRoutes from './routes/shopping';
import wallRoutes from './routes/wall';
import notificationRoutes from './routes/notifications';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set in .env file');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('\n💡 Make sure you have:');
    console.error('   1. Set DATABASE_URL in your .env file');
    console.error('   2. Run: npm run prisma:generate');
    console.error('   3. Run: npm run prisma:migrate');
    process.exit(1);
  }
}

// Routes
app.use('/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/chores', choreRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/wall', wallRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Start server
async function startServer() {
  await testDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});


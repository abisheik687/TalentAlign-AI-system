import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'TalentAlign AI Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is healthy',
    version: '1.0.0'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
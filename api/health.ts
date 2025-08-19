import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    return res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: 'Sistema de Nómina API is running on Vercel',
      environment: process.env.NODE_ENV || 'development',
      mongodb_configured: !!process.env.MONGODB_URI,
      jwt_configured: !!process.env.JWT_SECRET
    });
    
  } catch (error) {
    console.error('Error handling health check:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Basic API response for now
    if (req.url === '/api/health' || req.url === '/health') {
      return res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'API is running on Vercel'
      });
    }

    // For now, return a basic response for all other routes
    return res.status(200).json({ 
      message: 'Sistema de Nómina API',
      endpoint: req.url,
      method: req.method,
      status: 'under_construction'
    });
    
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

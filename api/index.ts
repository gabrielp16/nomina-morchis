import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import the server app dynamically to avoid module resolution issues at build time
    const { default: app } = await import('../server/index.js');
    
    // Handle the request with the Express app
    return app(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

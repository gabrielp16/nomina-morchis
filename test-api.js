export default function handler(req, res) {
  res.status(200).json({ 
    success: true,
    message: 'Root API working!',
    timestamp: new Date().toISOString()
  });
}

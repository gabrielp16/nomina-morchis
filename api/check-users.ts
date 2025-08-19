import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Definir el esquema del usuario directamente
const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  numeroCelular: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
    
    isConnected = true;
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Contar usuarios
    const totalUsers = await User.countDocuments();
    const localUsers = await User.countDocuments({ authProvider: 'local' });
    const adminUser = await User.findOne({ correo: 'admin@morchis.com' });

    // Listar primeros 5 usuarios (sin passwords)
    const users = await User.find()
      .select('nombre apellido correo authProvider isActive')
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        localUsers,
        adminUserExists: !!adminUser,
        adminUserDetails: adminUser ? {
          nombre: adminUser.nombre,
          correo: adminUser.correo,
          authProvider: adminUser.authProvider,
          isActive: adminUser.isActive
        } : null,
        sampleUsers: users
      }
    });

  } catch (error) {
    console.error('Error checking users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

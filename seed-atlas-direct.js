import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB Atlas URI directo
const MONGODB_URI = "mongodb+srv://gabrielp16:Sun$tudi024@cluster0.ndzbaxv.mongodb.net/morchis-nomina?retryWrites=true&w=majority&appName=Cluster0";

// Esquemas simplificados
const userSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  correo: { type: String, unique: true },
  numeroCelular: String,
  password: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  isActive: { type: Boolean, default: true },
  authProvider: { type: String, default: 'local' }
});

const roleSchema = new mongoose.Schema({
  nombre: { type: String, unique: true },
  descripcion: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
});

const permissionSchema = new mongoose.Schema({
  nombre: { type: String, unique: true },
  descripcion: String,
  modulo: String
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);
const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);

const seedAtlas = async () => {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Atlas');

    // Crear permisos básicos
    const permissions = await Permission.findOneAndUpdate(
      { nombre: 'MANAGE_USERS' },
      { nombre: 'MANAGE_USERS', descripcion: 'Gestionar usuarios', modulo: 'users' },
      { upsert: true, new: true }
    );

    // Crear rol admin
    const adminRole = await Role.findOneAndUpdate(
      { nombre: 'Administrador' },
      { nombre: 'Administrador', descripcion: 'Acceso completo', permissions: [permissions._id] },
      { upsert: true, new: true }
    );

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await User.findOneAndUpdate(
      { correo: 'admin@morchis.com' },
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        correo: 'admin@morchis.com',
        numeroCelular: '1234567890',
        password: hashedPassword,
        role: adminRole._id,
        isActive: true,
        authProvider: 'local'
      },
      { upsert: true, new: true }
    );

    console.log('🎉 Atlas seeding completed!');
    console.log('📋 Credentials: admin@morchis.com / admin123');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from Atlas');
  }
};

seedAtlas();

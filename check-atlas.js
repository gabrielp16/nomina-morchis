import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://gabrielp16:Sun$tudi024@cluster0.ndzbaxv.mongodb.net/morchis-nomina?retryWrites=true&w=majority&appName=Cluster0";

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

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

const checkAtlas = async () => {
  try {
    console.log('🔍 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!');

    // Buscar todos los usuarios
    console.log('\n📋 Users in database:');
    const users = await User.find({});
    for (const user of users) {
      console.log(`- ID: ${user._id}`);
      console.log(`  Email: ${user.correo}`);
      console.log(`  Role ID: ${user.role}`);
      console.log(`  Auth Provider: ${user.authProvider}`);
      console.log('');
    }

    // Verificar roles
    console.log('🎭 Roles in database:');
    const roles = await Role.find({});
    for (const role of roles) {
      console.log(`- Role ID: ${role._id}`);
      console.log(`  Name: ${role.nombre}`);
      console.log('');
    }

    // Intentar el mismo query que hace la API
    console.log('🧪 Testing login query...');
    const testUser = await User.findOne({ 
      correo: 'admin@morchis.com', 
      authProvider: 'local' 
    }).populate('role');

    if (testUser) {
      console.log('✅ User found successfully!');
      console.log(`- User ID: ${testUser._id}`);
      console.log(`- Email: ${testUser.correo}`);
      console.log(`- Role: ${testUser.role ? testUser.role.nombre : 'No role populated'}`);
    } else {
      console.log('❌ User NOT found with login query');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected');
  }
};

checkAtlas();

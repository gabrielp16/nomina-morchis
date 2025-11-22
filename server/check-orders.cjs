const mongoose = require('mongoose');
const Order = require('./models/Order.ts').default;

mongoose.connect('mongodb://localhost:27017/morchis-nomina').then(async () => {
  console.log('Connected to MongoDB');
  
  const totalOrders = await Order.countDocuments();
  const activeOrders = await Order.countDocuments({ isActive: true });
  
  console.log(`Total orders in DB: ${totalOrders}`);
  console.log(`Active orders: ${activeOrders}`);
  
  const orders = await Order.find({ isActive: true })
    .populate('cliente', 'nombre')
    .populate('producto', 'nombre')
    .limit(5)
    .lean();
    
  console.log('\nRecent orders:');
  orders.forEach((order, i) => {
    const fecha = new Date(order.fecha).toLocaleDateString();
    const cliente = order.cliente?.nombre || 'Cliente no encontrado';
    const producto = order.producto?.nombre || 'Producto no encontrado';
    console.log(`${i+1}. ${fecha} - Cliente: ${cliente} - Producto: ${producto} - Estado: ${order.estado}`);
  });
  
  mongoose.disconnect();
}).catch(console.error);
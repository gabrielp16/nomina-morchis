// Script para probar si Railway puede crear usuarios directamente
const RAILWAY_API = 'https://nomina-morchis-api.up.railway.app';

async function testRailwayEndpoints() {
  console.log('🔍 Testing Railway API endpoints...');
  
  try {
    // Test auth endpoints
    const loginResponse = await fetch(`${RAILWAY_API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: 'admin@morchis.com',
        password: 'admin123'
      })
    });
    
    const loginResult = await loginResponse.text();
    console.log('Login test:', loginResult);
    
    // Test users endpoint
    const usersResponse = await fetch(`${RAILWAY_API}/api/users`);
    const usersResult = await usersResponse.text();
    console.log('Users endpoint:', usersResult);
    
    // Test roles endpoint  
    const rolesResponse = await fetch(`${RAILWAY_API}/api/roles`);
    const rolesResult = await rolesResponse.text();
    console.log('Roles endpoint:', rolesResult);
    
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

testRailwayEndpoints();

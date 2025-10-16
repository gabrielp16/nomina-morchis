# 🔧 Solución CORS - Sistema Nómina

## 🎯 Problema Identificado

**Error CORS en producción:** 
```
Access to fetch at 'https://nomina-morchis-api.up.railway.app/api/auth/login' 
from origin 'https://nomina-morchis.vercel.app' has been blocked by CORS policy
```

## ✅ Soluciones Implementadas

### 1. **Configuración CORS Robusta en Backend** 
- ✅ Headers CORS explícitos y permisivos
- ✅ Manejo específico de preflight requests  
- ✅ Logging detallado para debugging
- ✅ Soporte para subdominios dinámicos de Vercel

### 2. **Middleware CORS Específico para Auth**
- ✅ Headers adicionales en rutas de autenticación
- ✅ Manejo especial de requests OPTIONS
- ✅ Soporte para múltiples orígenes Vercel

### 3. **Configuración Frontend Optimizada**
- ✅ Headers explícitos: `Origin`, `Accept`, `mode: 'cors'`
- ✅ Credenciales incluidas: `credentials: 'include'`
- ✅ Timeout y configuración robusta

## 🚀 Pasos para Aplicar la Solución

### **Paso 1: Variables de Entorno en Railway**
Asegúrate de que Railway tenga estas variables:
```bash
NODE_ENV=production
FRONTEND_URL=https://nomina-morchis.vercel.app
CORS_ORIGIN=https://nomina-morchis.vercel.app,https://nomina-morchis-git-main-gabrielp16s-projects.vercel.app
JWT_SECRET=[tu-jwt-secret]
MONGODB_URI=[tu-mongodb-uri]
```

### **Paso 2: Variables de Entorno en Vercel**
Configura en tu panel de Vercel:
```bash
VITE_API_BASE_URL=https://nomina-morchis-api.up.railway.app/api
VITE_NODE_ENV=production
```

### **Paso 3: Deploy de Cambios**
1. **Frontend (Vercel):** Se actualizará automáticamente al hacer push
2. **Backend (Railway):** Se actualizará automáticamente al hacer push

### **Paso 4: Verificar Solución**
```bash
# Probar health check
curl -H "Origin: https://nomina-morchis.vercel.app" \
     "https://nomina-morchis-api.up.railway.app/health"

# Probar CORS específico
curl -H "Origin: https://nomina-morchis.vercel.app" \
     "https://nomina-morchis-api.up.railway.app/cors-test"
```

## 🔍 Debugging en Producción

### **Logs de CORS Habilitados**
El servidor ahora logea todas las requests CORS:
```
CORS Request - Origin: https://nomina-morchis.vercel.app, Method: OPTIONS, Path: /api/auth/login
CORS Allowed - Origin: https://nomina-morchis.vercel.app
CORS Preflight - Origin: https://nomina-morchis.vercel.app, Path: /api/auth/login
```

### **Endpoint de Testing**
Nuevo endpoint para verificar CORS: 
`GET https://nomina-morchis-api.up.railway.app/cors-test`

### **Health Check Mejorado**  
El endpoint `/health` ahora incluye información de CORS:
```json
{
  "corsOrigins": [...],
  "environment": "production",
  ...
}
```

## 🛡️ Configuración CORS Implementada

### **Orígenes Permitidos:**
- ✅ `https://nomina-morchis.vercel.app` (producción principal)
- ✅ `https://nomina-morchis-git-*-gabrielp16s-projects.vercel.app` (branches/PRs)
- ✅ `http://localhost:*` (desarrollo local)
- ✅ Cualquier subdominio `*.nomina-morchis.*.vercel.app`

### **Métodos Permitidos:**
- ✅ `GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD`

### **Headers Permitidos:**
- ✅ `Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma`

### **Configuración Especial:**
- ✅ `Access-Control-Allow-Credentials: true`
- ✅ `Access-Control-Max-Age: 86400` (24 horas cache)
- ✅ Manejo automático de preflight requests

## ⚡ Cambios Críticos Realizados

### **Backend (`server/index.ts`):**
```typescript
// CORS middleware robusto con logging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`CORS Request - Origin: ${origin}, Method: ${req.method}`);
  
  if (isAllowedOrigin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  // Headers completos...
});
```

### **Auth Routes (`server/routes/auth.ts`):**
```typescript
// Middleware CORS específico para auth
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`AUTH PREFLIGHT - Origin: ${origin}`);
    res.status(200).end();
    return;
  }
  next();
});
```

### **Frontend (`app/services/api.ts`):**
```typescript
const config: RequestInit = {
  mode: 'cors',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': window?.location?.origin,
    ...
  }
};
```

## 🧪 Testing

### **Comandos de Prueba:**
```bash
# Health check con CORS
curl -H "Origin: https://nomina-morchis.vercel.app" \
     -X GET "https://nomina-morchis-api.up.railway.app/health"

# Preflight para login
curl -H "Origin: https://nomina-morchis.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS "https://nomina-morchis-api.up.railway.app/api/auth/login"

# Login real
curl -H "Origin: https://nomina-morchis.vercel.app" \
     -H "Content-Type: application/json" \
     -X POST "https://nomina-morchis-api.up.railway.app/api/auth/login" \
     -d '{"correo":"admin@morchis.com","password":"admin123"}'
```

## ❗ Notas Importantes

1. **Commit y Push:** Los cambios deben estar en el repositorio para que Railway y Vercel los detecten
2. **Variables de Entorno:** Asegúrate de configurar `VITE_API_BASE_URL` en Vercel
3. **Cache:** Puede tomar unos minutos en aplicarse completamente
4. **Logs:** Revisa los logs de Railway para ver los mensajes de CORS

---

🎉 **Con estas configuraciones, el error CORS debería estar completamente resuelto!**
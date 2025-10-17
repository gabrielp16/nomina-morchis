# 🚦 Solución Rate Limiting - Sistema Nómina

## 🎯 Problema Identificado

**Error 429 Too Many Requests:** 
```
GET https://nomina-morchis-api.up.railway.app/api/employees?page=1&limit=100 
net::ERR_FAILED 429 (Too Many Requests)
```

**Causa:** Rate limiting muy restrictivo (100 requests/15min) para una aplicación web moderna.

## ✅ Solución Implementada

### 🔧 **Configuración Rate Limiting Mejorada**

#### **Antes (Muy Restrictivo):**
```typescript
max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Solo 100 en producción
```

#### **Después (Balanceado):**
```typescript
// Rate limiting por capas
General:     500 requests / 15 min   (muy permisivo)
API:         1000 requests / 15 min  (rutas de lectura)
Auth:        50 requests / 15 min    (más restrictivo para seguridad)
```

### 🎚️ **Configuración por Capas**

1. **📊 General (Aplicado a todo):**
   - **Límite:** 500 requests/15min
   - **Aplicado:** Todas las rutas
   - **Propósito:** Protección básica contra ataques

2. **🔐 Auth (Más restrictivo):**
   - **Límite:** 50 requests/15min  
   - **Aplicado:** `/api/auth/*`
   - **Propósito:** Prevenir ataques de fuerza bruta

3. **📋 API (Más permisivo):**
   - **Límite:** 1000 requests/15min
   - **Aplicado:** `/api/users`, `/api/roles`, etc.
   - **Propósito:** Permitir operaciones normales

4. **🚫 Sin Límite Adicional:**
   - **Aplicado:** `/api/dashboard`, `/api/employees`, `/api/payroll`
   - **Propósito:** Máxima flexibilidad para rutas críticas

### 🛠️ **Características Avanzadas**

#### **Smart Skipping:**
```typescript
skip: (req) => {
  // Saltar para health checks
  if (req.path === '/health') return true;
  
  // Saltar para development desde localhost
  if (isDevelopment && isLocalhost) return true;
  
  return false;
}
```

#### **Identificación Inteligente:**
```typescript
keyGenerator: (req) => {
  return req.ip + ':' + (req.get('User-Agent') || 'unknown');
}
```

#### **Headers Informativos:**
```http
RateLimit-Limit: 500
RateLimit-Remaining: 487  
RateLimit-Reset: 1634400000
```

## 🔍 **Debugging y Monitoreo**

### **1. Endpoint de Estado:**
```bash
GET https://nomina-morchis-api.up.railway.app/rate-limit-status
```

**Respuesta:**
```json
{
  "ip": "123.456.789.0",
  "rateLimitHeaders": {
    "limit": "500",
    "remaining": "487",
    "reset": "1634400000"
  },
  "configuration": {
    "generalLimit": 500,
    "authLimit": 50,
    "apiLimit": 1000
  }
}
```

### **2. Logging Automático:**
```
Request Debug - IP: 123.456.789.0, Method: GET, URL: /api/employees
Rate Limit Info - Path: /api/employees, Remaining: 487/500
```

### **3. Headers en Respuesta:**
```http
RateLimit-Limit: 500
RateLimit-Remaining: 487
RateLimit-Reset: 1634400000
```

## 🌍 **Variables de Entorno**

### **Railway (.env.railway):**
```bash
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000      # 15 minutos
RATE_LIMIT_MAX_GENERAL=500       # Límite general
RATE_LIMIT_MAX_AUTH=50           # Límite para auth
RATE_LIMIT_MAX_API=1000          # Límite para API
```

### **Desarrollo (opcional):**
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_GENERAL=1000
RATE_LIMIT_MAX_AUTH=100
RATE_LIMIT_MAX_API=2000
```

## 🧪 **Testing de Rate Limiting**

### **Comando de Prueba:**
```bash
# Probar estado
curl https://nomina-morchis-api.up.railway.app/rate-limit-status

# Probar employees (debería funcionar)
curl https://nomina-morchis-api.up.railway.app/api/employees?page=1&limit=10

# Múltiples requests para probar límite
for i in {1..10}; do
  curl -w "Status: %{http_code}\n" \
    https://nomina-morchis-api.up.railway.app/api/employees?page=1&limit=10
done
```

### **Usando el Script de Prueba:**
```bash
chmod +x server/test-rate-limit.sh
./server/test-rate-limit.sh
```

## 📊 **Límites por Endpoint**

| Endpoint | Rate Limit | Propósito |
|----------|------------|-----------|
| `/health` | Sin límite | Health checks |
| `/cors-test` | Sin límite | Testing CORS |
| `/api/auth/*` | 50/15min | Seguridad auth |
| `/api/users` | 1000/15min | Operaciones admin |
| `/api/roles` | 1000/15min | Gestión roles |
| `/api/permissions` | 1000/15min | Gestión permisos |
| `/api/dashboard` | 500/15min | Dashboard general |
| `/api/employees` | 500/15min | Gestión empleados |
| `/api/payroll` | 500/15min | Gestión nómina |

## 🎯 **Resultados Esperados**

### **✅ Antes (Problemático):**
```
Request 101: 429 Too Many Requests
Request 102: 429 Too Many Requests
Request 103: 429 Too Many Requests
```

### **✅ Después (Funcional):**
```
Request 101: 200 OK
Request 102: 200 OK  
Request 103: 200 OK
...
Request 501: 429 Too Many Requests  # Solo después de 500 requests
```

## 🚀 **Despliegue**

1. **✅ Variables configuradas** en Railway
2. **✅ Código actualizado** con nueva configuración
3. **✅ Deploy automático** al hacer push
4. **✅ Testing** con el script de prueba

## ⚡ **Beneficios de la Nueva Configuración**

- **🚀 Performance:** 5x más requests permitidos (100→500)
- **🎯 Granularidad:** Diferentes límites por tipo de endpoint
- **🔒 Seguridad:** Auth sigue siendo restrictivo (50 requests)
- **📊 Monitoreo:** Logging y endpoints de debugging
- **🛠️ Flexibilidad:** Configurable vía variables de entorno
- **🚫 Exclusiones:** Health checks sin límite

---

🎉 **El error 429 debería estar completamente resuelto con una navegación fluida!**
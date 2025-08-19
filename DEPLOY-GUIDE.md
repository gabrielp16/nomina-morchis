# Configuración para Deploy en Vercel

## Estructura del proyecto para deploy:

```
sistema-nomina/
├── frontend/                 # React app
│   ├── dist/                # Build output
│   ├── vercel.json          # Config de Vercel
│   └── package.json
├── api/                     # Backend como serverless functions
│   ├── auth/
│   ├── users/
│   ├── roles/
│   └── package.json
└── README.md
```

## Pasos para preparar el deploy:

### 1. Configurar vercel.json para el frontend
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### 2. Configurar variables de entorno en Vercel
- MONGODB_URI (desde MongoDB Atlas)
- JWT_SECRET
- NODE_ENV=production

### 3. Preparar el backend para serverless
- Convertir rutas Express a funciones serverless
- Configurar conexión a MongoDB Atlas
- Optimizar cold starts

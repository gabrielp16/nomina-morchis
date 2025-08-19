# 🚀 GUÍA COMPLETA PARA DEPLOYMENT EN VERCEL

## 📋 Requisitos previos:
- ✅ MongoDB Atlas configurado
- ✅ Datos migrados a Atlas
- ✅ Repositorio en GitHub
- ✅ Cuenta de Vercel

## 🚀 Paso a paso para deployment:

### **1. Preparar repositorio en GitHub**

#### **A. Subir código a GitHub:**
```bash
# En la carpeta del proyecto
git add .
git commit -m "Preparando para deployment en Vercel"
git push origin main
```

#### **B. Verificar que el repo esté actualizado:**
- Ve a: https://github.com/gabrielp16/nomina-morchis
- Confirma que todos los archivos estén subidos

### **2. Crear cuenta y configurar Vercel**

#### **A. Crear cuenta en Vercel:**
1. Ve a: https://vercel.com/
2. Haz clic en "Sign Up"
3. Selecciona "Continue with GitHub"
4. Autoriza Vercel para acceder a tus repositorios

#### **B. Importar proyecto:**
1. En el dashboard de Vercel, haz clic en "New Project"
2. Busca tu repositorio: `nomina-morchis`
3. Haz clic en "Import"

### **3. Configurar variables de entorno**

#### **En la configuración del proyecto en Vercel, agrega:**

**Variables de producción:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://gabrielp16:Sun$tudi024@cluster0.ndzbaxv.mongodb.net/morchis-nomina?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=22f106bb12cb38d672541d676647a1b95386c6d3869f4a94c892ab210932d6f9b1c3795f48a2b8715a88f9d89d7c1f25bec0850d2cc86286588413a861f91c67
CORS_ORIGIN=https://tu-proyecto.vercel.app
FRONTEND_URL=https://tu-proyecto.vercel.app
API_URL=https://tu-proyecto.vercel.app
```

**Nota:** Reemplaza `tu-proyecto` con el nombre real que te asigne Vercel

### **4. Configuración de build**

#### **A. Build & Development Settings:**
```
Framework Preset: Other
Build Command: npm run build:vercel
Output Directory: build
Install Command: npm run install:all
Development Command: npm run dev:all
```

#### **B. Root Directory:**
```
Root Directory: / (dejar vacío)
```

### **5. Deploy del proyecto**

#### **A. Hacer el primer deployment:**
1. Haz clic en "Deploy"
2. Espera que termine el build (puede tomar 2-5 minutos)
3. Si hay errores, revisa los logs

#### **B. Verificar deployment:**
1. Una vez completado, tendrás una URL como: `https://nomina-morchis.vercel.app`
2. Prueba acceder a la aplicación
3. Prueba login con: `admin@morchis.com` / `password`

### **6. Configurar dominio (opcional)**

#### **Si tienes un dominio personalizado:**
1. Ve a Settings → Domains
2. Agrega tu dominio
3. Configura los DNS según las instrucciones de Vercel

## ✅ Verificación post-deployment:

### **1. Funcionalidades a probar:**
- ✅ **Login**: `admin@morchis.com` / `password`
- ✅ **Dashboard**: Debe cargar correctamente
- ✅ **Usuarios**: Crear/editar usuarios
- ✅ **Nóminas**: Sistema de pagos
- ✅ **Conexión a Atlas**: Datos deben persistir

### **2. URLs importantes:**
```
Aplicación: https://nomina-morchis.vercel.app
API: https://nomina-morchis.vercel.app/api
Dashboard Vercel: https://vercel.com/dashboard
```

## 🆘 Troubleshooting común:

### **Error de build:**
- Revisar logs en Vercel dashboard
- Verificar que todas las dependencias estén en package.json
- Verificar sintaxis de TypeScript

### **Error de base de datos:**
- Verificar MONGODB_URI en variables de entorno
- Confirmar que Network Access permita Vercel (0.0.0.0/0)

### **Error de CORS:**
- Actualizar CORS_ORIGIN con la URL real de Vercel
- Verificar que coincida exactamente

## 💡 Tips importantes:

1. **Cada push a main desplegará automáticamente**
2. **Las variables de entorno se configuran solo una vez**
3. **Los logs están disponibles en Vercel dashboard**
4. **Vercel asigna URLs automáticamente, pero puedes personalizar**

## 🎉 ¡Deployment completado!

Una vez que todo funcione, tendrás tu sistema de nómina funcionando en la nube 24/7 de forma gratuita.

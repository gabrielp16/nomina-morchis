# GUÍA DE MIGRACIÓN - EJECUTAR EN OTRA MÁQUINA

## 📋 Requisitos previos:
1. Node.js instalado
2. npm install mongoose
3. MongoDB local corriendo en la máquina origen (donde están los datos)

## 🔧 Configuración de MongoDB Atlas:

### Connection String:
```
mongodb+srv://gabrielp16:Sun$tudi024@cluster0.ndzbaxv.mongodb.net/morchis-nomina?retryWrites=true&w=majority&appName=Cluster0
```

### ⚠️ IMPORTANTE - Configurar Network Access:
1. Ve a https://cloud.mongodb.com/
2. Selecciona tu proyecto
3. Ve a "Network Access" en el menú lateral
4. Haz clic en "ADD IP ADDRESS"
5. Selecciona "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)
6. Confirma y espera 2-3 minutos

## 🚀 Pasos para ejecutar:

### Paso 1: Instalar dependencias
```bash
npm install mongoose
```

### Paso 2: Probar conexión
```bash
node test-atlas.js
```

### Paso 3: Ejecutar migración
```bash
node migrate-robust.js
```

## 📊 Datos esperados en migración:
- activities: ~274 documentos
- payrolls: ~57 documentos  
- roles: ~10 documentos
- employees: ~35 documentos
- permissions: ~29 documentos
- users: ~10 documentos

## ✅ Verificación post-migración:
1. El script debe mostrar "¡MIGRACIÓN COMPLETADA EXITOSAMENTE!"
2. Todos los documentos deben estar importados
3. Probar conexión con test-atlas.js

## 🆘 Troubleshooting:
- **Error de IP**: Configurar Network Access en Atlas
- **Error de conexión local**: Verificar que MongoDB esté corriendo
- **Error de autenticación**: Verificar credenciales de Atlas

## 📞 Notas adicionales:
- La migración elimina datos existentes en Atlas antes de importar
- Se ejecuta en lotes de 100 documentos para evitar timeouts
- Guarda un backup local antes de migrar (automático en el script)

# 🚀 Guía de Deploy Seguro - Sistema Nómina

## 📋 Resumen del Problema Solucionado

**Problema anterior:** Cada deploy reiniciaba las contraseñas de usuarios y perdía datos existentes.

**Solución implementada:** Sistema inteligente que preserva datos existentes y solo sincroniza estructura.

## 🔧 Scripts Disponibles

### Para Desarrollo Local
```bash
# Seed completo (desarrollo/testing - REINICIA DATOS)
npm run backend:seed

# Desarrollo con datos limpios
npm run dev:all
```

### Para Producción (SEGURO)
```bash
# Configuración de producción que PRESERVA datos existentes
npm run backend:seed:production

# Script específico de Railway (automático en deploy)
cd server && npm run seed:railway
```

## 🛡️ Cómo Funciona la Protección

### ✅ Primer Deploy
- **Detecta** base de datos vacía
- **Crea** estructura completa (permisos, roles, usuarios por defecto)
- **Genera** credenciales iniciales

### ✅ Deploys Posteriores  
- **Preserva** todos los usuarios existentes
- **Mantiene** contraseñas modificadas
- **Sincroniza** solo permisos y roles nuevos/actualizados
- **No elimina** ni modifica datos de usuarios

## 📁 Archivos Modificados

### 🔄 `server/scripts/seed.ts`
- ✅ Eliminada línea que borraba usuarios existentes
- ✅ Función `createOrUpdateUser()` que preserva datos
- ✅ Solo crea usuarios si no existen

### 🆕 `server/seed-production.ts` 
- ✅ Script específico para producción
- ✅ Sincronización inteligente de estructura
- ✅ Verificación de usuario administrador crítico

### 🔄 `server/seed-railway.ts`
- ✅ Detección automática de primer deploy
- ✅ Modo de sincronización para deploys posteriores
- ✅ Preservación total de datos existentes

## 🎯 Comportamiento por Escenario

### 🟢 Primer Deploy (Base de Datos Vacía)
```
🏗️ Primer deploy detectado
✅ Crea estructura completa
✅ Genera usuarios por defecto:
   - admin@morchis.com / admin123
   - usuario@morchis.com / usuario123  
   - empleado@morchis.com / empleado123
⚠️ Recuerda cambiar contraseñas por defecto
```

### 🟡 Deploys Posteriores (Datos Existentes)
```
🔄 Deploy en base de datos existente
✅ Sincroniza permisos (solo nuevos)
✅ Actualiza roles (solo estructura)
✅ Preserva TODOS los usuarios
✅ Mantiene contraseñas modificadas
✅ No elimina ningún dato
```

## 🔐 Credenciales por Defecto

**⚠️ Solo en primer deploy:**
- **Admin:** `admin@morchis.com` / `admin123`
- **Usuario:** `usuario@morchis.com` / `usuario123`
- **Empleado:** `empleado@morchis.com` / `empleado123`

**🔒 En deploys posteriores:** Todas las contraseñas modificadas se mantienen intactas.

## 🚨 Comandos de Emergencia

### Si necesitas resetear completamente (⚠️ PELIGROSO)
```bash
# SOLO para desarrollo - ELIMINA TODOS LOS DATOS
cd server
npm run seed  # Este SÍ reinicia todo
```

### Para verificar estado de producción
```bash
# Verificar si hay usuarios existentes
cd server
npm run seed:production  # Solo sincroniza sin eliminar
```

## 📝 Notas Importantes

1. **Railway Deploy:** Usa automáticamente `seed-railway.ts` que es seguro
2. **Vercel Deploy:** Usar `npm run backend:seed:production` en configuración
3. **Contraseñas:** Solo se asignan por defecto a usuarios nuevos
4. **Roles:** Se actualizan automáticamente con nuevos permisos
5. **Permisos:** Solo se agregan los faltantes, nunca se eliminan

## ✅ Verificación Post-Deploy

Después de cada deploy, verifica:
- [ ] Los usuarios existentes siguen funcionando
- [ ] Las contraseñas modificadas siguen funcionando  
- [ ] Los nuevos permisos están disponibles
- [ ] Los roles tienen los permisos actualizados

## 🆘 Solución de Problemas

### "No puedo acceder con mi contraseña modificada"
- ✅ Esto NO debería pasar con la nueva configuración
- 🔧 Si pasa, usa las credenciales por defecto del admin
- 📧 Reporta el problema para investigación

### "Faltan permisos nuevos"
- 🔄 Ejecuta: `npm run backend:seed:production`
- ✅ Esto sincronizará sin afectar usuarios

### "Quiero resetear todo en desarrollo"
- 🔄 Ejecuta: `npm run backend:seed`
- ⚠️ SOLO en desarrollo, nunca en producción

---

🎉 **Ahora puedes hacer deploy sin miedo a perder datos de usuarios!**
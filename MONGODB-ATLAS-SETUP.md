# Configuración de MongoDB Atlas

## Pasos para configurar MongoDB Atlas (GRATIS):

### 1. Crear cuenta en MongoDB Atlas
- Ir a: https://www.mongodb.com/atlas
- Registrarse gratis
- Seleccionar "Shared" cluster (GRATIS)

### 2. Configurar el cluster
```
- Cluster Tier: M0 Sandbox (FREE)
- Cloud Provider: AWS/Google/Azure (cualquiera)
- Region: Seleccionar la más cercana
- Cluster Name: morchis-nomina
```

### 3. Configurar acceso
```
- Database Access: Crear usuario
  - Username: nomina_admin
  - Password: [generar password seguro]
  - Database User Privileges: Atlas admin

- Network Access: Agregar IP
  - Add IP Address: 0.0.0.0/0 (Allow access from anywhere)
  - Nota: En producción usar IPs específicas
```

### 4. Obtener connection string
```
mongodb+srv://nomina_admin:<password>@morchis-nomina.xxxxx.mongodb.net/morchis-nomina?retryWrites=true&w=majority
```

### 5. Configurar colecciones iniciales
- Usar MongoDB Compass o la interfaz web
- Importar datos iniciales de roles, permisos y usuarios

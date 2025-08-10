# 🚀 Sismtema Nómina - Template Base SPA

Un **template profesional** de aplicación web con autenticación, autorización y gestión de usuarios construido con **React Router v7**, **TypeScript** y **Tailwind CSS**. 

> 🎯 **Ideal como punto de partida** para aplicaciones empresariales, sistemas de gestión, dashboards administrativos y aplicaciones SaaS.

![React](https://img.shields.io/badge/React-18+-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![React Router](https://img.shields.io/badge/React%20Router-v7-red?logo=reactrouter)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Características Principales

### 🔐 **Sistema de Autenticación Completo**
- ✅ Login y registro de usuarios con sidebar flotante animado
- ✅ Autenticación JWT con gestión automática de tokens
- ✅ Gestión de sesiones con persistencia local
- ✅ Logout con limpieza completa de estado
- ✅ Context API para estado global de autenticación

### 🛡️ **Sistema de Autorización Avanzado**
- ✅ **Control de acceso basado en roles (RBAC)**
- ✅ **Sistema de permisos granular** con 13+ permisos predefinidos
- ✅ **Protección de rutas** con redirección inteligente multinivel
- ✅ **Componente ProtectedRoute** con fallback automático
- ✅ **Verificación de permisos** en tiempo real con `hasPermission()`

### 🎨 **Interfaz de Usuario Moderna**
- ✅ **Single Page Application (SPA)** - Sin refrescos de página
- ✅ **Navegación jerárquica** con menú de usuario estructurado
- ✅ **Diseño responsive** completamente optimizado para móviles
- ✅ **Componentes reutilizables** (Modales, Formularios, Tablas, Botones)
- ✅ **Sistema de notificaciones Toast** integrado
- ✅ **Iconografía Lucide React** consistente
- ✅ **Animaciones suaves** y transiciones fluidas

### 📊 **Módulos de Gestión Completos**
- ✅ **Dashboard** - Panel principal con métricas y estadísticas
- ✅ **Gestión de Usuarios** - CRUD completo con modales y validación
- ✅ **Gestión de Roles** - Administración de roles del sistema
- ✅ **Gestión de Permisos** - Control granular de accesos
- ✅ **Registro de Actividad** - Auditoría completa del sistema

## 🏗️ Arquitectura del Proyecto

```
app/
├── components/
│   ├── auth/
│   │   ├── Navigation.tsx        # 🧭 Navegación principal con menú jerárquico
│   │   ├── ProtectedRoute.tsx    # 🛡️ Protección de rutas con permisos
│   │   └── LoginSidebar.tsx      # 🔐 Sidebar de login/registro
│   ├── ui/
│   │   ├── button.tsx           # 🔘 Componente Button reutilizable
│   │   ├── input.tsx            # ⌨️ Componente Input con validación
│   │   ├── select.tsx           # 📋 Componente Select personalizado
│   │   └── ConfirmDialog.tsx    # ❓ Modal de confirmación
│   ├── users/                   # 👥 Componentes de gestión de usuarios
│   ├── roles/                   # 🏷️ Componentes de gestión de roles
│   ├── permissions/             # 🔒 Componentes de gestión de permisos
│   ├── loading/                 # ⏳ Componentes de carga
│   └── Layout.tsx               # 📐 Layout principal responsive
├── context/
│   ├── AuthContext.tsx          # 🔑 Context de autenticación global
│   └── ToastContext.tsx         # 📢 Context de notificaciones
├── routes/
│   ├── dashboard.tsx            # 📊 Dashboard principal
│   ├── users.tsx               # 👥 Gestión de usuarios
│   ├── roles.tsx               # 🏷️ Gestión de roles
│   ├── permissions.tsx         # 🔒 Gestión de permisos
│   ├── activity.tsx            # 📈 Registro de actividad
│   └── home.tsx                # 🏠 Página de bienvenida
└── react-router.config.ts      # ⚙️ Configuración SPA (ssr: false)
```

## 🚦 Sistema de Navegación Jerárquico

La aplicación implementa un **sistema de navegación estructurado en 3 niveles**:

### **1. 👤 Información del Usuario**
- Avatar con iniciales del usuario
- Nombre completo y email
- Rol asignado con badge visual colorido
- Información expandida en el dropdown

### **2. ⚙️ Sistema y Configuración**
- **🏠 Dashboard** - Panel principal con métricas
- **⚙️ Configuración** (menú expandible con chevron animado)
  - **👥 2.1 Usuarios** - Gestión completa de usuarios (requiere `READ_USERS`)
  - **🏷️ 2.2 Roles** - Administración de roles (requiere `READ_ROLES`)
  - **🔒 2.3 Permisos** - Control de accesos (requiere `READ_PERMISSIONS`)
  - **📈 2.4 Activity** - Registro de auditoría (requiere `READ_AUDIT`)

### **3. 🚪 Gestión de Sesión**
- **🚪 Logout** - Cierre seguro con confirmación y limpieza de estado

### **Características Avanzadas de Navegación**
- ✅ **Permisos dinámicos** - Solo muestra opciones según permisos del usuario
- ✅ **Navegación SPA** - Transiciones instantáneas sin refrescos
- ✅ **Submenús animados** - Expansión suave con iconos rotativos
- ✅ **Cierre inteligente** - Auto-cierre al navegar o click exterior
- ✅ **Estados visuales** - Hover effects y transiciones fluidas
- ✅ **Responsive design** - Adaptable a móviles y tablets

## 🔒 Sistema de Protección de Rutas

El componente `ProtectedRoute` implementa **protección multinivel inteligente**:

### **Flujo de Autorización Avanzado**
```
1. 🔐 Verificación de Autenticación
   ↓ ¿Usuario logueado?
   
2. 🛡️ Verificación de Permisos Específicos
   ↓ ¿Tiene permisos requeridos?
   
3. 🔄 Sistema de Fallback Inteligente:
   ├─ Sin permisos específicos → 📊 Dashboard
   ├─ Sin acceso a Dashboard → 🏠 Welcome
   └─ Sin permisos básicos → 🚪 Logout + Redirección
```

### **Implementación del ProtectedRoute**
```tsx
<ProtectedRoute requiredPermissions={["READ_USERS", "CREATE_USERS"]}>
  <UsersManagementPage />
</ProtectedRoute>
```

### **Ejemplo de Verificación de Permisos en Componentes**
```tsx
const { hasPermission } = useAuth();

// Mostrar botón solo si tiene permisos
{hasPermission('CREATE_USERS') && (
  <Button onClick={() => setShowModal(true)}>
    Crear Usuario
  </Button>
)}
```

## 📋 Sistema de Permisos Granular

El sistema incluye **13+ permisos predefinidos** para control granular:

### **🏠 Dashboard y Sistema**
- `READ_DASHBOARD` - Acceso al panel principal

### **👥 Gestión de Usuarios**
- `READ_USERS` - Ver lista de usuarios
- `CREATE_USERS` - Crear nuevos usuarios
- `UPDATE_USERS` - Editar usuarios existentes
- `DELETE_USERS` - Eliminar usuarios

### **🏷️ Gestión de Roles**
- `READ_ROLES` - Ver lista de roles
- `CREATE_ROLES` - Crear nuevos roles
- `UPDATE_ROLES` - Editar roles existentes
- `DELETE_ROLES` - Eliminar roles

### **🔒 Gestión de Permisos**
- `READ_PERMISSIONS` - Ver lista de permisos

### **📈 Auditoría**
- `READ_AUDIT` - Acceso al registro de actividad

## 🎯 Casos de Uso Ideales

Este template es **perfecto** para:

- 🏢 **Aplicaciones empresariales** con múltiples roles de usuario
- 📊 **Sistemas de gestión** (CRM, ERP, HRM)
- 💼 **Dashboards administrativos** con control granular de acceso
- 🌐 **Aplicaciones SaaS** con gestión de usuarios y suscripciones
- 💰 **Sistemas de nómina** y recursos humanos
- 🔧 **Paneles de administración** personalizables
- 📈 **Aplicaciones de análisis** con diferentes niveles de acceso
- 🛍️ **E-commerce backends** con roles de admin, vendedor, cliente
- 🏥 **Sistemas médicos** con roles de doctor, enfermera, admin
- 🎓 **Plataformas educativas** con roles de profesor, estudiante, admin

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18+ | Biblioteca de UI |
| **React Router** | v7 | Routing SPA |
| **TypeScript** | 5.0+ | Type Safety |
| **Tailwind CSS** | 3.0+ | Styling utility-first |
| **Lucide React** | Latest | Iconografía moderna |
| **Vite** | 5+ | Build Tool optimizado |
| **Context API** | Built-in | State Management |

## 🚀 Instalación Rápida

### **Prerrequisitos**
- Node.js 18+ 
- npm, yarn o pnpm

### **Pasos de Instalación**
```bash
# 1. Clonar el template
git clone https://github.com/tu-usuario/morchis-nomina-template.git
cd morchis-nomina-template

# 2. Instalar dependencias
npm install

# 3. Iniciar desarrollo
npm run dev
```

### **Comandos Disponibles**
```bash
npm run dev          # 🚀 Desarrollo local (http://localhost:5173)
npm run build        # 📦 Build para producción
npm run preview      # 👀 Preview del build
npm run typecheck    # ✅ Verificar tipos TypeScript
```

## 🔧 Configuración

### **Configuración SPA (react-router.config.ts)**
```typescript
import type { Config } from '@react-router/dev/config';

export default {
  ssr: false, // ✅ Modo SPA habilitado
} satisfies Config;
```

### **Variables de Entorno (Opcional)**
Crear un archivo `.env` en la raíz del proyecto:
```env
# URL del backend API (cuando integres con un backend)
VITE_API_URL=http://localhost:3001

# Configuración de la aplicación
VITE_APP_NAME="Tu Aplicación"
VITE_APP_VERSION="1.0.0"
```

### **Personalización del AuthContext**
El `AuthContext` está preparado para ser conectado con cualquier backend:

```tsx
// En AuthContext.tsx
const login = async (email: string, password: string) => {
  // TODO: Conectar con tu API de backend
  // const response = await api.post('/auth/login', { email, password });
  // const { token, user } = response.data;
  
  // Simulación para desarrollo
  if (email === 'admin@example.com' && password === 'password') {
    const mockUser = {
      id: '1',
      name: 'Administrador',
      email: email,
      role: 'Administrador',
      permissions: ['READ_DASHBOARD', 'READ_USERS', 'CREATE_USERS', ...]
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('token', 'mock-jwt-token');
    return { success: true };
  }
  
  return { success: false, message: 'Credenciales inválidas' };
};
```

## 📱 Diseño Responsive

La aplicación está **completamente optimizada** para todos los dispositivos:

### **Navegación Adaptable**
- **Desktop**: Menú completo con submenús expandibles
- **Tablet**: Navegación compacta con iconos
- **Mobile**: Menú hamburguesa con drawer lateral

### **Componentes Responsive**
- **Tablas**: Scroll horizontal en móviles + tarjetas en pantallas pequeñas
- **Formularios**: Layout de columnas que se adapta al ancho de pantalla
- **Modales**: Tamaño completo en móviles, centrados en desktop
- **Dashboard**: Grid adaptable que reorganiza widgets según el espacio

### **Touch-Friendly**
- **Botones**: Tamaño mínimo de 44px para dedos
- **Espaciado**: Padding generoso entre elementos táctiles
- **Gestos**: Soporte para swipe en carruseles y listas

## 📦 Componentes Principales

### **🔑 AuthContext**
```tsx
const {
  user,                    // Usuario actual
  isAuthenticated,         // Estado de autenticación
  login,                   // Función de login
  logout,                  // Función de logout
  hasPermission,           // Verificar permisos: hasPermission('READ_USERS')
  loading                  // Estado de carga
} = useAuth();
```

### **🧭 Navigation**
- Navegación principal con menú de usuario jerárquico
- Submenús expandibles con animaciones suaves
- Navegación SPA sin refrescos de página
- Cierre automático inteligente

### **🛡️ ProtectedRoute**
```tsx
<ProtectedRoute requiredPermissions={['READ_USERS']}>
  <UsersPage />
</ProtectedRoute>
```
- Protección de rutas con verificación de permisos
- Sistema de redirección inteligente multinivel
- Manejo de estados de carga

### **📐 Layout**
- Layout principal responsive de la aplicación
- Integración perfecta con el componente Navigation
- Estructura adaptable para diferentes tamaños de pantalla

### **📢 ToastContext**
```tsx
const { success, error, warning, info } = useToast();

success('Usuario creado correctamente');
error('Error al eliminar el usuario');
warning('Esta acción no se puede deshacer');
info('Datos actualizados');
```

## 🔌 Integración con Backend

Este template está preparado para ser conectado fácilmente con cualquier backend:

### **Estructura Recomendada de API**
```
POST /api/auth/login      # Autenticación
POST /api/auth/logout     # Cerrar sesión
GET  /api/auth/me         # Obtener usuario actual

GET    /api/users         # Lista de usuarios
POST   /api/users         # Crear usuario
GET    /api/users/:id     # Obtener usuario
PUT    /api/users/:id     # Actualizar usuario
DELETE /api/users/:id     # Eliminar usuario

GET    /api/roles         # Lista de roles
POST   /api/roles         # Crear rol
# ... etc
```

### **Ejemplo de Integración**
```tsx
// lib/api.ts
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return response.json();
    },
    
    me: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.json();
    }
  },
  
  users: {
    list: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.json();
    }
    // ... más métodos
  }
};
```

## 🚀 Deployment

### **Netlify**
```bash
npm run build
# Subir la carpeta build/ a Netlify
```

### **Vercel**
```bash
npm run build
vercel --prod
```

### **GitHub Pages**
```bash
npm run build
# Configurar GitHub Actions para deploy automático
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🧪 Testing (Preparado para implementar)

El proyecto está estructurado para agregar fácilmente testing:

```bash
# Instalar dependencias de testing
npm install -D @testing-library/react @testing-library/jest-dom vitest

# Estructura recomendada
src/
├── __tests__/
│   ├── components/
│   ├── context/
│   └── utils/
├── components/
└── ...
```

## 🔄 Roadmap de Características

### **🚧 En Desarrollo**
- [ ] Internacionalización (i18n) con soporte para español e inglés
- [ ] Modo oscuro/claro con persistencia
- [ ] PWA con service workers
- [ ] Lazy loading de rutas
- [ ] Optimización de bundle size

### **📋 Planeado**
- [ ] Componente de DataTable avanzado con filtros
- [ ] Sistema de notificaciones en tiempo real
- [ ] Drag & drop para reordenar elementos
- [ ] Exportación de datos a Excel/PDF
- [ ] Sistema de temas personalizables

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para contribuir:

1. **Fork el proyecto**
2. **Crea una rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit tus cambios** (`git commit -m 'Add some AmazingFeature'`)
4. **Push a la rama** (`git push origin feature/AmazingFeature`)
5. **Abre un Pull Request**

### **Pautas de Contribución**
- Seguir las convenciones de código existentes
- Agregar comentarios para funcionalidades complejas
- Mantener la estructura de carpetas consistente
- Probar los cambios en diferentes dispositivos

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT** - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- **[React Router](https://reactrouter.com/)** - Por el excelente sistema de routing v7
- **[Tailwind CSS](https://tailwindcss.com/)** - Por el sistema de utilidades CSS
- **[Lucide](https://lucide.dev/)** - Por los iconos hermosos y consistentes
- **[TypeScript](https://www.typescriptlang.org/)** - Por la seguridad de tipos
- **[Vite](https://vitejs.dev/)** - Por la herramienta de build ultrarrápida

## 📞 Soporte

### **¿Necesitas ayuda?**
- 🐛 **Reportar bugs**: [Abrir issue en GitHub](https://github.com/tu-usuario/morchis-nomina-template/issues)
- 💡 **Sugerir características**: [Discussions en GitHub](https://github.com/tu-usuario/morchis-nomina-template/discussions)
- 📧 **Contacto directo**: tu-email@ejemplo.com

### **Documentación Adicional**
- [Guía de React Router v7](https://reactrouter.com/start/overview)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Referencia de TypeScript](https://www.typescriptlang.org/docs/)

---

<div align="center">

**🌟 ¡No olvides darle una estrella al proyecto si te resultó útil! 🌟**

**Hecho con ❤️ para la comunidad de desarrolladores**

[⬆️ Volver al inicio](#-morchis-nómina---template-base-spa)

</div>

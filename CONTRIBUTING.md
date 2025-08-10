# Contribuir a Sistema Nómina Template

¡Gracias por tu interés en contribuir! Este documento te guiará a través del proceso de contribución.

## 🚀 Cómo Contribuir

### Reportar Bugs

1. **Verificar que no exista** un issue similar
2. **Usar el template de bug** al crear el issue
3. **Incluir información detallada**:
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Capturas de pantalla (si aplica)
   - Información del navegador/SO

### Sugerir Mejoras

1. **Abrir un Discussion** para discutir la idea
2. **Explicar el caso de uso** y beneficios
3. **Proponer una implementación** si es posible

### Pull Requests

1. **Fork el repositorio**
2. **Crear una rama** desde `main`:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Hacer commits descriptivos**:
   ```bash
   git commit -m "feat: agregar navegación breadcrumb"
   ```
4. **Seguir las convenciones de código**
5. **Probar los cambios** en diferentes dispositivos
6. **Actualizar documentación** si es necesario
7. **Crear el Pull Request**

## 📝 Convenciones de Código

### Estructura de Archivos
```
app/
├── components/
│   ├── feature/          # Componentes específicos de funcionalidad
│   └── ui/              # Componentes reutilizables
├── context/             # Contexts de React
├── routes/              # Páginas de la aplicación
└── types/               # Tipos TypeScript
```

### Naming Conventions
- **Componentes**: PascalCase (`UserModal.tsx`)
- **Archivos**: camelCase para utilities, PascalCase para componentes
- **Variables**: camelCase (`userName`, `isLoading`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### TypeScript
- **Siempre tipear** props y estado
- **Usar interfaces** para objetos complejos
- **Exportar tipos** que se reutilicen

```tsx
interface UserProps {
  user: User;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

export function UserCard({ user, onEdit, isLoading = false }: UserProps) {
  // ...
}
```

### Componentes
- **Usar arrow functions** para componentes
- **Desestructurar props** en la definición
- **Agrupar imports** (React, librerías, relativos)

```tsx
import { useState } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

export function ComponentName({ prop1, prop2 }: Props) {
  // ...
}
```

### CSS/Tailwind
- **Usar clases de Tailwind** preferentemente
- **Agrupar clases** por categoría (layout, spacing, colors, etc.)
- **Usar variables CSS** para valores reutilizables

```tsx
<div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
```

## 🧪 Testing

Aunque no hay tests implementados aún, cuando se agreguen:

- **Escribir tests** para nuevas funcionalidades
- **Mantener coverage** alto
- **Usar Testing Library** para componentes
- **Mockear** dependencias externas

## 📋 Commit Messages

Usar [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` formateo, missing semi colons, etc
- `refactor:` refactoring de código
- `test:` agregar o modificar tests
- `chore:` cambios en build, dependencies, etc

Ejemplos:
```
feat: agregar componente de paginación
fix: corregir cierre de modal en móviles
docs: actualizar README con nuevas características
style: formatear código con prettier
refactor: extraer lógica de autenticación a hook personalizado
```

## 🔍 Code Review

### Para Reviewers
- **Verificar funcionalidad** en diferentes navegadores
- **Revisar responsive design** en mobile/tablet/desktop
- **Verificar accesibilidad** básica
- **Comprobar performance** (bundle size, lazy loading)
- **Validar TypeScript** sin errores

### Para Contributors
- **Responder feedback** constructivamente
- **Hacer cambios solicitados** en commits separados
- **Mantener la rama actualizada** con main

## 📱 Testing en Dispositivos

Antes de enviar un PR, probar en:

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Tablet**: iPad, Android tablet

### Checklist de Testing
- [ ] ✅ Funcionalidad básica funciona
- [ ] ✅ Responsive design se ve bien
- [ ] ✅ No hay errores en consola
- [ ] ✅ Navegación SPA funciona correctamente
- [ ] ✅ Formularios validan apropiadamente
- [ ] ✅ Modales se abren/cierran correctamente
- [ ] ✅ Permisos se respetan

## 🎨 Diseño y UX

### Principios de Diseño
- **Consistencia** en componentes y patrones
- **Simplicidad** en interfaces
- **Accesibilidad** para todos los usuarios
- **Performance** en todas las interacciones

### Colores y Temas
- Usar la paleta de colores definida en Tailwind
- Mantener contraste apropiado para accesibilidad
- Considerar modo oscuro en futuras implementaciones

## 📚 Recursos

- [React Router v7 Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## ❓ ¿Preguntas?

Si tienes preguntas:
1. **Revisar la documentación** existente
2. **Buscar en issues** cerrados
3. **Abrir un Discussion** para preguntas generales
4. **Crear un issue** para bugs específicos

¡Gracias por contribuir! 🎉

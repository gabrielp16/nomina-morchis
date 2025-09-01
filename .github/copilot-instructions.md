# 🤖 AI Copilot Instructions for Sistema Nómina

You are working on a sophisticated payroll management system built with modern technologies. Follow these guidelines to provide optimal assistance.

## 🏗️ Project Architecture

### Frontend Stack
- **React Router 7** - File-based routing with SPA configuration
- **TypeScript** - Strict type checking enabled
- **Tailwind CSS 4** - Modern utility-first styling
- **Vite** - Ultra-fast development and building
- **Lucide React** - Consistent icon library

### Backend Stack
- **Express.js 5** - RESTful API server
- **MongoDB + Mongoose** - NoSQL database with ODM
- **JWT Authentication** - Secure token-based auth
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Key Patterns
- **SPA (Single Page Application)** - No page refreshes
- **Context-based State Management** - AuthContext, EmployeeContext, ToastContext
- **Role-based Access Control (RBAC)** - 13+ predefined permissions
- **Responsive Design** - Mobile-first approach
- **Error Boundaries** - Comprehensive error handling

## 🔐 Authentication & Authorization

### Permission System
Always consider these 13 core permissions when implementing features:
```typescript
// Core Permissions
'READ_DASHBOARD' | 'READ_USERS' | 'CREATE_USERS' | 'UPDATE_USERS' | 'DELETE_USERS' |
'READ_ROLES' | 'MANAGE_ROLES' | 'READ_PERMISSIONS' | 'MANAGE_PERMISSIONS' |
'READ_ACTIVITY' | 'READ_PAYROLL' | 'UPDATE_PAYROLL' | 'MANAGE_PAYROLL'
```

### Context Usage Patterns
```typescript
// Authentication context
const { user, isAuthenticated, hasPermission, logout } = useAuth();

// Employee context for payroll features
const { currentEmployee, isEmployee, isAdmin } = useEmployee();

// Always wrap protected routes
<ProtectedRoute requiredPermissions={['READ_USERS']}>
  <Component />
</ProtectedRoute>
```

## 📁 File Structure Guidelines

### Frontend Structure (`app/`)
- `routes/` - Page components following React Router 7 conventions
- `components/` - Reusable UI components organized by feature
- `context/` - Global state management (Auth, Employee, Toast)
- `hooks/` - Custom React hooks
- `services/` - API communication layer
- `types/` - TypeScript type definitions
- `lib/` - Utility functions and validations

### Backend Structure (`server/`)
- `routes/` - Express route handlers by domain
- `models/` - Mongoose schemas and models
- `middleware/` - Auth, logging, error handling
- `config/` - Database and environment configuration
- `scripts/` - Database seeding and utilities

## 🛠️ Development Guidelines

### Component Development
1. **Always use TypeScript** - No `any` types unless absolutely necessary
2. **Follow naming conventions** - PascalCase for components, camelCase for functions
3. **Implement proper error handling** - Use try/catch with toast notifications
4. **Use semantic HTML** - Accessibility-first approach
5. **Mobile-responsive design** - Test on multiple screen sizes

### API Development
1. **Use middleware consistently** - `auth`, `requirePermission`, `activityLogger`
2. **Validate all inputs** - Express-validator for request validation
3. **Handle errors gracefully** - Use `asyncHandler` wrapper
4. **Log user activities** - Track all CRUD operations
5. **Implement pagination** - For all list endpoints

### Code Quality Standards
```typescript
// ✅ Good - Proper error handling with user feedback
try {
  const response = await userService.deleteUser(userId);
  showToast(response.message, 'success');
  refreshUsers();
} catch (error) {
  showToast(error.message || 'Error al eliminar usuario', 'error');
}

// ✅ Good - Type-safe permission checking
if (!hasPermission('DELETE_USERS')) {
  return <div>No tienes permisos suficientes</div>;
}

// ✅ Good - Proper component structure
export default function UsersPage() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  
  if (!hasPermission('READ_USERS')) {
    return <UnauthorizedPage />;
  }
  
  return (
    <ProtectedRoute requiredPermissions={['READ_USERS']}>
      {/* Component content */}
    </ProtectedRoute>
  );
}
```

## 🎨 UI/UX Guidelines

### Design System
- **Primary Colors** - Blue/indigo theme with proper contrast ratios
- **Typography** - Inter font family for consistency
- **Spacing** - Tailwind spacing scale (4, 8, 16, 24px pattern)
- **Icons** - Lucide React for consistency
- **Animations** - Subtle transitions with Tailwind CSS

### Component Patterns
```tsx
// Standard modal pattern
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title">
  <form onSubmit={handleSubmit}>
    {/* Form content */}
    <div className="flex justify-end gap-2 pt-4">
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button type="submit" loading={loading}>
        Guardar
      </Button>
    </div>
  </form>
</Modal>

// Standard table pattern with actions
<div className="overflow-x-auto">
  <table className="min-w-full bg-white border border-gray-200">
    <thead className="bg-gray-50">
      <tr>
        {/* Table headers */}
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="border-t hover:bg-gray-50">
          {/* Table cells */}
          <td className="px-6 py-4 text-sm text-right space-x-2">
            <Button size="sm" variant="ghost" onClick={() => handleEdit(item.id)}>
              <Edit className="h-4 w-4" />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## 🔄 Common Development Tasks

### Adding New Feature
1. **Define permissions** - What permissions are needed?
2. **Create backend routes** - API endpoints with proper middleware
3. **Add frontend components** - Pages, modals, forms
4. **Update navigation** - Add to Navigation.tsx if needed
5. **Add to routes** - Update app/routes.ts
6. **Test permissions** - Verify RBAC works correctly

### Database Operations
```typescript
// Backend model creation
const newUser = await User.create({
  nombre,
  apellido,
  correo,
  password: hashedPassword,
  role: roleId
});

// Frontend API call with error handling
const response = await userService.createUser(userData);
if (response.success) {
  showToast(response.message, 'success');
  onClose();
  refreshUsers();
}
```

### State Management Patterns
```typescript
// Using context properly
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Always memoize context values
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission
  }), [user, isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🔍 Debugging & Testing

### Common Issues
- **Provider hierarchy** - Ensure AuthProvider wraps all components
- **Permission checks** - Verify user has required permissions
- **Token expiration** - Handle 401 responses gracefully
- **Route protection** - Use ProtectedRoute for authenticated pages
- **CORS issues** - Check server CORS configuration

### Development Commands
```bash
# Frontend development
npm run dev

# Backend development
npm run backend:dev

# Full stack development
npm run dev:all

# Database seeding
npm run backend:seed

# Type checking
npm run typecheck
```

## 🌟 Best Practices

### Security
- Always validate user permissions before actions
- Use HTTPS in production
- Sanitize user inputs
- Log security-related activities
- Implement rate limiting

### Performance
- Implement pagination for large datasets
- Use React.memo for expensive components
- Optimize images and assets
- Use proper loading states
- Implement efficient database queries

### Accessibility
- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation
- Maintain proper contrast ratios
- Add ARIA labels where needed

### Code Organization
- Group related files together
- Use consistent naming conventions
- Write descriptive comments
- Keep components small and focused
- Extract reusable logic into hooks

## 🚀 Deployment & Production

### Environment Setup
```env
# Backend (.env)
NODE_ENV=production
DATABASE_URL=mongodb://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
API_PORT=3001

# Frontend (handled by Vite)
VITE_API_URL=http://localhost:3001/api
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database connection secure
- [ ] JWT secrets properly set
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error logging implemented
- [ ] SSL certificate installed

## 📚 Key Files Reference

### Critical Frontend Files
- `app/root.tsx` - Application root with providers
- `app/context/AuthContext.tsx` - Authentication state management
- `app/components/Layout.tsx` - Main application layout
- `app/components/auth/Navigation.tsx` - Main navigation component
- `app/services/api.ts` - API service layer

### Critical Backend Files
- `server/index.ts` - Express server setup
- `server/middleware/auth.ts` - Authentication middleware
- `server/routes/auth.ts` - Authentication endpoints
- `server/config/database.ts` - MongoDB connection
- `server/models/User.ts` - User model schema

Remember: This is a professional payroll management system. Always prioritize security, user experience, and data integrity in your implementations.

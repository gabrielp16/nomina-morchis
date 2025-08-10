import { useState } from 'react';
import { User, LogOut, Settings, Shield, Users, ChevronDown, Activity, UserCheck, ChartArea } from 'lucide-react';
import { Button } from '../ui/button';
import { LoginSidebar } from './LoginSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import logoSistema from "../../components/welcome/logo-sistema.svg";
import { Link } from 'react-router';

export function Navigation() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const { user, isAuthenticated, logout, hasPermission } = useAuth();
  const { info } = useToast();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setShowConfigMenu(false);
    info('Has cerrado sesión correctamente');
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/dashboard" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  {/* Logo y Título de Sistema Nómina */}
                  <div className="flex items-center mb-4 mt-4">
                    <img
                      src={logoSistema}
                      alt="Sistema Nómina"
                      className="h-12 w-auto mr-4"
                    />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Nómina
                    </h2>
                  </div>
                </Link>
              </div>
            </div>

            {/* Navigation Links - Vacío, todo se mueve al menú de usuario */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Espacio vacío - toda la navegación está en el menú de usuario */}
            </div>

            {/* User Menu / Login Button */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.role}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 z-50 border">
                      {/* 1. NOMBRE DEL USUARIO */}
                      <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {user?.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {user?.email}
                            </p>
                            <p className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded-full inline-block mt-1">
                              {user?.role}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 2. SECCIÓN DE CONFIGURACIÓN */}
                      <div className="py-2">
                        <div className="px-4 py-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Sistema
                          </p>
                        </div>
                        
                        {/* Dashboard Link */}
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowConfigMenu(false);
                          }}
                        >
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <ChartArea className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">Dashboard</span>
                        </Link>

                        {/* Configuración con Submenú */}
                        <div className="relative">
                          <button
                            onClick={() => setShowConfigMenu(!showConfigMenu)}
                            className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                <Settings className="h-4 w-4 text-gray-600" />
                              </div>
                              <span className="font-medium">Configuración</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showConfigMenu ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} />
                          </button>
                          
                          {/* 2.1-2.4 Submenú de Configuración */}
                          {showConfigMenu && (
                            <div className="bg-gray-50 border-l-2 border-blue-200 ml-4 mr-2 rounded-r-lg">
                              {hasPermission('READ_USERS') && (
                                <Link
                                  to="/users"
                                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    setShowConfigMenu(false);
                                  }}
                                >
                                  <div className="h-6 w-6 bg-green-100 rounded-md flex items-center justify-center mr-3">
                                    <Users className="h-3 w-3 text-green-600" />
                                  </div>
                                  <span>Usuarios</span>
                                </Link>
                              )}
                              
                              {hasPermission('READ_ROLES') && (
                                <Link
                                  to="/roles"
                                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    setShowConfigMenu(false);
                                  }}
                                >
                                  <div className="h-6 w-6 bg-purple-100 rounded-md flex items-center justify-center mr-3">
                                    <UserCheck className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <span>Roles</span>
                                </Link>
                              )}
                              
                              {hasPermission('READ_PERMISSIONS') && (
                                <Link
                                  to="/permissions"
                                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    setShowConfigMenu(false);
                                  }}
                                >
                                  <div className="h-6 w-6 bg-yellow-100 rounded-md flex items-center justify-center mr-3">
                                    <Shield className="h-3 w-3 text-yellow-600" />
                                  </div>
                                  <span>Permisos</span>
                                </Link>
                              )}

                              {hasPermission('READ_AUDIT') && (
                                <Link
                                  to="/activity"
                                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    setShowConfigMenu(false);
                                  }}
                                >
                                  <div className="h-6 w-6 bg-orange-100 rounded-md flex items-center justify-center mr-3">
                                    <Activity className="h-3 w-3 text-orange-600" />
                                  </div>
                                  <span>Activity</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 3. LOGOUT */}
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="px-4 py-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Sesión
                          </p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                            <LogOut className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="font-medium">Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setLoginMode('login');
                      setIsLoginOpen(true);
                    }}
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => {
                      setLoginMode('register');
                      setIsLoginOpen(true);
                    }}
                  >
                    Registrarse
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Sidebar */}
      <LoginSidebar
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        mode={loginMode}
        onModeChange={setLoginMode}
      />

      {/* Overlay para cerrar menú de usuario al hacer clic fuera */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowConfigMenu(false);
          }}
        />
      )}
    </>
  );
}

import { Link } from 'react-router';
import { Home, ArrowLeft, Search, User, Calendar, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import logoSistema from "../components/welcome/logo-sistema.svg";

export default function NotFoundPage() {
  const { isAuthenticated, hasPermission } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src={logoSistema}
                  alt="Sistema Nómina"
                  className="h-10 w-auto mr-3"
                />
                <h1 className="text-xl font-bold text-gray-900">
                  Sistema Nómina
                </h1>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main 404 content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          {/* 404 illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-100 rounded-full mb-4">
              <Search className="w-16 h-16 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-gray-900">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700">Página no encontrada</h2>
            </div>
          </div>

          {/* Error message */}
          <div className="mb-8">
            <p className="text-gray-600 text-lg mb-2">
              Lo sentimos, la página que buscas no existe.
            </p>
            <p className="text-gray-500 text-sm">
              Es posible que la URL esté mal escrita o que la página haya sido movida.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver Atrás
              </Button>
              <Link to="/">
                <Button className="w-full sm:w-auto flex items-center justify-center">
                  <Home className="w-4 h-4 mr-2" />
                  Ir al Inicio
                </Button>
              </Link>
            </div>

            {/* Quick navigation for authenticated users */}
            {isAuthenticated && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Enlaces rápidos:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hasPermission('READ_PAYROLL') && (
                    <Link to="/payroll">
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Mi Nómina
                      </Button>
                    </Link>
                  )}
                  {hasPermission('READ_DASHBOARD') && (
                    <Link to="/dashboard">
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                        <Settings className="w-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile">
                    <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                      <User className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </Button>
                  </Link>
                  {hasPermission('READ_USERS') && (
                    <Link to="/employees">
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                        <User className="w-4 h-4 mr-2" />
                        Empleados
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional help */}
          <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              ¿Necesitas ayuda?
            </h3>
            <p className="text-sm text-blue-700">
              Si crees que esto es un error del sistema, por favor contacta al administrador.
            </p>
            {!isAuthenticated && (
              <div className="mt-3">
                <Link to="/">
                  <Button size="sm" variant="outline" className="text-xs">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Sistema Nómina. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

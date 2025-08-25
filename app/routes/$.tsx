import { Link } from 'react-router';
import { Home, ArrowLeft, User, Calendar, Settings, Coffee, MapPin, Navigation } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect, useState } from 'react';

export default function NotFoundPage() {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    hasPermission: (permission: string) => boolean;
  }>({
    isAuthenticated: false,
    hasPermission: () => false
  });

  useEffect(() => {
    // Intentar cargar el estado de autenticación desde localStorage de forma segura
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        const parsedUser = JSON.parse(user);
        const permissions = parsedUser?.permissions || [];
        
        setAuthState({
          isAuthenticated: true,
          hasPermission: (permission: string) => permissions.includes(permission)
        });
      }
    } catch (error) {
      console.log('No se pudo cargar el estado de autenticación:', error);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center space-y-12 max-w-4xl w-full">
        <div className="text-center">
          <h1 className="font-bold text-8xl md:text-9xl lg:text-[12rem] text-black">
            404
          </h1>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <img 
              src="/images/404-Not-found-page.png" 
              alt="Morchis Cook - Página no encontrada"
              className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-lg">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Regresar
          </Button>
          
          <Link to="/" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full"
            >
              <Home className="w-5 h-5 mr-2" />
              Ir a Casa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

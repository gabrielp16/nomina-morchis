import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Edit, Save, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/api';
import type { User as UserType } from '../types/auth';

export default function ProfilePage() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [profileData, setProfileData] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    numeroCelular: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await userService.getById(user.id);
      if (response.success && response.data) {
        setProfileData(response.data);
        setFormData({
          nombre: response.data.nombre || '',
          apellido: response.data.apellido || '',
          correo: response.data.correo || '',
          numeroCelular: response.data.numeroCelular || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar datos originales
    if (profileData) {
      setFormData({
        nombre: profileData.nombre || '',
        apellido: profileData.apellido || '',
        correo: profileData.correo || '',
        numeroCelular: profileData.numeroCelular || ''
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await userService.updateProfile({
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo: formData.correo,
        numeroCelular: formData.numeroCelular
      });

      if (response.success) {
        success('Perfil actualizado exitosamente');
        setIsEditing(false);
        loadProfile(); // Recargar datos
      } else {
        showError(response.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute requiredPermissions={[]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Mi Perfil
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Administra tu información personal
                </p>
              </div>
              <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
                {!isEditing ? (
                  <Button
                    onClick={handleEdit}
                    className="inline-flex items-center"
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSave}
                      className="inline-flex items-center"
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="inline-flex items-center"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Content */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {isLoading && !isEditing ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Avatar y nombre */}
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-10 w-10 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {profileData?.nombre} {profileData?.apellido}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {profileData?.role?.nombre || 'Usuario'}
                        </p>
                      </div>
                    </div>

                    {/* Información del perfil */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* Nombre */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre
                        </label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            placeholder="Ingresa tu nombre"
                            disabled={isLoading}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {profileData?.nombre || 'No especificado'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Apellido */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellido
                        </label>
                        {isEditing ? (
                          <Input
                            type="text"
                            value={formData.apellido}
                            onChange={(e) => handleInputChange('apellido', e.target.value)}
                            placeholder="Ingresa tu apellido"
                            disabled={isLoading}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {profileData?.apellido || 'No especificado'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Correo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correo Electrónico
                        </label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={formData.correo}
                            onChange={(e) => handleInputChange('correo', e.target.value)}
                            placeholder="Ingresa tu correo"
                            disabled={isLoading}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {profileData?.correo || 'No especificado'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Teléfono */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Celular
                        </label>
                        {isEditing ? (
                          <Input
                            type="tel"
                            value={formData.numeroCelular}
                            onChange={(e) => handleInputChange('numeroCelular', e.target.value)}
                            placeholder="Ingresa tu número de celular"
                            disabled={isLoading}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {profileData?.numeroCelular || 'No especificado'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información adicional (solo lectura) */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Información del Sistema
                      </h4>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Rol */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rol
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {profileData?.role?.nombre || 'No asignado'}
                            </span>
                          </div>
                        </div>

                        {/* Estado */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              profileData?.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {profileData?.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>

                        {/* Fecha de creación */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Miembro desde
                          </label>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {profileData?.createdAt ? formatDate(profileData.createdAt) : 'No disponible'}
                            </span>
                          </div>
                        </div>

                        {/* Última actualización */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Última actualización
                          </label>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {profileData?.updatedAt ? formatDate(profileData.updatedAt) : 'No disponible'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

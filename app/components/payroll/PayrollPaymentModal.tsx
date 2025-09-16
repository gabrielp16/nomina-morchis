import { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, User, CheckCircle, Share } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { payrollService, employeeService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type { Payroll, Employee } from '../../types/auth';

interface PayrollPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface QuincenaData {
  payrolls: Payroll[];
  total: number;
}

interface MonthlyData {
  primeraQuincena: QuincenaData;
  segundaQuincena: QuincenaData;
  totalMensual: number;
}

export function PayrollPaymentModal({ isOpen, onClose, onSuccess }: PayrollPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const primeraQuincenaRef = useRef<HTMLDivElement>(null);
  const segundaQuincenaRef = useRef<HTMLDivElement>(null);
  const { error: showError, success } = useToast();

  const handleConfirmarNomina = async (quincenaType: 'primera' | 'segunda') => {
    if (!selectedEmployee || !monthlyData) return;

    const payrollsToUpdate = quincenaType === 'primera' 
      ? monthlyData.primeraQuincena.payrolls 
      : monthlyData.segundaQuincena.payrolls;

    try {
      // Actualizar cada registro a estado "PAGADA"
      for (const payroll of payrollsToUpdate) {
        await payrollService.update(payroll.id, {
          estado: 'PAGADA'
        });
      }
      
      success(`Nómina de ${quincenaType} quincena confirmada exitosamente`);
      // Recargar datos para reflejar los cambios
      loadPayrollData();
      // Notificar al componente padre para que actualice sus datos
      onSuccess?.();
    } catch (error) {
      console.error('Error confirming payroll:', error);
      showError('Error al confirmar nómina');
    }
  };

  const handleCaptureAndShare = async (quincenaType: 'primera' | 'segunda') => {
    if (!selectedEmployee || !monthlyData) return;

    const employee = employees.find(e => e.id === selectedEmployee);
    const elementRef = quincenaType === 'primera' ? primeraQuincenaRef : segundaQuincenaRef;
    
    if (!elementRef.current || !employee) {
      showError('Error al preparar la captura');
      return;
    }

    // Función para crear una versión estilizada para captura
    const prepareElementForCapture = (element: HTMLElement) => {
      // Crear un contenedor principal con estilos mejorados
      const captureContainer = document.createElement('div');
      captureContainer.style.cssText = `
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        padding: 30px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        min-width: 800px;
        max-width: 1200px;
      `;

      // Header de la captura con información del empleado
      const header = document.createElement('div');
      header.style.cssText = `
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
      `;

      const employeeName = `${employee.user?.nombre || ''} ${employee.user?.apellido || ''}`.trim();
      const quincenaTitle = quincenaType === 'primera' ? 'Primera' : 'Segunda';
      
      header.innerHTML = `
        <div>
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; margin-bottom: 4px;">
            Nómina ${quincenaTitle} Quincena
          </h2>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">
            ${employeeName} • ${getMonthName(selectedMonth)} ${selectedYear}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; opacity: 0.8; margin-bottom: 4px;">Total a Pagar</div>
          <div style="font-size: 28px; font-weight: 800;">
            ${formatCurrency((quincenaType === 'primera' ? monthlyData?.primeraQuincena.total : monthlyData?.segundaQuincena.total) || 0)}
          </div>
        </div>
      `;

      captureContainer.appendChild(header);

      // Clonar y estilizar la tabla
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Crear contenedor para la tabla con estilos mejorados
      const tableContainer = document.createElement('div');
      tableContainer.style.cssText = `
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #e5e7eb;
      `;

      // Aplicar estilos mejorados a la tabla
      const applyEnhancedStyles = (el: HTMLElement) => {
        const allElements = [el, ...Array.from(el.querySelectorAll('*'))] as HTMLElement[];
        
        allElements.forEach(element => {
          // Estilos base
          element.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          
          // Estilos específicos por elemento
          if (element.tagName === 'TABLE') {
            element.style.cssText = `
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              background: white;
            `;
          }
          
          if (element.tagName === 'THEAD') {
            element.style.cssText = `
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            `;
          }
          
          if (element.tagName === 'TH') {
            element.style.cssText = `
              padding: 16px 12px;
              text-align: left;
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 2px solid #e5e7eb;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            `;
            
            // Alineación especial para columnas monetarias
            if (element.textContent?.includes('Valor') || 
                element.textContent?.includes('Consumos') || 
                element.textContent?.includes('Adelantos') ||
                element.textContent?.includes('Descuadre') ||
                element.textContent?.includes('Deudas') ||
                element.textContent?.includes('Salario')) {
              element.style.textAlign = 'right';
            }
          }
          
          if (element.tagName === 'TBODY') {
            element.style.background = 'white';
          }
          
          if (element.tagName === 'TR' && element.closest('tbody')) {
            element.style.cssText = `
              border-bottom: 1px solid #f3f4f6;
              transition: background-color 0.15s ease;
            `;
            
            // Alternar colores de filas
            const rowIndex = Array.from(element.parentNode!.children).indexOf(element);
            if (rowIndex % 2 === 1) {
              element.style.backgroundColor = '#fafafa';
            }
          }
          
          if (element.tagName === 'TD') {
            element.style.cssText = `
              padding: 12px;
              font-size: 13px;
              color: #111827;
              vertical-align: middle;
              border-bottom: 1px solid #f3f4f6;
            `;
            
            // Estilos especiales para diferentes tipos de columnas
            const textContent = element.textContent || '';
            
            // Valores monetarios
            if (textContent.includes('$') || textContent.includes('COP')) {
              element.style.fontWeight = '600';
              element.style.textAlign = 'right';
              element.style.fontFeatureSettings = '"tnum"';
              
              // Colores específicos para valores
              if (textContent.includes('-') || element.classList.contains('text-red-600')) {
                element.style.color = '#dc2626';
              } else if (element.classList.contains('text-green-600') || 
                        element.parentElement?.querySelector('th')?.textContent?.includes('Valor horas') ||
                        element.parentElement?.querySelector('th')?.textContent?.includes('Deudas')) {
                element.style.color = '#059669';
              }
            }
            
            // Día de la semana
            if (
              element.tagName === 'TD' &&
              (element as HTMLTableCellElement).cellIndex === 0
            ) {
              element.style.fontWeight = '600';
              element.style.color = '#374151';
            }
            
            // Horas trabajadas
            if (textContent.includes('h') && textContent.includes('m')) {
              element.style.fontWeight = '500';
              element.style.color = '#6b7280';
            }
          }
          
          if (element.tagName === 'TFOOT') {
            element.style.cssText = `
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              border-top: 2px solid #d1d5db;
            `;
          }
          
          if (element.tagName === 'TD' && element.closest('tfoot')) {
            element.style.cssText = `
              padding: 16px 12px;
              font-size: 14px;
              font-weight: 700;
              color: #111827;
              border-top: 2px solid #d1d5db;
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            `;
            
            const textContent = element.textContent || '';
            if (textContent.includes('$')) {
              element.style.textAlign = 'right';
              element.style.fontFeatureSettings = '"tnum"';
              
              if (textContent.includes('-')) {
                element.style.color = '#dc2626';
              } else if (element.classList.contains('text-green-600')) {
                element.style.color = '#059669';
              }
            }
          }
        });
      };

      applyEnhancedStyles(clone);
      
      // Remover elementos innecesarios para la captura (botones, etc.)
      const buttonsToRemove = clone.querySelectorAll('button, .ignore-screenshot');
      buttonsToRemove.forEach(btn => btn.remove());
      
      // Remover la parte del header con botones
      const headerWithButtons = clone.querySelector('.flex.items-center.justify-between.mb-4');
      if (headerWithButtons) {
        headerWithButtons.remove();
      }

      tableContainer.appendChild(clone);
      captureContainer.appendChild(tableContainer);

      // Footer con información adicional
      const footer = document.createElement('div');
      footer.style.cssText = `
        margin-top: 20px;
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        display: flex;
        justify-content: between;
        align-items: center;
        font-size: 12px;
        color: #6b7280;
      `;

      const currentDate = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      footer.innerHTML = `
        <div>
          <strong>Sistema de Nómina Morchis</strong> • Generado el ${currentDate}
        </div>
      `;

      captureContainer.appendChild(footer);
      
      return captureContainer;
    };

    try {
      // Dinamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Preparar elemento con estilos inline
      const preparedElement = prepareElementForCapture(elementRef.current);
      
      // Crear un contenedor temporal completamente aislado
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed !important;
        left: -99999px !important;
        top: -99999px !important;
        width: auto !important;
        height: auto !important;
        overflow: visible !important;
        z-index: -9999 !important;
        opacity: 0 !important;
        pointer-events: none !important;
      `;
      
      // Crear un iframe aislado para evitar herencia de estilos CSS
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        width: 1200px !important;
        height: 800px !important;
        border: none !important;
        background: transparent !important;
      `;
      
      tempContainer.appendChild(iframe);
      document.body.appendChild(tempContainer);
      
      // Esperar a que el iframe cargue
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        // Fallback timeout
        setTimeout(resolve, 100);
      });
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('No se pudo acceder al documento del iframe');
      }
      
      // Limpiar el documento del iframe y agregar solo nuestro contenido estilizado
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            }
            body {
              background: #f8fafc;
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body></body>
        </html>
      `);
      iframeDoc.close();
      
      // Agregar nuestro elemento preparado al iframe
      iframeDoc.body.appendChild(preparedElement);
      
      // Configuración ultra segura para html2canvas
      const canvas = await html2canvas(iframeDoc.body, {
        backgroundColor: '#f8fafc',
        scale: 2,
        logging: false,
        allowTaint: false,
        useCORS: false,
        foreignObjectRendering: false,
        removeContainer: false,
        width: 1200,
        height: 800,
        windowWidth: 1200,
        windowHeight: 800,
        // No ignorar elementos - todos deberían estar limpios
        ignoreElements: () => false
      });

      // Limpiar contenedor temporal
      document.body.removeChild(tempContainer);

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showError('Error al generar la imagen');
          return;
        }

        const fileName = `nomina_${employee.user?.nombre}_${employee.user?.apellido}_${quincenaType}_${getMonthName(selectedMonth)}_${selectedYear}.png`;
        
        // Check if Web Share API is available
        if (navigator.share) {
          try {
            const file = new File([blob], fileName, { type: 'image/png' });
            await navigator.share({
              title: `Nómina ${quincenaType === 'primera' ? 'Primera' : 'Segunda'} Quincena`,
              text: `Nómina de ${employee.user?.nombre} ${employee.user?.apellido} - ${getMonthName(selectedMonth)} ${selectedYear}`,
              files: [file]
            });
            success('Imagen compartida exitosamente');
          } catch (error) {
            console.error('Error sharing:', error);
            // Fallback to download
            downloadImage(blob, fileName);
          }
        } else {
          // Show sharing options
          showSharingOptions(blob, fileName, employee, quincenaType);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error capturing screenshot:', error);
      
      // Último fallback: captura con DOM-to-image si html2canvas falla completamente
      try {
        showError('Intentando método alternativo de captura...');
        
        // Fallback manual: crear canvas básico
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('No se pudo crear contexto de canvas');
        }
        
        // Configurar dimensiones básicas
        canvas.width = 800;
        canvas.height = 600;
        
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texto de fallback
        ctx.fillStyle = '#111827';
        ctx.font = '16px Arial';
        ctx.fillText('Error al capturar imagen automáticamente', 50, 50);
        ctx.fillText('Por favor, tome una captura manual', 50, 80);
        ctx.fillText(`Empleado: ${employee.user?.nombre} ${employee.user?.apellido}`, 50, 120);
        ctx.fillText(`${quincenaType === 'primera' ? 'Primera' : 'Segunda'} Quincena - ${getMonthName(selectedMonth)} ${selectedYear}`, 50, 150);
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            showError('Error crítico al generar imagen de respaldo');
            return;
          }

          const fileName = `nomina_fallback_${employee.user?.nombre}_${employee.user?.apellido}_${quincenaType}_${getMonthName(selectedMonth)}_${selectedYear}.png`;
          downloadImage(blob, fileName);
          showError('Se descargó una imagen de respaldo. Recomendamos tomar una captura manual.');
        }, 'image/png');
        
      } catch (fallbackError) {
        console.error('Error with manual fallback:', fallbackError);
        showError('Error crítico al capturar imagen. Por favor, tome una captura de pantalla manual.');
      }
    }
  };

  const downloadImage = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Imagen descargada exitosamente');
  };

  const showSharingOptions = (blob: Blob, fileName: string, employee: Employee, quincenaType: 'primera' | 'segunda') => {
    const url = URL.createObjectURL(blob);
    
    // Create sharing modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    const quincenaTitle = quincenaType === 'primera' ? 'Primera' : 'Segunda';
    const message = `Nómina ${quincenaTitle} Quincena - ${employee.user?.nombre} ${employee.user?.apellido} - ${getMonthName(selectedMonth)} ${selectedYear}`;
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Compartir nómina</h3>
        <div class="space-y-3">
          <button id="share-whatsapp" class="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            WhatsApp
          </button>
          <button id="share-email" class="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Correo Electrónico
          </button>
          <button id="download-image" class="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Descargar
          </button>
        </div>
        <button id="close-modal" class="mt-4 w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('#share-whatsapp')?.addEventListener('click', () => {
      const encodedMessage = encodeURIComponent(message);
      // For mobile, try to use WhatsApp app, for desktop use WhatsApp Web
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const whatsappUrl = isMobile 
        ? `whatsapp://send?text=${encodedMessage}`
        : `https://web.whatsapp.com/send?text=${encodedMessage}`;
      
      // Download image first, then open WhatsApp
      downloadImage(blob, fileName);
      window.open(whatsappUrl, '_blank');
      document.body.removeChild(modal);
      URL.revokeObjectURL(url);
    });
    
    modal.querySelector('#share-email')?.addEventListener('click', () => {
      const subject = encodeURIComponent(`Nómina ${quincenaTitle} Quincena`);
      const body = encodeURIComponent(message);
      const emailUrl = `mailto:?subject=${subject}&body=${body}`;
      
      // Download image first, then open email client
      downloadImage(blob, fileName);
      window.open(emailUrl, '_blank');
      document.body.removeChild(modal);
      URL.revokeObjectURL(url);
    });
    
    modal.querySelector('#download-image')?.addEventListener('click', () => {
      downloadImage(blob, fileName);
      document.body.removeChild(modal);
      URL.revokeObjectURL(url);
    });
    
    modal.querySelector('#close-modal')?.addEventListener('click', () => {
      document.body.removeChild(modal);
      URL.revokeObjectURL(url);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        URL.revokeObjectURL(url);
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      // Set default month and year to current
      const now = new Date();
      setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
      setSelectedYear(now.getFullYear().toString());
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEmployee && selectedMonth && selectedYear) {
      loadPayrollData();
    }
  }, [selectedEmployee, selectedMonth, selectedYear]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAll(1, 100);
      if (response.success && response.data) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      showError('Error al cargar empleados');
    }
  };

  const loadPayrollData = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) return;

    setLoading(true);
    try {
      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;

      const response = await payrollService.getAll(1, 100, {
        empleadoId: selectedEmployee,
        fechaInicio: startDate,
        fechaFin: endDate
      });

      if (response.success && response.data) {
        const payrolls = response.data.data;
        processMonthlyData(payrolls);
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
      showError('Error al cargar datos de nómina');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (payrolls: Payroll[]) => {
    const primeraQuincenaPayrolls: Payroll[] = [];
    const segundaQuincenaPayrolls: Payroll[] = [];

    payrolls.forEach(payroll => {
      let day: number;
      
      // Convertir a string para verificar si es ISO
      const fechaStr = String(payroll.fecha);
      
      if (fechaStr.includes('T') || fechaStr.includes('Z')) {
        // Es un string ISO, extraer el día directamente
        const datePart = fechaStr.split('T')[0];
        day = parseInt(datePart.split('-')[2], 10);
      } else {
        day = new Date(payroll.fecha).getDate();
      }
      
      if (day <= 15) {
        primeraQuincenaPayrolls.push(payroll);
      } else {
        segundaQuincenaPayrolls.push(payroll);
      }
    });

    const calculateTotal = (payrollList: Payroll[]) => {
      return roundUpToFifty(payrollList.reduce((sum, payroll) => {
        const subtotalConsumos = payroll.consumos.reduce((s, c) => s + c.valor, 0);
        const descuentoConsumos = subtotalConsumos * 0.15;
        const totalConsumos = subtotalConsumos - descuentoConsumos;
        return sum + (payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis);
      }, 0));
    };

    const primeraQuincenaTotal = calculateTotal(primeraQuincenaPayrolls);
    const segundaQuincenaTotal = calculateTotal(segundaQuincenaPayrolls);

    setMonthlyData({
      primeraQuincena: {
        payrolls: primeraQuincenaPayrolls,
        total: primeraQuincenaTotal
      },
      segundaQuincena: {
        payrolls: segundaQuincenaPayrolls,
        total: segundaQuincenaTotal
      },
      totalMensual: roundUpToFifty(primeraQuincenaTotal) + roundUpToFifty(segundaQuincenaTotal)
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Función para redondear hacia arriba a la quinta decena (50)
  const roundUpToFifty = (value: number) => {
    return Math.ceil(value / 50) * 50;
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDay = (date: string | Date) => {
    const dateStr = String(date);
    
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      // Es un string ISO, extraer el día directamente para evitar conversión de timezone
      const datePart = dateStr.split('T')[0];
      const day = datePart.split('-')[2];
      return day;
    }
    
    const d = new Date(date);
    return d.getDate().toString().padStart(2, '0');
  };

  const calculateDailyValue = (payroll: Payroll) => {
    const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
    const descuentoConsumos = subtotalConsumos * 0.15;
    const totalConsumos = subtotalConsumos - descuentoConsumos;
    const salarioNeto = payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis;
    return roundUpToFifty(salarioNeto);
  };

  const getMonthName = (month: string) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[parseInt(month) - 1];
  };

  const generateMonthOptions = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const month = i.toString().padStart(2, '0');
      months.push(
        <option key={month} value={month}>
          {getMonthName(month)}
        </option>
      );
    }
    return months;
  };

  const generateYearOptions = () => {
    const currentYear = 2025;
    const years = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(
        <option key={i} value={i.toString()}>
          {i}
        </option>
      );
    }
    return years;
  };

  const renderQuincenaTable = (title: string, quincenaData: QuincenaData, quincenaType: 'primera' | 'segunda') => {
    // Calcular totales por columna
    const totales = quincenaData.payrolls.reduce((acc, payroll) => {
      const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
      const descuentoConsumos = subtotalConsumos * 0.15;
      const totalConsumos = subtotalConsumos - descuentoConsumos;
      
      // Convertir horas y minutos a minutos totales para la suma
      const totalMinutos = (payroll.horasTrabajadas * 60) + payroll.minutosTrabajados;
      
      return {
        totalMinutos: acc.totalMinutos + totalMinutos,
        salarioBruto: acc.salarioBruto + payroll.salarioBruto,
        totalConsumos: acc.totalConsumos + totalConsumos,
        adelantos: acc.adelantos + payroll.adelantoNomina,
        descuadres: acc.descuadres + (payroll.descuadre || 0),
        deudas: acc.deudas + payroll.deudaMorchis,
        salarioNeto: acc.salarioNeto + roundUpToFifty(payroll.salarioBruto - totalConsumos - payroll.adelantoNomina - (payroll.descuadre || 0) + payroll.deudaMorchis)
      };
    }, {
      totalMinutos: 0,
      salarioBruto: 0,
      totalConsumos: 0,
      adelantos: 0,
      descuadres: 0,
      deudas: 0,
      salarioNeto: 0
    });

    // Convertir minutos totales de vuelta a horas y minutos
    const horasTotales = Math.floor(totales.totalMinutos / 60);
    const minutosTotales = totales.totalMinutos % 60;

    return (
      <div className="mb-8" ref={quincenaType === 'primera' ? primeraQuincenaRef : segundaQuincenaRef}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">{title}</h4>
          <div className="flex space-x-3">
            <Button
              onClick={() => handleConfirmarNomina(quincenaType)}
              variant="outline"
              size="sm"
              className="inline-flex items-center"
              disabled={quincenaData.payrolls.length === 0 || quincenaData.payrolls.every(p => p.estado === 'PAGADA')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Nómina
            </Button>
            <Button
              onClick={() => handleCaptureAndShare(quincenaType)}
              variant="outline"
              size="sm"
              className="inline-flex items-center"
              disabled={quincenaData.payrolls.length === 0}
            >
              <Share className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrada
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salida
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor horas
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumos
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adelantos
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuadre
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deudas Morchis
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quincenaData.payrolls.map((payroll) => {
                const subtotalConsumos = payroll.consumos.reduce((sum, consumo) => sum + consumo.valor, 0);
                const descuentoConsumos = subtotalConsumos * 0.15;
                const totalConsumos = subtotalConsumos - descuentoConsumos;
                
                return (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900">
                      {formatDay(payroll.fecha)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                      {formatTime(payroll.horaInicio)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                      {formatTime(payroll.horaFin)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                      {payroll.horasTrabajadas}h {payroll.minutosTrabajados}m
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payroll.salarioBruto)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(totalConsumos)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payroll.adelantoNomina)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payroll.descuadre || 0)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                      {formatCurrency(payroll.deudaMorchis)}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                      {formatCurrency(calculateDailyValue(payroll))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={3} className="px-2 py-3 text-sm font-semibold text-gray-900">
                  
                </td>
                <td className="px-2 py-3 text-sm font-bold text-gray-900">
                  {horasTotales}h {minutosTotales}m
                </td>
                <td className="px-2 py-3 text-sm font-bold text-green-600 text-right">
                  {formatCurrency(totales.salarioBruto)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-red-600 text-right">
                  -{formatCurrency(totales.totalConsumos)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-red-600 text-right">
                  -{formatCurrency(totales.adelantos)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-red-600 text-right">
                  -{formatCurrency(totales.descuadres)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-green-600 text-right">
                  {formatCurrency(totales.deudas)}
                </td>
                <td className="px-2 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totales.salarioNeto)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 transition-opacity opacity-100 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Pagar Nómina - Resumen Mensual
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empleado
              </label>
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Seleccionar empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.user?.nombre} {employee.user?.apellido}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {generateMonthOptions()}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {generateYearOptions()}
              </Select>
            </div>
          </div>

          {/* Contenido principal */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Cargando datos...</span>
            </div>
          ) : selectedEmployee && monthlyData ? (
            <div>
              {/* Header con información del empleado y mes */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-6 w-6 text-green-600 mr-2" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">
                        {employees.find(e => e.id === selectedEmployee)?.user?.nombre}{' '}
                        {employees.find(e => e.id === selectedEmployee)?.user?.apellido}
                      </h3>
                      <p className="text-sm text-green-700">
                        Resumen de {getMonthName(selectedMonth)} {selectedYear}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-700">Total Mensual</div>
                    <div className="text-xl font-bold text-green-900">
                      {formatCurrency(monthlyData.totalMensual)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tablas por quincena */}
              {renderQuincenaTable("Primera Quincena", monthlyData.primeraQuincena, 'primera')}
              {renderQuincenaTable("Segunda Quincena", monthlyData.segundaQuincena, 'segunda')}
            </div>
          ) : selectedEmployee ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay registros para este período
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron registros de nómina para {getMonthName(selectedMonth)} {selectedYear}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Selecciona un empleado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Selecciona un empleado para ver su resumen de nómina
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Convierte una fecha UTC a formato YYYY-MM-DD sin cambio de zona horaria
 * Útil para inputs type="date" que esperan fecha local
 */
export function dateToInputValue(date: Date | string): string {
  if (!date) {
    return '';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return '';
  }

  // Usar UTC para evitar conversiones de zona horaria
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha para mostrar en la UI en formato local
 * sin conversión de zona horaria
 */
export function formatDateDisplay(date: Date | string): string {
  if (!date) {
    return 'N/A';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return 'N/A';
  }

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

/**
 * Convierte un valor de input date (YYYY-MM-DD) a Date UTC
 */
export function inputValueToDate(dateString: string): Date {
  // Crear fecha en UTC para evitar conversiones de zona horaria
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formatea un número como moneda colombiana (COP)
 * @param value - El valor numérico a formatear
 * @returns String formateado como moneda (ej: "$1.234.567")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Enum de unidades de medida disponibles para productos
 */
export enum ProductUnit {
  KG = 'KG',
  LT = 'LT',
  UN = 'UN',
  MT = 'MT',
  M2 = 'M2',
  M3 = 'M3',
  LB = 'LB',
  GAL = 'GAL',
  OZ = 'OZ',
  TON = 'TON'
}

export const PRODUCT_UNITS = [
  { value: ProductUnit.KG, label: 'Kilogramos (KG)' },
  { value: ProductUnit.LT, label: 'Litros (LT)' },
  { value: ProductUnit.UN, label: 'Unidades (UN)' },
  { value: ProductUnit.MT, label: 'Metros (MT)' },
  { value: ProductUnit.M2, label: 'Metros Cuadrados (M2)' },
  { value: ProductUnit.M3, label: 'Metros Cúbicos (M3)' },
  { value: ProductUnit.LB, label: 'Libras (LB)' },
  { value: ProductUnit.GAL, label: 'Galones (GAL)' },
  { value: ProductUnit.OZ, label: 'Onzas (OZ)' },
  { value: ProductUnit.TON, label: 'Toneladas (TON)' }
] as const;

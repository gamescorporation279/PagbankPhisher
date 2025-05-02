import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format document (CPF or CNPJ)
 */
export function formatDocument(value: string): string {
  // Clean value (remove non-digits)
  const cleanValue = value.replace(/\D/g, '');
  
  // CPF format: XXX.XXX.XXX-XX
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } 
  // CNPJ format: XX.XXX.XXX/XXXX-XX
  else {
    return cleanValue
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
}

/**
 * Format expiry date
 */
export function formatExpiryDate(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length > 0) {
    let month = cleanValue.substring(0, 2);
    const year = cleanValue.substring(2, 6);
    
    // Validate month
    if (month.length === 2 && (parseInt(month) > 12 || parseInt(month) === 0)) {
      month = '12';
    }
    
    if (cleanValue.length <= 2) {
      return month;
    } else {
      return `${month}/${year}`;
    }
  }
  return '';
}

/**
 * Format CVV
 */
export function formatCVV(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Format card number in groups of 4
 */
export function formatCardNumber(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  const groups = [];
  
  for (let i = 0; i < cleanValue.length; i += 4) {
    groups.push(cleanValue.substring(i, i + 4));
  }
  
  return groups.join(' ');
}

/**
 * Validate document (CPF or CNPJ)
 */
export function validateDocument(document: string): boolean {
  const cleanDocument = document.replace(/\D/g, '');
  return cleanDocument.length >= 10 && cleanDocument.length <= 14;
}

/**
 * Validate expiry date
 */
export function validateExpiryDate(expiryDate: string): boolean {
  // Basic format validation MM/YYYY
  const regex = /^(0[1-9]|1[0-2])\/20\d{2}$/;
  if (!regex.test(expiryDate)) {
    return false;
  }
  
  // Validate that the date is in the future
  const [month, year] = expiryDate.split('/');
  const expiryDateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);
  
  return expiryDateObj >= today;
}

/**
 * Validate CVV
 */
export function validateCVV(cvv: string): boolean {
  const cleanCVV = cvv.replace(/\D/g, '');
  return cleanCVV.length === 3;
}

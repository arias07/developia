// ============================================
// SISTEMA DE MONEDAS Y CONVERSIÓN
// ============================================

import { logger } from '@/lib/logger';

export type CurrencyCode = 'USD' | 'MXN' | 'EUR' | 'COP' | 'ARS' | 'CLP' | 'PEN';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: 'USD', name: 'Dólar estadounidense', symbol: '$', locale: 'en-US' },
  MXN: { code: 'MXN', name: 'Peso mexicano', symbol: '$', locale: 'es-MX' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', locale: 'es-ES' },
  COP: { code: 'COP', name: 'Peso colombiano', symbol: '$', locale: 'es-CO' },
  ARS: { code: 'ARS', name: 'Peso argentino', symbol: '$', locale: 'es-AR' },
  CLP: { code: 'CLP', name: 'Peso chileno', symbol: '$', locale: 'es-CL' },
  PEN: { code: 'PEN', name: 'Sol peruano', symbol: 'S/', locale: 'es-PE' },
};

// Tasas de cambio aproximadas (USD como base)
// En producción, esto debería venir de una API como exchangerate-api.com
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  MXN: 17.5,    // 1 USD = 17.5 MXN
  EUR: 0.92,    // 1 USD = 0.92 EUR
  COP: 4000,    // 1 USD = 4000 COP
  ARS: 850,     // 1 USD = 850 ARS (muy volátil)
  CLP: 900,     // 1 USD = 900 CLP
  PEN: 3.75,    // 1 USD = 3.75 PEN
};

// Última actualización de tasas (para mostrar al usuario)
export const RATES_LAST_UPDATED = '2025-01-02';

/**
 * Convierte un monto de una moneda a otra
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;

  // Convertir a USD primero (moneda base)
  const amountInUSD = amount / EXCHANGE_RATES[from];

  // Luego convertir a la moneda destino
  const convertedAmount = amountInUSD * EXCHANGE_RATES[to];

  return Math.round(convertedAmount * 100) / 100; // Redondear a 2 decimales
}

/**
 * Convierte USD a la moneda especificada
 */
export function fromUSD(amountUSD: number, to: CurrencyCode): number {
  return convertCurrency(amountUSD, 'USD', to);
}

/**
 * Convierte cualquier moneda a USD
 */
export function toUSD(amount: number, from: CurrencyCode): number {
  return convertCurrency(amount, from, 'USD');
}

/**
 * Formatea un monto con el símbolo de moneda correcto
 */
export function formatCurrency(amount: number, currencyCode: CurrencyCode): string {
  const currency = CURRENCIES[currencyCode];

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'CLP' || currencyCode === 'COP' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'CLP' || currencyCode === 'COP' ? 0 : 2,
  }).format(amount);
}

/**
 * Obtiene el rango de precios en la moneda especificada
 */
export function getPriceRangeInCurrency(
  minUSD: number,
  maxUSD: number,
  currency: CurrencyCode
): { min: number; max: number; formatted: string } {
  const min = fromUSD(minUSD, currency);
  const max = fromUSD(maxUSD, currency);

  return {
    min,
    max,
    formatted: `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`,
  };
}

/**
 * Valida si un presupuesto en moneda local cumple con el mínimo en USD
 */
export function validateBudgetInCurrency(
  budgetLocal: number,
  localCurrency: CurrencyCode,
  minimumUSD: number
): {
  isValid: boolean;
  budgetInUSD: number;
  minimumInLocal: number;
  difference: number;
} {
  const budgetInUSD = toUSD(budgetLocal, localCurrency);
  const minimumInLocal = fromUSD(minimumUSD, localCurrency);
  const difference = budgetInUSD - minimumUSD;

  return {
    isValid: budgetInUSD >= minimumUSD,
    budgetInUSD,
    minimumInLocal,
    difference,
  };
}

// ============================================
// API DE TASAS DE CAMBIO (para producción)
// ============================================

interface ExchangeRateAPIResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

/**
 * Actualiza las tasas de cambio desde una API externa
 * Usar en producción con una API key real
 */
export async function fetchExchangeRates(apiKey?: string): Promise<Record<CurrencyCode, number>> {
  if (!apiKey) {
    logger.debug('No API key provided, using cached exchange rates', { service: 'currency' });
    return EXCHANGE_RATES;
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data: ExchangeRateAPIResponse = await response.json();

    // Mapear solo las monedas que soportamos
    const rates: Partial<Record<CurrencyCode, number>> = {};
    const supportedCurrencies = Object.keys(CURRENCIES) as CurrencyCode[];

    for (const currency of supportedCurrencies) {
      if (data.conversion_rates[currency]) {
        rates[currency] = data.conversion_rates[currency];
      }
    }

    return { ...EXCHANGE_RATES, ...rates };
  } catch (error) {
    logger.error('Error fetching exchange rates', error, { service: 'currency' });
    return EXCHANGE_RATES; // Fallback a tasas cacheadas
  }
}

// ============================================
// HELPERS PARA UI
// ============================================

/**
 * Detecta la moneda probable basándose en el país/locale del usuario
 */
export function detectUserCurrency(locale?: string): CurrencyCode {
  if (!locale) {
    // Intentar detectar del navegador en el cliente
    if (typeof navigator !== 'undefined') {
      locale = navigator.language;
    }
  }

  if (!locale) return 'USD';

  const localeLower = locale.toLowerCase();

  if (localeLower.includes('mx')) return 'MXN';
  if (localeLower.includes('co')) return 'COP';
  if (localeLower.includes('ar')) return 'ARS';
  if (localeLower.includes('cl')) return 'CLP';
  if (localeLower.includes('pe')) return 'PEN';
  if (localeLower.includes('es') || localeLower.includes('eu')) return 'EUR';

  return 'USD';
}

/**
 * Genera opciones para un selector de moneda
 */
export function getCurrencyOptions(): Array<{ value: CurrencyCode; label: string }> {
  return Object.values(CURRENCIES).map((c) => ({
    value: c.code,
    label: `${c.symbol} ${c.code} - ${c.name}`,
  }));
}

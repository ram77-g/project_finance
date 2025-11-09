import { useState, useEffect } from 'react';
import { currencyService } from '../services/currencyService';

interface CurrencyConversion {
  convertedAmount: number;
  exchangeRate: number;
  loading: boolean;
  error: string | null;
}

export const useCurrencyConversion = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  enabled: boolean = true
): CurrencyConversion => {
  const [convertedAmount, setConvertedAmount] = useState(amount);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      setExchangeRate(1);
      setError(null);
      return;
    }

    const fetchConversion = async () => {
      setLoading(true);
      setError(null);
      try {
        const [converted, rate] = await Promise.all([
          currencyService.convertCurrency(amount, fromCurrency, toCurrency),
          currencyService.getExchangeRate(fromCurrency, toCurrency)
        ]);
        setConvertedAmount(converted);
        setExchangeRate(rate);
      } catch (err) {
        console.error('Conversion error:', err);
        setError('Failed to fetch exchange rates');
        setConvertedAmount(amount);
        setExchangeRate(1);
      } finally {
        setLoading(false);
      }
    };

    fetchConversion();
  }, [amount, fromCurrency, toCurrency, enabled]);

  return { convertedAmount, exchangeRate, loading, error };
};

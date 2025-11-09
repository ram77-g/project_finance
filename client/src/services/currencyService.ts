import axios from 'axios';

interface ExchangeRates {
  [key: string]: number;
}

class CurrencyService {
  private exchangeRates: ExchangeRates = {};
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours cache (once per day)
  private readonly API_KEY = 'a7a2592c48ad4b5aa4d5d44510652a52'; // Free tier API key
  private readonly BASE_URL = 'https://openexchangerates.org/api';
  private fetchPromise: Promise<ExchangeRates> | null = null;

  async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (this.exchangeRates && Object.keys(this.exchangeRates).length > 0 && 
        (now - this.lastFetch < this.CACHE_DURATION)) {
      return this.exchangeRates;
    }

    // If a fetch is already in progress, return that promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Start a new fetch
    this.fetchPromise = (async () => {
      try {
        // Using openexchangerates.org for free tier
        const response = await axios.get(`${this.BASE_URL}/latest.json?app_id=${this.API_KEY}`);
        this.exchangeRates = response.data.rates;
        this.lastFetch = now;
        return this.exchangeRates;
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to estimated rates if API fails
        return this.getFallbackRates();
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  private getFallbackRates(): ExchangeRates {
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      CAD: 1.35,
      AUD: 1.52,
      INR: 85.0,
      CNY: 7.24,
      KRW: 1331.0,
      SGD: 1.34
    };
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rates = await this.getExchangeRates();
    
    // If either currency is not in the rates, return original amount
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      return amount;
    }

    // All rates are relative to USD
    // To convert from X to Y:
    // amount_in_Y = (amount_in_X / rate_X) * rate_Y
    // OR simpler: (amount_in_X / rate_X) gives us USD, then multiply by rate_Y
    
    const rateFrom = rates[fromCurrency]; // e.g., 83 for INR (1 USD = 83 INR)
    const rateTo = rates[toCurrency]; // e.g., 0.92 for EUR (1 USD = 0.92 EUR)
    
    // Convert to USD first
    const amountInUSD = amount / rateFrom;
    // Then convert to target currency
    const convertedAmount = amountInUSD * rateTo;

    return convertedAmount;
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return 1;

    const rates = await this.getExchangeRates();
    
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      return 1;
    }

    // All rates are relative to USD
    // rates[currency] = how many currency units = 1 USD
    // e.g., rates['INR'] = 83 means 1 USD = 83 INR
    // To get: 1 fromCurrency = ? toCurrency
    // We need: (1 fromCurrency in USD) * (1 USD in toCurrency)
    // Which is: (1 / rateFrom) * rateTo = rateTo / rateFrom
    
    const rateFrom = rates[fromCurrency]; // e.g., 83 for INR
    const rateTo = rates[toCurrency];     // e.g., 1 for USD
    
    // If converting from INR to USD:
    // rateFrom = 83 (1 USD = 83 INR)
    // So 1 INR = 1/83 USD = 0.012
    // We want the rate: 1 USD = ? INR
    // That's just rateFrom itself (83)
    
    // We want to display: 1 USD = ? fromCurrency (when converting fromCurrency to USD)
    // From: INR to USD
    // rateFrom = 83 (means 1 USD = 83 INR)
    // So to display "1 USD = 83 INR", we need to return rateFrom
    
    // Actually, let's think about what the hook wants:
    // We're converting fromCurrency to USD
    // exchangeRate should represent: 1 USD = exchangeRate * 1 fromCurrency
    // If fromCurrency is INR and rateFrom = 83, then 1 USD = 83 INR
    
    // So we should return rateFrom when converting to USD
    if (toCurrency === 'USD') {
      return rateFrom; // e.g., 83 means 1 USD = 83 INR
    }
    
    return rateTo / rateFrom;
  }

  // Batch convert multiple amounts at once for better performance
  async convertMultiple(amounts: number[], fromCurrency: string, toCurrency: string): Promise<number[]> {
    if (fromCurrency === toCurrency) return amounts;

    const rates = await this.getExchangeRates();
    
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      return amounts;
    }

    const rateFrom = rates[fromCurrency];
    const rateTo = rates[toCurrency];
    
    // Convert all amounts in one go
    return amounts.map(amount => {
      const amountInUSD = amount / rateFrom;
      return amountInUSD * rateTo;
    });
  }

  // Get conversion rate synchronously if rates are already cached
  convertSync(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;

    // Only use cached rates
    if (!this.exchangeRates || Object.keys(this.exchangeRates).length === 0) {
      return amount;
    }

    const rateFrom = this.exchangeRates[fromCurrency];
    const rateTo = this.exchangeRates[toCurrency];

    if (!rateFrom || !rateTo) {
      return amount;
    }

    const amountInUSD = amount / rateFrom;
    return amountInUSD * rateTo;
  }
}

export const currencyService = new CurrencyService();

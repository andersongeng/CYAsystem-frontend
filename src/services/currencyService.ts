import { api } from './api';

const API_URL = 'http://localhost:5000/api';

export interface ExchangeRate {
    currency: string;
    rate: number;
}

export const currencyService = {
    async getExchangeRate(currency: string): Promise<ExchangeRate> {
        const response = await api.get(`${API_URL}/exchange-currency/${currency}`);
        return response.data;
    }
};

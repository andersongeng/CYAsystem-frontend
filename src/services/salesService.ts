import { api } from './api';

const API_URL = 'http://localhost:5000/api';

export interface SaleProduct {
    product_id: number;
    quantity: number;
}

export interface SalePayment {
    payment_method: string;
    amount: number;
}

export interface SaleCreate {
    products: SaleProduct[];
    payment_methods: SalePayment[];
    rate: number;
}

export interface Sale {
    sale_id: number;
    sale_time: string;  // Changed from sale_date
    total_usd: number;      // Changed from total_amount
    rate: number;
}

export interface SaleDetail {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
}

export interface SalePaymentDetail {
    payment_method: string;
    amount: number;
}

export interface SaleDetailResponse {
    sale_id: number;
    store_id: number;
    user_id: number;
    total_usd: string;
    sale_time: string; // Changed from created_at
    rate: number;      // Exchange rate used for the sale
    details: SaleDetail[];
    payments: SalePaymentDetail[];
}

export const salesService = {
    async createSale(saleData: SaleCreate): Promise<any> {
        const response = await api.post(`${API_URL}/store/sale`, saleData);
        return response.data;
    },

    async getSales(): Promise<Sale[]> {
        try {
            const response = await api.get(`${API_URL}/store/sales`);

            // Handle different response formats
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (response.data.sales && Array.isArray(response.data.sales)) {
                return response.data.sales;
            }
            return [];
        } catch (error) {
            console.error('Error fetching sales:', error);
            return [];
        }
    },

    async getSaleById(saleId: number): Promise<SaleDetailResponse> {
        const response = await api.get(`${API_URL}/store/sale/${saleId}`);
        // Backend returns { sale: {...} }
        return response.data.sale || response.data;
    }
};


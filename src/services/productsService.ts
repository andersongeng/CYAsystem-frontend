import { api } from './api';

const API_URL = 'http://localhost:5000/api';

export interface Product {
    product_id: number;
    product_name: string;
    description?: string;
    base_price_usd: number;
    current_stock: number;
    // Add other fields as necessary based on backend response
}

export const productsService = {
    async getProducts(): Promise<Product[]> {
        const response = await api.get(`${API_URL}/store/products`);
        return response.data;
    },

    async createProduct(product: Omit<Product, 'product_id'>): Promise<Product> {
        const response = await api.post(`${API_URL}/store/products`, product);
        return response.data;
    },

    async updateProduct(productId: number, product: Partial<Omit<Product, 'product_id'>>): Promise<Product> {
        const response = await api.patch(`${API_URL}/store/products/${productId}`, product);
        return response.data;
    }
};

import { api } from './api';

// Interface for store data
export interface Store {
    id: number;
    name: string;
    owner_id: number;
}

// Interface for store check response
export interface StoreCheckResponse {
    has_store: boolean;
    store?: Store;
    message?: string;
}

// Interface for create store request
export interface CreateStoreData {
    name: string;
    phone: string;
    address?: string;
}

// Interface for create store response
export interface CreateStoreResponse {
    message: string;
    store: Store;
}

// Check if user has a store
export const checkUserStore = async (): Promise<StoreCheckResponse> => {
    const response = await api.get<StoreCheckResponse>('/store/');
    return response.data;
};

// Create a new store
export const createStore = async (data: CreateStoreData): Promise<CreateStoreResponse> => {
    const response = await api.post<CreateStoreResponse>('/store/', data);
    return response.data;
};

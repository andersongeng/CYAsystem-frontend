import { api } from './api';

// Interface for the daily stats response from backend
export interface DailyStatsResponse {
    date: string;
    total_sales_count: number;
    total_revenue_usd: string | number; // Updated
    total_revenue_bs: string | number;  // Added
    payment_breakdown: {
        method: string;
        total: number;
    }[]; // Updated to array of objects
}

// Interface for payment breakdown in array format (for display)
export interface PaymentBreakdown {
    method: string;
    total: number;
}

// Interface for processed daily stats (what the component uses)
export interface DailyStats {
    total_sales_count: number;
    total_revenue_usd: number; // Updated
    total_revenue_bs: number;  // Added
    payment_breakdown: PaymentBreakdown[];
}

// Get daily statistics from the control panel
export const getDailyStats = async (): Promise<DailyStats> => {
    const response = await api.get<DailyStatsResponse>('/store/control-panel/daily-stats');

    return {
        total_sales_count: response.data.total_sales_count,
        total_revenue_usd: Number(response.data.total_revenue_usd),
        total_revenue_bs: Number(response.data.total_revenue_bs),
        payment_breakdown: response.data.payment_breakdown.map(item => ({
            method: item.method,
            total: Number(item.total)
        }))
    };
};

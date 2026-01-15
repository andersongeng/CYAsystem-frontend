import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';

export const ProtectedRoute = () => {
    const isAuthenticated = !!authService.getToken();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

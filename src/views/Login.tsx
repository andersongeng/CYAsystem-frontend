import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmit } from '../hooks/useSubmit';
import { authService } from '../services/authService';
import { checkUserStore } from '../services/storeService';
import type { LoginData } from '../services/authService';
import './Register.css'; // Reusing Register styles for consistency due to identical structure

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<LoginData>({
        email: '',
        password: ''
    });

    const { isLoading, error, response, handleSubmit } = useSubmit<LoginData, any>(authService.loginUser);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Check for store when login is successful
    useEffect(() => {
        const checkStore = async () => {
            if (response) {
                try {
                    const storeCheck = await checkUserStore();
                    if (storeCheck.has_store) {
                        navigate('/control-panel');
                    } else {
                        navigate('/create-store');
                    }
                } catch (err) {
                    console.error('Error checking store:', err);
                    // If store check fails, assume no store or redirect to create-store as fallback
                    navigate('/create-store');
                }
            }
        };
        checkStore();
    }, [response, navigate]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(formData);
    };

    return (
        <div className="register-container">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={onSubmit} className="register-form">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="ejemplo@correo.com"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="********"
                    />
                </div>

                {error && <div className="error-message">Error: {error}</div>}
                {response && <div className="success-message">¡Bienvenido!</div>}

                <button type="submit" disabled={isLoading} className="submit-btn">
                    {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
            </form>
        </div>
    );
};

import React, { useState } from 'react';
import { useSubmit } from '../hooks/useSubmit';
import { authService } from '../services/authService';
import type { RegisterData } from '../services/authService';
import './Register.css'; // Importing specific styles

export const Register: React.FC = () => {
    const [formData, setFormData] = useState<RegisterData>({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const { isLoading, error, response, handleSubmit } = useSubmit<RegisterData, any>(authService.registerUser);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(formData);
    };

    return (
        <div className="register-container">
            <h2>Registro de Usuario</h2>
            <form onSubmit={onSubmit} className="register-form">
                <div className="form-group">
                    <label htmlFor="name">Nombre</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Ingrese su nombre completo"
                    />
                </div>

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
                    <label htmlFor="phone">Teléfono</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="Ingrese su teléfono"
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
                {response && <div className="success-message">¡Registro exitoso!</div>}

                <button type="submit" disabled={isLoading} className="submit-btn">
                    {isLoading ? 'Procesando...' : 'Registrar'}
                </button>
            </form>
        </div>
    );
};

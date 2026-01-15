import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmit } from '../hooks/useSubmit';
import { createStore, type CreateStoreData, type CreateStoreResponse } from '../services/storeService';
import './Register.css'; // Reusing Register styles for consistency

export const CreateStore: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<CreateStoreData>({
        name: '',
        phone: '',
        address: ''
    });

    const { isLoading, error, response, handleSubmit } = useSubmit<CreateStoreData, CreateStoreResponse>(createStore);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Watch for successful store creation
    useEffect(() => {
        if (response) {
            navigate('/control-panel');
        }
    }, [response, navigate]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(formData);
    };

    return (
        <div className="register-container">
            <h2>Crear Tienda</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                Para comenzar a usar el sistema, necesitas crear tu tienda.
            </p>

            <form onSubmit={onSubmit} className="register-form">
                <div className="form-group">
                    <label htmlFor="name">Nombre de la Tienda</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Mi Tienda"
                        minLength={3}
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
                        placeholder="+58 412 1234567"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="address">Dirección (Opcional)</label>
                    <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Calle Principal, Edificio..."
                        rows={3}
                        style={{ resize: 'vertical' }}
                    />
                </div>

                {error && <div className="error-message">Error: {error}</div>}
                {response && <div className="success-message">¡Tienda creada exitosamente!</div>}

                <button type="submit" disabled={isLoading} className="submit-btn">
                    {isLoading ? 'Creando...' : 'Crear Tienda'}
                </button>
            </form>
        </div>
    );
};

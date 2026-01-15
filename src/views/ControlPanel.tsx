import { useEffect, useState } from 'react';
import { getDailyStats, type DailyStats } from '../services/controlPanelService';
import { salesService, type Sale, type SaleDetailResponse } from '../services/salesService';
import '../App.css';

const ControlPanel = () => {
    const [stats, setStats] = useState<DailyStats | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSale, setSelectedSale] = useState<SaleDetailResponse | null>(null);
    const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);

    // Helper to format payment method names
    const formatPaymentMethod = (method: string): string => {
        const methodMap: { [key: string]: string } = {
            'cash': 'Efectivo',
            'cash_usd': 'Efectivo USD',
            'cash_bs': 'Efectivo Bolívares',
            'card': 'Tarjeta',
            'mobile_payment': 'Pago Móvil',
            'transfer': 'Transferencia'
        };
        return methodMap[method] || method.charAt(0).toUpperCase() + method.slice(1);
    };

    // Helper to format date
    const formatDate = (dateString: string): string => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string:', dateString);
            return dateString; // Fallback to raw string
        }
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSaleClick = async (saleId: number) => {
        try {
            setLoadingSaleDetails(true);
            const saleDetails = await salesService.getSaleById(saleId);
            console.log('Sale Details fetched:', saleDetails);
            console.log('Rate type:', typeof saleDetails.rate, 'Value:', saleDetails.rate);
            if (saleDetails.rate === undefined) {
                console.warn('Warning: Rate is missing from sale details', saleDetails);
            }
            setSelectedSale(saleDetails);
        } catch (err) {
            console.error('Error fetching sale details:', err);
            alert('Error al cargar los detalles de la venta');
        } finally {
            setLoadingSaleDetails(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch both in parallel
                const [statsData, salesData] = await Promise.all([
                    getDailyStats(),
                    salesService.getSales()
                ]);

                setStats(statsData);
                setSales(salesData || []);
            } catch (err: any) {
                const errorMessage = err?.response?.data?.message || err?.message || 'Error al cargar los datos';
                setError(errorMessage);
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="container">
                <h1>Panel de Control</h1>
                <p>Cargando datos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <h1>Panel de Control</h1>
                <p style={{ color: 'red' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Panel de Control</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h2>Estadísticas Diarias</h2>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ flex: 1 }}>
                        <h3>Total de Ventas (hoy)</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                            {stats?.total_sales_count || 0}
                        </p>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>ventas realizadas hoy</p>
                    </div>

                    <div className="card" style={{ flex: 1 }}>
                        <h3>Ingresos Totales</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                            Bs. {Number(stats?.total_revenue_bs || 0).toFixed(2)}
                        </p>
                        <p style={{ color: '#666', fontSize: '1rem', marginTop: '-0.5rem' }}>
                            (${Number(stats?.total_revenue_usd || 0).toFixed(2)})
                        </p>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>ingresos del día</p>
                    </div>
                </div>

                <div className="card">
                    <h3>Ingresos por Método de Pago</h3>
                    {stats?.payment_breakdown && stats.payment_breakdown.length > 0 ? (
                        <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ddd' }}>
                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Método de Pago</th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.payment_breakdown.map((item, index) => {
                                    // Identify currency for this payment method
                                    const isBs = ['cash_bs', 'mobile_payment', 'card'].includes(item.method);
                                    const amount = Number(item.total || 0);

                                    return (
                                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '0.5rem' }}>{formatPaymentMethod(item.method)}</td>
                                            <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                {isBs ? (
                                                    <span>
                                                        Bs. {amount.toFixed(2)}
                                                        {stats.total_revenue_bs > 0 && stats.total_revenue_usd > 0 && (
                                                            <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                                                                (${(amount / (stats.total_revenue_bs / stats.total_revenue_usd)).toFixed(2)})
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span>${amount.toFixed(2)}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: '#666', marginTop: '1rem' }}>No hay datos de métodos de pago disponibles</p>
                    )}
                </div>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2>Historial de Ventas</h2>
                <div className="card">
                    {sales.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>ID</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Fecha y Hora</th>
                                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => {
                                        const rate = Number(sale.rate || 0);
                                        const totalUsd = Number(sale.total_usd || 0);
                                        const totalBs = rate > 0 ? totalUsd * rate : 0;

                                        return (
                                            <tr
                                                key={sale.sale_id}
                                                onClick={() => handleSaleClick(sale.sale_id)}
                                                style={{
                                                    borderBottom: '1px solid #eee',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <td style={{ padding: '0.5rem' }}>{sale.sale_id}</td>
                                                <td style={{ padding: '0.5rem' }}>{formatDate(sale.sale_time)}</td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 'bold' }}>
                                                    {rate > 0 ? (
                                                        <span>
                                                            Bs. {totalBs.toFixed(2)}
                                                            <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                                                                (${totalUsd.toFixed(2)})
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span>${totalUsd.toFixed(2)}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                            No hay ventas registradas
                        </p>
                    )}
                </div>
            </section>

            {/* Sale Details Modal */}
            {selectedSale && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setSelectedSale(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '8px',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            color: '#333'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Detalles de Venta #{selectedSale.sale_id}</h2>
                            <button
                                onClick={() => setSelectedSale(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p><strong>Fecha:</strong> {formatDate(selectedSale.sale_time)}</p>
                            <p>
                                <strong>Tasa de Cambio:</strong> Bs. {Number(selectedSale.rate || 0).toFixed(2)} / $1
                            </p>
                            <p>
                                <strong>Total:</strong>{' '}
                                {Number(selectedSale.rate || 0) > 0 ? (
                                    <>
                                        Bs. {(Number(selectedSale.total_usd) * Number(selectedSale.rate)).toFixed(2)}
                                        <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '0.5rem' }}>
                                            (${Number(selectedSale.total_usd).toFixed(2)})
                                        </span>
                                    </>
                                ) : (
                                    `$${Number(selectedSale.total_usd).toFixed(2)}`
                                )}
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3>Productos</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Producto</th>
                                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Cantidad</th>
                                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Precio Unit.</th>
                                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.details.map((detail, index) => {
                                        const rate = Number(selectedSale.rate || 0);
                                        const unitPrice = Number(detail.unit_price);
                                        const subtotal = Number(detail.subtotal);

                                        return (
                                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '0.5rem' }}>{detail.product_name}</td>
                                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>{detail.quantity}</td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                    {rate > 0 ? (
                                                        <div>
                                                            <div>Bs. {(unitPrice * rate).toFixed(2)}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>${unitPrice.toFixed(2)}</div>
                                                        </div>
                                                    ) : (
                                                        `$${unitPrice.toFixed(2)}`
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                    {rate > 0 ? (
                                                        <div>
                                                            <div>Bs. {(subtotal * rate).toFixed(2)}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>${subtotal.toFixed(2)}</div>
                                                        </div>
                                                    ) : (
                                                        `$${subtotal.toFixed(2)}`
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <h3>Métodos de Pago</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Método</th>
                                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.payments.map((payment, index) => {
                                        const isBsPayment = ['cash_bs', 'mobile_payment', 'card'].includes(payment.payment_method);
                                        const rate = selectedSale.rate;

                                        return (
                                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '0.5rem' }}>{formatPaymentMethod(payment.payment_method)}</td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                    {isBsPayment && rate ? (
                                                        <span>
                                                            Bs. {(payment.amount * rate).toFixed(2)}
                                                            <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                                                                (${Number(payment.amount).toFixed(2)})
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            ${Number(payment.amount).toFixed(2)}
                                                            {rate && ['cash_usd'].includes(payment.payment_method) && (
                                                                <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                                                                    (Bs. {(payment.amount * rate).toFixed(2)})
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ControlPanel;


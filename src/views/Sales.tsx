import React, { useState, useEffect } from 'react';
import { productsService } from '../services/productsService';
import type { Product } from '../services/productsService';
import { salesService } from '../services/salesService';
import type { SalePayment } from '../services/salesService';
import { currencyService } from '../services/currencyService';
import BarcodeScanner from '../components/BarcodeScanner';

interface CartItem extends Product {
    quantity: number;
}

const Sales = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    const [payments, setPayments] = useState<SalePayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);

    // Form states
    const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState(1);

    // Payment form states
    const [paymentMethod, setPaymentMethod] = useState('cash_usd');
    const [paymentAmount, setPaymentAmount] = useState('');

    // Barcode scanner states
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [lastScannedBarcode, setLastScannedBarcode] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchExchangeRate();
    }, []);

    // Keyboard listener for USB/Bluetooth barcode scanners (e.g., Barcode to PC app)
    useEffect(() => {
        let barcodeBuffer = '';
        let lastKeyTime = Date.now();

        const handleKeyPress = (event: KeyboardEvent) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;

            // Reset buffer if more than 100ms between keystrokes (human typing is slower)
            if (timeDiff > 100) {
                barcodeBuffer = '';
            }

            lastKeyTime = currentTime;

            // Check if Enter key was pressed
            if (event.key === 'Enter') {
                if (barcodeBuffer.length > 0) {
                    console.log('📦 Barcode scanned from device:', barcodeBuffer);
                    handleBarcodeScan(barcodeBuffer);
                    barcodeBuffer = '';
                }
            } else if (event.key.length === 1) {
                // Only add printable characters
                barcodeBuffer += event.key;
            }
        };

        // Add event listener
        window.addEventListener('keypress', handleKeyPress);

        // Cleanup
        return () => {
            window.removeEventListener('keypress', handleKeyPress);
        };
    }, [products, cart]); // Re-create listener when products or cart changes

    const fetchExchangeRate = async () => {
        try {
            const data = await currencyService.getExchangeRate('USD');
            // Ensure we have a valid number
            const rate = typeof data.rate === 'string' ? parseFloat(data.rate) : data.rate;
            if (typeof rate === 'number' && !isNaN(rate)) {
                setExchangeRate(rate);
            } else {
                console.warn("Received invalid exchange rate:", data);
                setExchangeRate(null);
            }
        } catch (err) {
            console.error("Error fetching exchange rate", err);
            setExchangeRate(null);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await productsService.getProducts();
            if (Array.isArray(data)) {
                setProducts(data);
            } else if ((data as any).products && Array.isArray((data as any).products)) {
                setProducts((data as any).products);
            }
        } catch (err) {
            console.error("Error fetching products", err);
        }
    };

    const addToCart = () => {
        if (!selectedProductId) return;

        // Use loose comparison or string conversion for ID matching
        const product = products.find(p => String(p.product_id) === String(selectedProductId));
        if (!product) {
            return;
        }

        const existingItem = cart.find(item => String(item.product_id) === String(product.product_id));

        if (existingItem) {
            setCart(cart.map(item =>
                String(item.product_id) === String(product.product_id)
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, quantity }]);
        }

        setSelectedProductId('');
        setQuantity(1);
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter(item => String(item.product_id) !== String(productId)));
    };

    const handleBarcodeScan = (barcode: string) => {
        setLastScannedBarcode(barcode);
        alert(`Scanned barcode: ${barcode}\n\nNote: Automatic product lookup will be available when the barcode field is added to products.`);
    };

    const toggleScanner = () => {
        setIsScannerActive(!isScannerActive);
    };

    const addPayment = () => {
        if (!paymentAmount) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) return;

        setPayments([...payments, { payment_method: paymentMethod, amount }]);
        setPaymentAmount('');
    };

    const removePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.base_price_usd * item.quantity), 0);
    };

    const calculateTotalPaid = () => {
        return payments.reduce((total, p) => {
            if (p.payment_method === 'cash_bs' || p.payment_method === 'mobile_payment' || p.payment_method === 'card') {
                return total + (p.amount / (exchangeRate || 1));
            }
            return total + p.amount;
        }, 0);
    };

    const handleCompleteSale = async () => {
        const total = calculateTotal();
        const paid = calculateTotalPaid();

        if (Math.abs(paid - total) > 0.01) {
            alert(`Payment amount ($${paid.toFixed(2)}) does not match total ($${total.toFixed(2)})`);
            return;
        }

        setLoading(true);
        try {
            // Transform payments to send all amounts in USD
            const transformedPayments = payments.map(p => {
                if (['cash_bs', 'mobile_payment', 'card'].includes(p.payment_method)) {
                    return {
                        payment_method: p.payment_method,
                        amount: parseFloat((p.amount / (exchangeRate || 1)).toFixed(2))
                    };
                }
                return p;
            });

            await salesService.createSale({
                products: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                payment_methods: transformedPayments,
                rate: exchangeRate || 0
            });

            alert('Sale completed successfully!');
            setCart([]);
            setPayments([]);
            // Refresh stock
            fetchProducts();
        } catch (err) {
            console.error("Error creating sale", err);
            alert("Failed to create sale");
        } finally {
            setLoading(false);
        }
    };

    const total = calculateTotal();
    const totalPaid = calculateTotalPaid();
    const remaining = total - totalPaid;

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>New Sale</h2>
                {exchangeRate !== null && !isNaN(exchangeRate) && (
                    <div style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '4px',
                        color: '#1565c0',
                        fontWeight: '500'
                    }}>
                        Rate: {exchangeRate.toFixed(2)} Bs/$
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: '2 1 600px', minWidth: '300px' }}>
                    {/* Product Selection */}
                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>Add Product</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Product</label>
                                <select
                                    style={inputStyle}
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
                                >
                                    <option value="">Select a product...</option>
                                    {products.map(p => (
                                        <option key={p.product_id} value={p.product_id}>
                                            {p.product_name} - ${p.base_price_usd} {exchangeRate ? `(Bs. ${(p.base_price_usd * exchangeRate).toFixed(2)})` : ''} (Stock: {p.current_stock})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ width: '100px' }}>
                                <label style={labelStyle}>Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    style={inputStyle}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <button
                                onClick={addToCart}
                                disabled={!selectedProductId}
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: selectedProductId ? '#646cff' : '#ccc',
                                    marginTop: 0
                                }}
                            >
                                Add
                            </button>
                        </div>

                        {/* Barcode Scanner Section */}
                        <BarcodeScanner
                            onScanSuccess={handleBarcodeScan}
                            isActive={isScannerActive}
                            onToggle={toggleScanner}
                        />
                    </div>

                    {/* Cart Items */}
                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>Cart</h3>
                        {cart.length === 0 ? (
                            <p style={{ color: '#666', textAlign: 'center' }}>No items in cart</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #eee' }}>
                                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Product</th>
                                            <th style={{ textAlign: 'center', padding: '0.5rem' }}>Quantity</th>
                                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Price</th>
                                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                                            <th style={{ padding: '0.5rem' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map(item => (
                                            <tr key={item.product_id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '0.5rem' }}>{item.product_name}</td>
                                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                    <div>${item.base_price_usd}</div>
                                                    {exchangeRate && <div style={{ fontSize: '0.8rem', color: '#666' }}>Bs. {(item.base_price_usd * exchangeRate).toFixed(2)}</div>}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                    <div>${(item.base_price_usd * item.quantity).toFixed(2)}</div>
                                                    {exchangeRate && <div style={{ fontSize: '0.8rem', color: '#666' }}>Bs. {(item.base_price_usd * item.quantity * exchangeRate).toFixed(2)}</div>}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                                    <button
                                                        onClick={() => removeFromCart(item.product_id)}
                                                        style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            Total: ${total.toFixed(2)} {exchangeRate && <span style={{ fontSize: '1rem', color: '#666' }}>/ Bs. {(total * exchangeRate).toFixed(2)}</span>}
                        </div>
                    </div>
                </div>

                {/* Payment Section */}
                <div style={{ ...cardStyle, flex: '1 1 300px', minWidth: '300px' }}>
                    <h3 style={sectionTitleStyle}>Payment</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Method</label>
                        <select
                            style={inputStyle}
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="cash_usd">Efectivo USD</option>
                            <option value="cash_bs">Efectivo Bolívares</option>
                            <option value="card">Punto de Venta (Bs)</option>
                            <option value="mobile_payment">Pago Móvil (Bs)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>
                            Amount ({paymentMethod === 'cash_usd' ? '$' : 'Bs.'})
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number"
                                style={{ ...inputStyle, flex: 1 }}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder={`Remaining: ${paymentMethod === 'cash_usd'
                                    ? (remaining > 0 ? remaining.toFixed(2) : '0.00')
                                    : (exchangeRate && remaining > 0 ? (remaining * exchangeRate).toFixed(2) : '0.00')
                                    }`}
                            />
                            <button
                                onClick={addPayment}
                                disabled={!paymentAmount}
                                style={{ ...buttonStyle, padding: '0.5rem 1rem' }}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        {payments.map((p, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8f9fa', marginBottom: '0.5rem', borderRadius: '4px' }}>
                                <span>{p.payment_method.replace('_', ' ')}</span>
                                <span>
                                    {['cash_usd'].includes(p.payment_method) ? (
                                        <span>
                                            ${p.amount.toFixed(2)}
                                            {exchangeRate && <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                                                (Bs. {(p.amount * exchangeRate).toFixed(2)})
                                            </span>}
                                        </span>
                                    ) : (
                                        <span>
                                            Bs. {p.amount.toFixed(2)}
                                            {exchangeRate && <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                                                (${(p.amount / exchangeRate).toFixed(2)})
                                            </span>}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => removePayment(i)}
                                        style={{ marginLeft: '1rem', color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '2px solid #eee', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Due:</span>
                            <span>${total.toFixed(2)} {exchangeRate && <span style={{ fontSize: '0.9rem', color: '#666', display: 'block', textAlign: 'right' }}>Bs. {(total * exchangeRate).toFixed(2)}</span>}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#27ae60' }}>
                            <span>Paid:</span>
                            <span>${totalPaid.toFixed(2)} {exchangeRate && <span style={{ fontSize: '0.9rem', color: '#27ae60', display: 'block', textAlign: 'right' }}>Bs. {(totalPaid * exchangeRate).toFixed(2)}</span>}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 'bold', color: remaining > 0 ? '#e74c3c' : '#2c3e50' }}>
                            <span>Remaining:</span>
                            <span>${remaining > 0 ? remaining.toFixed(2) : '0.00'} {exchangeRate && <span style={{ fontSize: '0.9rem', color: remaining > 0 ? '#e74c3c' : '#2c3e50', display: 'block', textAlign: 'right' }}>Bs. {remaining > 0 ? (remaining * exchangeRate).toFixed(2) : '0.00'}</span>}</span>
                        </div>

                        <button
                            onClick={handleCompleteSale}
                            disabled={loading || cart.length === 0 || Math.abs(remaining) > 0.01}
                            style={{
                                ...buttonStyle,
                                width: '100%',
                                backgroundColor: (cart.length > 0 && Math.abs(remaining) <= 0.01) ? '#27ae60' : '#ccc',
                                cursor: (cart.length > 0 && Math.abs(remaining) <= 0.01) ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {loading ? 'Processing...' : 'Complete Sale'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: '#333'
};

const sectionTitleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: '1.5rem',
    color: '#2c3e50',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '0.5rem'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#666'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
};

const buttonStyle: React.CSSProperties = {
    padding: '0.8rem 1.5rem',
    border: 'none',
    backgroundColor: '#646cff',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s'
};

export default Sales;

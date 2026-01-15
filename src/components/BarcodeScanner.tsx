import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    isActive: boolean;
    onToggle: () => void;
}

const BarcodeScanner = ({ onScanSuccess, isActive, onToggle }: BarcodeScannerProps) => {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastScanned, setLastScanned] = useState<string>('');
    const scannerId = 'barcode-scanner-reader';

    useEffect(() => {
        // Only initialize and start when active
        if (isActive && !isScanning) {
            startScanning();
        }

        // Stop scanning when inactive
        if (!isActive && isScanning) {
            stopScanning();
        }

        // Cleanup on unmount
        return () => {
            if (html5QrCodeRef.current && isScanning) {
                stopScanning();
            }
        };
    }, [isActive]);

    const startScanning = async () => {
        if (isScanning) return;

        // Initialize scanner instance if it doesn't exist
        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode(scannerId);
        }

        const config = {
            fps: 10, // Frames per second for scanning
            qrbox: { width: 250, height: 250 } // Scanning box dimensions
        };

        const qrCodeSuccessCallback = (decodedText: string) => {
            console.log('Barcode scanned:', decodedText);
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
            setError(null);
        };

        try {
            // Use facingMode: "environment" to prefer back camera on mobile
            await html5QrCodeRef.current.start(
                { facingMode: "environment" },
                config,
                qrCodeSuccessCallback,
                undefined // Error callback - we ignore scan errors as they happen frequently
            );
            setIsScanning(true);
            setError(null);
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to start camera. Please check permissions.';
            setError(errorMsg);
            setIsScanning(false);
            console.error('Error starting scanner:', err);
        }
    };

    const stopScanning = async () => {
        if (!html5QrCodeRef.current || !isScanning) return;

        try {
            await html5QrCodeRef.current.stop();
            setIsScanning(false);
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    };

    return (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h4 style={{ margin: 0, color: '#2c3e50', marginBottom: '0.25rem' }}>
                        📷 Barcode Scanner
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                        Scan product barcodes with your camera
                    </p>
                </div>
                <button
                    onClick={onToggle}
                    style={{
                        padding: '0.6rem 1.2rem',
                        backgroundColor: isActive ? '#e74c3c' : '#646cff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        transition: 'background-color 0.2s'
                    }}
                >
                    {isActive ? '⏹ Stop' : '▶ Start Scanner'}
                </button>
            </div>

            {isActive && (
                <div>
                    {/* Scanner preview container */}
                    <div
                        id={scannerId}
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            margin: '0 auto 1rem',
                            border: '3px solid #646cff',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#000'
                        }}
                    />

                    {/* Error message */}
                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fee',
                            color: '#c33',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            marginBottom: '1rem',
                            border: '1px solid #fcc'
                        }}>
                            <strong>⚠ Error:</strong> {error}
                        </div>
                    )}

                    {/* Last scanned barcode display */}
                    {lastScanned && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            marginBottom: '1rem',
                            border: '1px solid #a5d6a7'
                        }}>
                            <strong>✓ Last Scanned:</strong> {lastScanned}
                        </div>
                    )}

                    {/* Instructions */}
                    <p style={{
                        textAlign: 'center',
                        color: '#666',
                        fontSize: '0.9rem',
                        margin: '0.5rem 0',
                        fontStyle: 'italic'
                    }}>
                        Point your camera at a barcode to scan
                    </p>

                    {/* Temporary notice */}
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        marginTop: '1rem',
                        border: '1px solid #ffeaa7'
                    }}>
                        <strong>ℹ Note:</strong> Automatic product lookup will be available when the barcode field is added to products in the backend.
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', textAlign: 'left' }}>
                <Outlet />
            </main>
        </div>
    );
};

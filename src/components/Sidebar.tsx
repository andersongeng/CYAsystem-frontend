import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsOpen(false);
        }
    };

    return (
        <>
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                ☰
            </button>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <span>CYA System</span>
                    <button className="close-sidebar-btn" onClick={toggleSidebar}>×</button>
                </div>
                <nav className="sidebar-nav">
                    <NavLink
                        to="/control-panel"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        Panel de Control
                    </NavLink>
                    <NavLink
                        to="/products"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        Productos
                    </NavLink>
                    <NavLink
                        to="/sales"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        Nueva venta
                    </NavLink>
                </nav>
            </aside>
        </>
    );
};

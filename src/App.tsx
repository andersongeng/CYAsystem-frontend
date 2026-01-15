import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css'
import { Register } from './views/Register'
import { Login } from './views/Login'
import { CreateStore } from './views/CreateStore'
import ControlPanel from './views/ControlPanel'
import Products from './views/Products';
import Sales from './views/Sales';
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './components/DashboardLayout'

function App() {
  const location = useLocation();

  const getLinkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      padding: '0.5rem 1rem',
      cursor: 'pointer',
      backgroundColor: isActive ? '#646cff' : 'transparent',
      color: isActive ? 'white' : 'inherit',
      border: '1px solid #646cff',
      borderRadius: '4px',
      textDecoration: 'none'
    };
  };

  return (
    <div className="App">
      {(location.pathname === '/login' || location.pathname === '/register') && (
        <nav style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link to="/login" style={getLinkStyle('/login')}>
            Iniciar Sesión
          </Link>
          <Link to="/register" style={getLinkStyle('/register')}>
            Registrarse
          </Link>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/control-panel" element={<ControlPanel />} />
            <Route path="/products" element={<Products />} /> {/* Replaced placeholder with Products component */}
            <Route path="/sales" element={<Sales />} />
          </Route>
          <Route path="/create-store" element={<CreateStore />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App


import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { useLanguage } from './context/LanguageContext';

// Pages
import Dashboard from './pages/Dashboard';
import ResumenFinanciero from './pages/ResumenFinanciero';
import Categorias from './pages/Categorias';
import Perfil from './pages/Perfil';
import Metas from './pages/Metas';
import ChatIA from './pages/ChatIA';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Configuracion from './pages/Configuracion';
import Reportes from './pages/Reportes';
import Presupuestos from './pages/Presupuestos';
import CursorFollower from './components/ui/CursorFollower';
import QuickAddModal from './components/ui/QuickAddModal';

// Layout Wrapper — gestiona el estado del sidebar móvil
const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-finance-900 text-finance-text relative font-sans">
      {/* Fondo Global Épico */}
      <div className="absolute inset-0 epic-bg-animate opacity-30 z-0"></div>

      {/* Capa de Partículas Sutiles (Post-Login) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`particle ${i % 5 === 0 ? 'particle-yellow' : 'particle-cyan'}`}
            style={{
              width: '2px',
              height: '2px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 30}s`,
              animationDelay: `${-Math.random() * 20}s`,
              opacity: 0.3
            }}
          />
        ))}
      </div>

      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      {/* Overlay oscuro en móvil */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0 z-10">
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative z-10">
          {children}
        </main>
      </div>

      {/* Modal de Registro Rápido Global */}
      <QuickAddModal />
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-finance-900 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-finance-primary"></div>
          <p className="text-finance-muted text-sm font-medium tracking-wide">{t('starting_system')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CursorFollower />
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />

        {/* Rutas Privadas */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/resumen" element={<ProtectedRoute><DashboardLayout><ResumenFinanciero /></DashboardLayout></ProtectedRoute>} />
        <Route path="/categorias" element={<ProtectedRoute><DashboardLayout><Categorias /></DashboardLayout></ProtectedRoute>} />
        <Route path="/metas" element={<ProtectedRoute><DashboardLayout><Metas /></DashboardLayout></ProtectedRoute>} />
        <Route path="/reportes" element={<ProtectedRoute><DashboardLayout><Reportes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/presupuestos" element={<ProtectedRoute><DashboardLayout><Presupuestos /></DashboardLayout></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><DashboardLayout><Perfil /></DashboardLayout></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><DashboardLayout><Configuracion /></DashboardLayout></ProtectedRoute>} />
        <Route path="/chatia" element={<ProtectedRoute><DashboardLayout><ChatIA /></DashboardLayout></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;

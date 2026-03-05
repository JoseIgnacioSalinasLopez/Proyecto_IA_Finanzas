import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Pages
import Dashboard from './pages/Dashboard';
import ResumenFinanciero from './pages/ResumenFinanciero';
import Categorias from './pages/Categorias';
import Perfil from './pages/Perfil';
import ChatIA from './pages/ChatIA'; // Nuevo módulo importado
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Layout Wrapper
const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-finance-900 text-finance-text">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-finance-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-finance-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />

      {/* Rutas Privadas */}
      <Route path="/" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/resumen" element={<ProtectedRoute><DashboardLayout><ResumenFinanciero /></DashboardLayout></ProtectedRoute>} />
      <Route path="/categorias" element={<ProtectedRoute><DashboardLayout><Categorias /></DashboardLayout></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><DashboardLayout><Perfil /></DashboardLayout></ProtectedRoute>} />
      <Route path="/chatia" element={<ProtectedRoute><DashboardLayout><ChatIA /></DashboardLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

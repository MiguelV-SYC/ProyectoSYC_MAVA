import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardAdminPage from './pages/DashboardAdminPage';
import SolicitaAccesoPage from './pages/SolicitaAccesoPage';
import RecuperarPasswordPage from './pages/RecuperarPasswordPage';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={user ? <DashboardAdminPage /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/solicita-acceso" element={<SolicitaAccesoPage/>} />
      <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
    </Routes>
  );
}

export default App;
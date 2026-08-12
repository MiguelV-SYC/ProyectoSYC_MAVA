import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardAdminPage from './pages/DashboardAdminPage';
import SolicitaAccesoPage from './pages/SolicitaAccesoPage';
import RecuperarPasswordPage from './pages/RecuperarPasswordPage';
import GestionUsuariosPage from './pages/GestionUsuariosPage';
import AprobacionUsuariosPage from './pages/AprobacionUsuarioPage';
import GestionProyectosPage from './pages/GestionProyectosPage';
import CiudadanosListPage from './pages/CiudadanosListPage';
import OperadorHomePage from './pages/OperadorHomePage';
import FichaCiudadanoPage from './pages/FichaCiudadanoPage';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.esAdminSyc ? (
            <DashboardAdminPage />
          ) : (
            <OperadorHomePage />
          )
        }
      />

      <Route 
        path="/solicita-acceso" 
        element={<SolicitaAccesoPage />} 
        />

      <Route 
        path="/recuperar-password" 
        element={<RecuperarPasswordPage />} 
        />

      <Route
        path="/usuarios"
        element={user?.esAdminSyc ? <GestionUsuariosPage /> : <Navigate to="/dashboard" replace />}
      />

      <Route
        path="/usuarios/aprobacion"
        element={user?.esAdminSyc ? <AprobacionUsuariosPage /> : <Navigate to="/dashboard" replace />}
      />

      <Route
        path="/proyectos"
        element={user?.esAdminSyc ? <GestionProyectosPage /> : <Navigate to="/dashboard" replace />}
      />

      <Route 
        path="/ciudadanos" 
        element={user ? <CiudadanosListPage /> : <Navigate to="/login" replace />} 
      />

      <Route 
        path="*" 
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />} 
      />

      <Route
        path="/ciudadanos/:id"
        element={user ? <FichaCiudadanoPage /> : <Navigate to="/login" replace />}
      />

    </Routes>
  );
}

export default App;
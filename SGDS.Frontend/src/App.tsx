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
import FormularioCiudadanoPage from './pages/FormularioCiudadanoPage';
import ListadoEmpresasPage from './pages/ListadoEmpresasPage';
import FichaEmpresaPage from './pages/FichaEmpresaPage';
import FormularioEmpresaPage from './pages/FormularioEmpresaPage';
import ListadoSolicitudesPage from './pages/ListadoSolicitudesPage';
import NuevaSolicitudPage from './pages/NuevaSolicitudPage';
import DetalleSolicitudPage from './pages/DetalleSolicitudPage';
import WorkflowKanbanPage from './pages/WorkFlowKanbanPage';
import DocumentosPage from './pages/DocumentosPage';

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

      <Route
        path="/ciudadanos/nuevo" 
        element={user ? <FormularioCiudadanoPage /> : <Navigate to="/login" replace />}
      />
      
      <Route
        path="/ciudadanos/:id/editar" 
        element={user ? <FormularioCiudadanoPage /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/empresas" 
        element={user ? <ListadoEmpresasPage /> : <Navigate to="login" replace />}
      />

      <Route
        path="/empresas/:id"
        element={user ? <FichaEmpresaPage /> : <Navigate to="login" replace />}
      /> 

      <Route
        path="/empresas/nueva"
        element={user ? <FormularioEmpresaPage /> : <Navigate to="login" replace />}
      />

      <Route
        path="/empresas/:id/editar"
        element={user ? <FormularioEmpresaPage /> : <Navigate to="login" replace />}
      />

      <Route
        path="/solicitudes"
        element={user ? <ListadoSolicitudesPage /> : <Navigate to="/login" replace /> }
      />

      <Route 
      path="/solicitudes/nueva" 
      element={user ? <NuevaSolicitudPage /> : <Navigate to="/login" replace />} 
      />

      <Route 
        path="/solicitudes/:id" 
        element={user ? <DetalleSolicitudPage/> : <Navigate to="/login" replace />} 
      />

      <Route
        path="/workflow"
        element={user ? <WorkflowKanbanPage /> : <Navigate to="/login" replace />}
      />

      <Route 
        path="/documentos" 
        element={user ? <DocumentosPage /> : <Navigate to="/login" replace />} 
      />

    </Routes>
    
  );
}

export default App;
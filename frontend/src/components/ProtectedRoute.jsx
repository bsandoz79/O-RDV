import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Si pas de token -> Retour au login
  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // Si un rôle spécifique est requis (ex: admin) et que l'user ne l'a pas
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;
}
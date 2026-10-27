import { Login } from "../pages/common";
import { useAuth } from "../hooks/useAuth";

export function AdminLayout({ children }) {
  const { auth } = useAuth();

  // Ruta protegida: sin sesión se muestra el login
  if (!auth) return <Login />;

  return <div>{children}</div>;
}

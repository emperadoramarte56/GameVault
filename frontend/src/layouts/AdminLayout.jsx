import { Login } from "../pages/common";

export function AdminLayout({ children }) {
  // Temporal: en el Bloque 3 se reemplaza por useAuth()
  const auth = null;

  if (!auth) return <Login />;

  return (
    <div>
      <p>AdminLayout</p>
      {children}
    </div>
  );
}

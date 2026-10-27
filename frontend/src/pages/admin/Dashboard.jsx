import React from "react";
import { Button } from "semantic-ui-react";
import { useAuth } from "../../hooks/useAuth";

export function Dashboard() {
  const { logout, auth } = useAuth();
  const user = auth.me; // datos de /auth/me/ guardados por el AuthContext

  // Nombre a mostrar: gamertag si existe, si no el username
  const nombre = user.gamertag || user.username;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <h3>Bienvenido, {nombre}</h3>
          <p>{user.email}</p>
        </div>
        <Button content="Cerrar Sesión" onClick={logout} />
      </div>
    </div>
  );
}

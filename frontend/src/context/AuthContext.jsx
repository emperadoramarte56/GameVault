import React, { useState, useEffect, createContext } from "react";
import { setToken, getToken, removeToken } from "../api/token";
import { useUser } from "../hooks/useUser";

// 1. Crear el contexto
export const AuthContext = createContext({
  auth: undefined,
  login: () => null,
  logout: () => null,
});

// 2. Crear el provider
export function AuthProvider({ children }) {
  // undefined = revisando sesión · null = sin sesión · {token, me} = sesión activa
  const [auth, setAuth] = useState(undefined);
  const { getMe } = useUser();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuth(null);
      return;
    }
    // Hay token guardado: se intenta recuperar la sesión. Si ya venció, se limpia.
    login(token).catch(() => {
      removeToken();
      setAuth(null);
    });
  }, []);

  const login = async (token) => {
    const me = await getMe(token); // si falla, lanza error y no se guarda nada
    setToken(token);
    setAuth({ token, me });
  };

  const logout = () => {
    removeToken();
    setAuth(null);
  };

  const valueContext = { auth, login, logout };

  // Evita el "flash" del login mientras se revisa si ya había sesión
  if (auth === undefined) return null;

  return (
    <AuthContext.Provider value={valueContext}>{children}</AuthContext.Provider>
  );
}

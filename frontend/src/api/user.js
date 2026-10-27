const API_URL = import.meta.env.VITE_BASE_API_URL;

// Convierte los errores de validación de DRF ({campo: ["mensaje"]}) en un texto legible.
function formatApiErrors(data) {
  if (!data || typeof data !== "object") return "No se pudo completar la solicitud";
  return Object.values(data).flat().join(" ");
}

export async function loginApi(formData) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/v1/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  if (response.status !== 200) {
    throw new Error("Usuario o contraseña incorrecta");
  }

  const result = await response.json();
  // Captura del PDF: aquí se ve en la consola que se obtuvo el token
  console.log("Token obtenido:", result.access);
  return result;
}

export async function registerApi(formData) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/v1/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const result = await response.json().catch(() => null);
  if (response.status !== 201) {
    throw new Error(formatApiErrors(result));
  }
  return result;
}

export async function getMeApi(token) {
  const response = await fetch(`${API_URL}/api/v1/auth/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Token vencido o inválido: se avisa para que el contexto cierre la sesión
  if (!response.ok) throw new Error("Sesión no válida");
  return response.json();
}

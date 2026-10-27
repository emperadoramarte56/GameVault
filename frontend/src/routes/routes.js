import routesClient from "./routes.client";
import routesAdmin from "./routes.admin";
import routesCommon from "./routes.common";

// El orden importa: "*" (Error404) va al final para que solo atrape lo que no coincida.
export const routes = [...routesAdmin, ...routesClient, ...routesCommon];

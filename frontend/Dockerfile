# Vite 8 requiere Node 20.19+ (se usa Node 22)
FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0 hace que Vite escuche en todas las redes del contenedor;
# sin esto la página se ve en blanco / no carga desde el navegador.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

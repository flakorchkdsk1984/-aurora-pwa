# --- Etapa 1: Construcción (Build) ---
FROM node:20-alpine AS build

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar la aplicación para producción
RUN npm run build

# --- Etapa 2: Servidor de Producción ---
FROM nginx:alpine AS production

# Copiar los archivos compilados de la etapa de construcción al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx para soportar rutas del SPA y PWA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

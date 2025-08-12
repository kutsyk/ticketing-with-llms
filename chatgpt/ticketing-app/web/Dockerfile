# Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY angular.json tsconfig.json ./
COPY src ./src
ARG API_BASE_URL
ENV NG_APP_API_BASE_URL=$API_BASE_URL
RUN npm run build -- --configuration=production

# Serve via Nginx
FROM nginx:alpine
COPY --from=build /app/dist/web/ /usr/share/nginx/html/
COPY ../nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

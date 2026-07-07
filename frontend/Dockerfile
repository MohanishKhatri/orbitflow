FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# final server with nginx as base image

FROM nginx:alpine

# removing old and adding our own conf file
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

#copying build things from prev imaget to main
COPY --from=build /app/dist /usr/share/nginx/html

# Create directory for Django static files (shared volume mount point)
RUN mkdir -p /usr/share/nginx/static

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
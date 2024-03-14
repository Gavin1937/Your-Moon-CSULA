FROM node:alpine3.17 AS build

# setup working dir & copy source code
WORKDIR /src/
COPY . .

# build
ARG BACKEND_URL
ARG CONTACT_EMAIL
RUN \
    mkdir config && echo '{"backend_url":"'"${BACKEND_URL}"'","contact_email":"'"${CONTACT_EMAIL}"'"}' > config/config.json && \
    npm install && npm run build


# serving built frontend with nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*
COPY --from=build /src/dist .
COPY ./nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]
EXPOSE 5173
FROM node:alpine3.17

# setup working dir & copy source code
WORKDIR /src/
COPY . .

# build
ARG BACKEND_URL
RUN \
    mkdir config && echo '{"backend_url":"'"${BACKEND_URL}"'"}' > config/config.json && \
    npm install && npm run build && npm install -g serve

# dev deploy
# ENTRYPOINT ["npm", "run", "dev"]

# production deploy
ENTRYPOINT ["serve", "-l", "tcp://0.0.0.0:5173", "dist"]

EXPOSE 5173
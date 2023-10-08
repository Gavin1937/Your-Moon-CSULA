FROM node:alpine3.17

# setup working dir & copy source code
WORKDIR /src/
COPY . .

# build
RUN npm install

# dev deploy
# ENV NODE_ENV="dev"
# ENTRYPOINT ["npm", "run", "devStart"]

# production deploy
ENV NODE_ENV="production"
ENTRYPOINT ["node", "index.js"]

EXPOSE 3001
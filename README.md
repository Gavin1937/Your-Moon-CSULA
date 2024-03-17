
# Your-Moon-CSULA

## Configure For Docker Compose (recommend)

We need to create a data directory for docker containers

Assuming you are in the root directory of this repository

1. create a new folder `data` under this directory, and create following folder structure

```
./data
   ├─── client
   │    └─── config
   └─── server
        ├─── config
        └─── uploadedImages
```

You can use following commands to create all of them at once

* Windows

```sh
mkdir data\client\config
mkdir data\server\config
mkdir data\server\uploadedImages
```

* MacOS & Linux

```sh
mkdir -p data/client/config
mkdir -p data/server/config
mkdir -p data/server/uploadedImages
```

2. follow [frontend client configuration document](./client/README.md#configure) to create all config file under `data/client/config`
   * **When using docker-compose, [configuring .env file](#configure-for-docker-compose-recommend) will automatically configure the client for you. You don't need to create a separate config file**
   * **When using docker along, you still need this step**

3. follow [backend client configuration document](./server/README.md#configure) to create all config file under `data/backend/config`
   * **Note that you should set the path of `log_file` to `/src/data/your-moon-server.log`, so server's log file can be put under `data/server`**
   * **Also Note that docker container will only accept `production.config.json` file, so be sure you create the right one**
   * You can use [./server/config/production.config.json.docker](./server/config/production.config.json.docker) as your starting point
   * **Be carefull about "frontend_url" field in the config file, you cannot use this field if deploying with reverse proxy**


## Deploy with Docker Compose (recommend)

Assuming you are in the root directory of this repository

### Configuration Docker Compose

* you have 2 options when deploying this application with docker-compose
  1. open frontend and backend in 2 separate ports
  2. only open one port, and use reverse proxy to route both frontend and backend
* you need to configure for both options
* for `2 separate ports`
   1. create a new file called `.env`
   2. and then add a new line in it: `BACKEND_URL="http://my.ip.addr.ess:3001"`
   3. this file will tell docker-compose where is the backend
      * you should set the port of backend base on how it is defined in `docker-compose.yml` file, by default its `3001`
   4. you can use file `.env.template` as your starting point
* for `use reverse proxy` option
   1. create a new file called `.env`
   2. and then add a new line in it: `APP_PORT=8080`
   3. this file will tell docker-compose which port to expose for the entire app
   4. you can use file `.env.template` as your starting point

> Note that, if you want to run Redis server with a username and password, you can modify `docker-compose.yml` or `docker-compose-reverse-proxy.yml` file, so `your-moon-redis -> build -> dockerfile` is set to `Dockerfile_user`. And you also need to [configure a redis.conf file](./redis/README.md) with the username and password you want.


### Deploy Entire App with Docker Compose

* deploying for `2 separate ports` option

```sh
docker-compose -f docker-compose.yml up -d
```

* deploying for `use reverse proxy` option

```sh
docker-compose -f docker-compose-reverse-proxy.yml up -d
```

* **Note that you should rebuild docker images to avoid using old/outdated image**

* rebuild for `2 separate ports` option
```sh
docker-compose -f docker-compose.yml build --no-cache
```

* rebuild for `use reverse proxy` option

```sh
docker-compose -f docker-compose-reverse-proxy.yml build --no-cache
```


## Deploy individual components manually

* [CLIENT (YourMoon)](./client/README.md)
* [SERVER](./server/README.md)


## DATABASE

[Refer to this document](./db/README.md)

## About Docker Network

[Refer to this document](./DockerNetwork.md)


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

3. follow [backend client configuration document](./server/README.md#configure) to create all config file under `data/backend/config`
   * **Note that you should set the path of `log_file` to `/src/data/your-moon-server.log`, so server's log file can be put under `data/server`**
   * **Also Note that docker container will only accept `production.config.json` file, so be sure you create the right one**
   * You can use [./server/config/production.config.json.docker](./server/config/production.config.json.docker) as your starting point


## Deploy with Docker Compose (recommend)

Assuming you are in the root directory of this repository

### Configuration Docker Compose

* you have 2 options when deploying this application with docker-compose
  1. open frontend and backend in 2 separate ports
  2. only open one port, and use reverse proxy to route both frontend and backend
* you only need to configure for `use reverse proxy` option
   1. create a new file called `.env`
   2. and then add a new line in it: `APP_PORT=8080`
   3. this file will tell docker-compose which port to expose for the entire app
   4. you can use file `.env.template` as your starting point


### Deploy Entire App with Docker Compose

* deploying for `2 separate ports` option

```sh
docker-compose -f .\docker-compose.yml up -d
```

* deploying for `use reverse proxy` option

```sh
docker-compose -f .\docker-compose-reverse-proxy.yml up -d
```

## Deploy individual components manually

* [CLIENT (YourMoon)](./client/README.md)
* [SERVER](./server/README.md)


## DATABASE

 - currently, you can only run this locally since there's no server that we can use (i think in the future we can use the schools virtual machine)
 - download a program called XAMPP
 - this is a video tutorial to set up XAMPP and configure it to create a database
    - https://www.youtube.com/watch?v=pVVACLH0la0&ab_channel=TroubleChute
 - you would also have to create a database called 'LunarImages'
 - Notes:
    - table is called 'YourMoonDB'

* Also considering using Docker for database
  * [checkout this documentation](https://dev.mysql.com/doc/mysql-installation-excerpt/8.0/en/docker-mysql-getting-started.html)

# Your-Moon Backend server

## Configure

1. in folder `src/server/config`, create a new file called `dev.config.json`
   * you can have 2 different configuration files for dev and production environment
   * If environment variable `NODE_ENV` is set to `production`
     * server will looking for file `production.config.json`
   * Else
     * server will looking for file `dev.config.json`
   * This tutorial will use `dev.config.json` as example
2. add following configuration in it

```jsonc
{
    "app_host": "localhost",
    "app_port": 3001,
    "max_upload_size": 31457280, // 30MB
    "log_file": "/path/to/your-moon-server.log",
    "log_level": "debug",
    "db": {
        "connectionLimit": 10,
        "host": "localhost",
        "port": 3306,
        "user": "username",
        "password": "password",
        "database": "YourMoonDB"
    }
}
```

3. you can use `.template` files under `src/server/config/` as your starting point


## Deploy

### Deploy with Docker (Recommended)

Assuming you are in folder `src/server`

run following command to deploy with docker

1. build the docker image

```sh
docker build -t your-moon-server .
```

2. then, run docker container with following command

```sh
docker run -it --rm --name your-moon-server -p 3001:3001 -v "$(pwd)/config:/src/config" -v "$(pwd)/uploadedImages:/src/uploadedImages" your-moon-server
```

### Deploy manually

1. install all dependencies

```sh
npm install
```

2. run the server with

```sh
node index.js
```

3. you can also deploy the server for development

```sh
npm run devStart
```

* **Note that you can tell the server to switch configuration file by setting environment variable**
  * Server will use `dev.config.json` if environment variable `NODE_ENV != "production"`
  * Server will use `production.config.json` if environment variable `NODE_ENV == "production"`

## Running Backend

Backend is running on [http://localhost:3001](http://localhost:3001) by default

All endpoints in backend are start with `/api/`


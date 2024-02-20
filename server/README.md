# Your-Moon Backend server

## Configure

1. in folder `src/server/config`, create a new file called `dev.config.json`
   * you can have 2 different configuration files for dev and production environment
   * If environment variable `NODE_ENV` is set to `production`
     * server will looking for file `production.config.json`
   * Else
     * server will looking for file `dev.config.json`
   * This tutorial will use `dev.config.json` as example
2. you can tell the server to use either **AWS S3** or **file system** as storage method by setting the environment variable `STORAGE_METHOD`
   * If environment variable `STORAGE_METHOD` is set to `s3`
     * server will use **AWS S3** as multer storage method
   * Otherwise
     * server will save images in **file system**
3. add following configuration in it

```jsonc
{
    "app_host": "localhost",
    "app_port": 3001,
    "max_upload_size": 31457280, // 30MB
    "log_file": "/path/to/your-moon-server.log",
    "log_level": "debug",
    "session_key": "Base64_random_bytes_for_express_session_secret",
    "aes_key": "Base64_aes_key_256_bits_for_email_encryption",
    "jwt_secret": "Base64_jwt_secret_with_HS256_algorithm_512_bits",
    "frontend_url": "http://localhost:5173", // Do not add trailing "/" to the url.
    "cors_origin_whitelist": [
        "http://localhost:5173"
    ],
    "rate_limit": {
        "windowMs": 3600000, // 1 "window" is 3600000 ms (1 hr)
        "limit": 50 // 50 requests per IP in 1 "window"
    },
    "jobtable": {
        "type": "can be either \"redis\" or \"native\"",
        "expire": 600, // 10 min
        "host": "127.0.0.1",
        "port": 6379,
        "username": "remove this field if no user account",
        "password": "remove this field if no user account"
    },
    "db": {
        "host": "localhost",
        "port": 3306,
        "user": "username",
        "password": "password",
        "database": "YourMoonDB"
    },
    "aws": {
        "accessKeyId": "SUPER/SECRET?KEY1",
        "secretAccessKey": "THIS@KEY%IS*EVEN%MORE$SECRET",
        "region": "us-west-2",
        "bucket_name": "my-bucket-name"
    },
    "oauth":{
        "github":{
            "clientId":"somesecretid",
            "clientSecret":"somesecretsecret"
        },
        "google":{
            "clientId":"somesecretid",
            "clientSecret":"somesecretsecret"
        }
    }
}
```

* Note that both `aes_key`, `jwt_secret`, and `session_key` are saved as base64 encoded strings. To create them, you can run following python script in any python 3.x environment. (I suggest [this website](https://www.programiz.com/python-programming/online-compiler/) for anyone who don't want to install python)

```py
from random import randbytes
from base64 import b64encode
print(b64encode(randbytes(int(int(input('How many bits: '))/8))).decode('utf-8'))
```

* Also Note that `aes_key` is the key used for encrypt email, if you lost it, you cannot decrypt emails in the database anymore.

* `frontend_url` field is a string url of the frontend, this is here because we don't want to missuse `cors_origin_whitelist` list. **Do not add trailing "/" to the url.**
  * **Note that, this field is not required when deploying the app with reverse proxy**
  * Set this field to `null` if you don't need it

* `cors_origin_whitelist` field is a list of urls to the the frontend, they are whitelist for cors cross origin protection. This is because we need to send credentials (cookie) from the frontend to backend.

* `rate_limit` field tells the backend how to setup rate limiting for all the endpoints.
  * `windowMs` is how many milliseconds per `window`
  * `limit` is how many requests is allowed per IP in 1 `window`
  * In the template showed above, we have `windowMs = 3600000` and `limit = 50`.
  * Which means, **for each IP**, we allow **50 requests** to **all the endpoints** within **3600000 ms (1 hour)**

* `jobtable` field tells the backend where to save its temporary cache data. The most important item is `type`, which can be either `redis` or `native`. The backend will use Redis server or JavaScript Object as its cache base on this value.
  * Although its recommend to setup user account for your Redis server, if you want to use default user, you can just remove `username` and `password` fields from `jobtable`. Or, just put `null` for them.
* `aws` field contains all the informations of an aws s3 bucket, so the backend can save file to s3. If set it to `null`, backend will save file to `server/uploadedImages/` folder in the filesystem.

1. you can use `.template` files under `src/server/config/` as your starting point


## Deploy

### Deploy with Docker Compose (Recommended)

Assuming you are in folder `src/server`

1. run following command to build with docker image

```sh
docker-compose -f docker-compose.yml build --no-cache
```

2. run following command to deploy

```sh
docker-compose -f docker-compose.yml up -d
```

### Deploy with Docker individually

Assuming you are in folder `src/server`

run following command to deploy with docker

1. build the docker image

```sh
docker build -t your-moon-server .
```

2. [Optional] then, [setup redis server](../redis/README.md)

> Note that, this step is `Optional` because you can configure `jobtable.type` to `native`, its easier for developing only the backend

> Note that, if both server and redis server is running inside docker containers, you need to [configure docker network](../DockerNetwork.md). Otherwise they cannot find each other.

3. next, run docker container with following command

```sh
docker run -it --rm --name your-moon-server -p 3001:3001 -v "$(pwd)/config:/src/config" -v "$(pwd)/uploadedImages:/src/uploadedImages" your-moon-server
```

### Deploy manually

1. install all dependencies

```sh
npm install
```

2. [Optional] [install Redis](https://redis.io/docs/install/install-redis/) for the backend. If you don't want to install Redis, you can set `jobtable.type` to `native`.

3. run the server with

```sh
node index.js
```

4. you can also deploy the server for development

```sh
npm run devStart
```

* **Note that you can tell the server to switch configuration file by setting environment variable**
  * Server will use `dev.config.json` if environment variable `NODE_ENV != "production"`
  * Server will use `production.config.json` if environment variable `NODE_ENV == "production"`

## Running Backend

Backend is running on [http://localhost:3001](http://localhost:3001) by default

All endpoints in backend are start with `/api/`


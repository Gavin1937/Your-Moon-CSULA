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
    "aes_key": "Base64_aes_key_256_bits_for_email_encryption",
    "jwt_secret": "Base64_jwt_secret_with_HS256_algorithm_512_bits",
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
    }
}
```

* Note that both `aes_key` and `jwt_secret` are saved as base64 encoded strings. To create them, you can run following python script in any python 3.x environment. (I suggest [this website](https://www.programiz.com/python-programming/online-compiler/) for anyone don't want to install python)

```py
from random import randbytes
from base64 import b64encode
print(b64encode(randbytes(int(int(input('How many bits: '))/8))).decode('utf-8'))
```

1. you can use `.template` files under `src/server/config/` as your starting point


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


# Your-Moon Frontend client

## Configure

1. in folder `src/client/config`, create a new file called `config.json`
2. add following configuration in it

```jsonc
{
    "backend_url": "http://localhost:3001" // full url to backend server, without trailing "/"
}
```

3. you can use `src/client/config/config.json.template` as your starting point


## Deploy

### Deploy with Docker (Recommended)

Assuming you are in folder `src/client`

run following command to deploy with docker

1. build the docker image

```sh
docker build -t your-moon-client --build-arg="BACKEND_URL=http://localhost:3001" .
```

2. **Note that you MUST supply parameter `--build-arg` so docker can build the application into distributable package with correct backend url**
   * **Replace the value of `BACKEND_URL` with the url of your backend**

3. then, run docker container with following command

```sh
docker run -it --rm --name your-moon-client -p 5173:5173 your-moon-client
```

### Deploy manually

1. install all dependencies

```sh
npm install
```

2. build the frontend app

```sh
npm run build
```

3. install `serve` to serve the app

```sh
npm install serve
```

4. serve the app

```sh
serve -l tcp://127.0.0.1:5173 dist
```

5. you can also deploy client for development

```sh
npm run dev
```

## Running Frontend

Frontend is running on [http://localhost:5173](http://localhost:5173) by default

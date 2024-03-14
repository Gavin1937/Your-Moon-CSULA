# Your-Moon Frontend client

## Configure

1. in folder `src/client/config`, create a new file called `config.json`
2. add following configuration in it

```jsonc
{
    "backend_url": "http://localhost:3001", // full url to backend server, without trailing "/"
    "contact_email": "your@email.com" // an email for contact page
}
```

3. you can use `src/client/config/config.json.template` as your starting point


## Deploy

### Deploy with Docker (Recommended)

Assuming you are in folder `src/client`

run following command to deploy with docker

1. build the docker image

```sh
docker build -t your-moon-client --build-arg="BACKEND_URL=http://localhost:3001" --build-arg="CONTACT_EMAIL=your@email.com" .
```

2. **Note that you MUST supply parameter `--build-arg` so docker can build the application into distributable package with correct backend url**
   * **Replace the value of `BACKEND_URL` with the url of your backend**
   * **Replace the value of `CONTACT_EMAIL` with your contact email**

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

> Note: deploying the frontend with `serve` would likely cause routing issue. (e.g. refreshing `/upload` path will return a 404)
> 
> you need to route paths who do not associate with any file to index.html, for example, `/upload` should be route to index.html
>
> References:
> 
> [https://stackoverflow.com/a/66514889](https://stackoverflow.com/a/66514889)
> 
> [https://router.vuejs.org/guide/essentials/history-mode.html#HTML5-Mode](https://router.vuejs.org/guide/essentials/history-mode.html#HTML5-Mode)
> 
> [https://router.vuejs.org/guide/essentials/history-mode.html#nginx](https://router.vuejs.org/guide/essentials/history-mode.html#nginx)
>
> It is easier to do that with a proper web server, you can use the [nginx.conf](./nginx.conf) file under `client` directory serving with nginx. [Please refer to vue.js documentation for more detail](https://router.vuejs.org/guide/essentials/history-mode.html#Example-Server-Configurations)

5. you can also deploy client for development

```sh
npm run dev
```

## Running Frontend

Frontend is running on [http://localhost:5173](http://localhost:5173) by default

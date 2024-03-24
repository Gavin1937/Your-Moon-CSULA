
# Redis Server

In order to setup a Redis server for the backend, there are 3 methods:

1. If you don't need to setup an user for Redis server, your can simply run command:

```sh
docker run -d --name your-moon-redis -p 6379:6379 redis
```

2. As an alternative to method #1, you can use the `Dockerfile` in current directory

* Build the redis image with:

```sh
docker build -t your-moon-redis -f Dockerfile .
```

* Run docker container with:

```sh
docker run -d --name your-moon-redis -p 6379:6379 your-moon-redis
```

1. To setup a Redis server with username and password protection, you can pass a build argument to `Dockerfile` file:

* Create a `redis.conf` file from [redis.conf.template](./redis.conf.template) in current directory. This file will tell Redis server of your user information. There are two lines in the file:
  * The first line: `user default off` will turn off default user in Redis
  * The second line: `user username on >password ~* &* +@all` will set an user with username: `username` and password: `password` with all the privileges. You can replace `username` and `password` by your wish.

* Build the redis image with:

```sh
docker build -t your-moon-redis -f Dockerfile --build-arg="REDIS_CONFIG=/path/to/optional/redis.conf" .
```

> Note that, you need to supply build argument `REDIS_CONFIG` specifying the path to redis.conf file. Relative path is ok, but absolute path would be better.

* Run docker container with:

```sh
docker run -d --name your-moon-redis -p 6379:6379 your-moon-redis
```

> Note that, we expose port `6379` here for ease of development. In production, you shouldn't expose redis port and should configure [docker network](../DockerNetwork.md), let docker to handle networking between containers. So you can set backend's jobtable host as `your-moon-redis` and it can find redis inside docker network.

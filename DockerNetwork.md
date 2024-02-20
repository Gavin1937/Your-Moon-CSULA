
# About Docker Network

Docker network allows different Docker containers to connect to each other, and Docker engine will handle the DNS stuff for you.

* To create a Docker network, use this command:

```sh
docker network create my-network
```

* Usually, when you launch containers via docker-compose, it will automatically create a network for you. To list all existing Docker networks, use this command:

```sh
docker network list
```

* To see which containers are inside a docker network, use following command:

```sh
docker network inspect my-network --format "{{json .Containers}}"
```

It will return a json like following:

```jsonc
{
    "41f6a5810712331d8329d3d4ae9b60e744085ad732defbca9f647d563a9b016f": {
        "Name": "test", // this is container name
        "EndpointID": "7d2a48fc751b6e9c11fe23e7881765915821b77b9fcace32d28e8a54f279004b",
        "MacAddress": "02:42:ac:13:00:02",
        "IPv4Address": "172.19.0.2/16",
        "IPv6Address": ""
    }
}
```

* To see which docker network does a running container lives in, use following command:

```sh
docker container inspect test --format "{{json .NetworkSettings.Networks}}"
```

It will return a json like following:

```jsonc
{
    "my-net": { // this is network name
        "IPAMConfig": null,
        "Links": null,
        "Aliases": [
            "41f6a5810712"
        ],
        "NetworkID": "bb811a4cf619f5cd0cda296932b995eb588dd362cea581d91c806c2ec27c3fbd",
        "EndpointID": "7d2a48fc751b6e9c11fe23e7881765915821b77b9fcace32d28e8a54f279004b",
        "Gateway": "172.19.0.1",
        "IPAddress": "172.19.0.2",
        "IPPrefixLen": 16,
        "IPv6Gateway": "",
        "GlobalIPv6Address": "",
        "GlobalIPv6PrefixLen": 0,
        "MacAddress": "02:42:ac:13:00:02",
        "DriverOpts": null
    }
}
```

* To connect a container to an existing docker network before it runs, you can add `--network` flag to `docker run`:

```sh
docker run --network my-network my-image
```

* To connect a running container to an existing docker network, you can use following command:

```sh
docker network connect my-network my-container
```

* To remove a docker network, use following command:

```sh
docker network rm my-network
```

* When referencing another container inside a container, you can use its name as host, Docker engine will handle the DNS for you:
  * If your server is running in a container named `your-moon-server`, and your db is running in a container named `your-moon-db`. 
  * Then, server container can find db container in host `your-moon-db`


## Learn more:

* [Docker doc on Container networking](https://docs.docker.com/engine/reference/run/#container-networking)
* [Docker doc on Networking overview](https://docs.docker.com/network/)

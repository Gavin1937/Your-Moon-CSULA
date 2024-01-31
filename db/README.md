
# DATABASE

In order for the Server/backend to function correctly, you need to setup a MySQL Database. This document only covers MySQL Server setup, you should refer to [server setup documentation](../server/README.md#configure) for configuring your backend with the database.

## Setup with Docker (Recommended)

Assuming you are in `db/` directory

Run following command to build database docker image
* **Note: you MUST supply --build-arg so docker can setup the root password of database**
* **You should replace the password with something more secure**

```sh
docker build -t yourmoon-db . --build-arg="ROOT_PASSWORD=root"
```

Now, you can launch the database with following command

```sh
docker run -d --rm --name yourmoon-db -p 3306:3306 yourmoon-db
```

## Other Setup methods

First, you need to install MySQL Server on your machine

* Windows
  * [article](https://www.dataquest.io/blog/install-mysql-windows/)
  * [video](https://www.youtube.com/watch?v=2om3byn2lxs)
* MacOS
  * [article](https://dev.mysql.com/doc/refman/8.0/en/macos-installation.html)
  * [video](https://www.youtube.com/watch?v=2cvH0HRjZF8)
* Ubuntu/Debian Linux
  * [article](https://www.digitalocean.com/community/tutorials/how-to-install-mysql-on-ubuntu-22-04)
  * [video](https://www.youtube.com/watch?v=zRfI79BHf3k)
* Setup using XAMPP, a popular PHP development environment that will also setup MySQL Server for you
  * Available on Windows, MacOS, and Linux
  * [download](https://www.apachefriends.org/download.html)
  * [video](https://www.youtube.com/watch?v=pVVACLH0la0&ab_channel=TroubleChute)

After you install MySQL Server on your machine, you should have a root account at this point.

Now, you can connect to your database via a MySQL Client like
* [MySQL Workbench](https://www.mysql.com/products/workbench/)
* [MySQL Shell](https://dev.mysql.com/doc/mysql-shell/8.0/en/)
  * You might have this software while installing MySQL Server
* Or other MySQL Client

Then, you need to initialize database and tables, just copy the content of [Your Moon Database.sql](./Your%20Moon%20Database.sql) and paste in your MySQL Client

This sql file will create a database `YourMoonDB` with all the tables we need.

## Connect to Database

If you are using a MySQL Client or running the backend on your host machine (with `npm run devStart`), you can simply connect to `localhost:3306`.

If you are running both of backend and db inside docker containers, you need to setup the docker networking so containers can find each other.

1. launch the backend with docker
2. use following command to find out which docker network is your backend container in

```sh
docker container inspect your-moon-server
```

* you need to look for `NetworkSettings -> Networks`
* you will get a json like this

```jsonc
// ...
"Networks": {
    "server_default": { // this is the network name, "server_default"
        "IPAMConfig": null,
        "Links": null,
        "Aliases": [
            "your-moon-server",
            "your-moon-server",
            "a3f1bbd56b43"
        ],
        "NetworkID": "a3b64a6d8bb0426f369684f4a9cbeac68818a0a52c1421a67792220e6609b201",
        "EndpointID": "750bdf5f1c5a4aee08b7029c320b29867225da80df189083e8cf071320305088",
        "Gateway": "172.18.0.1",
        "IPAddress": "172.18.0.3",
        "IPPrefixLen": 16,
        "IPv6Gateway": "",
        "GlobalIPv6Address": "",
        "GlobalIPv6PrefixLen": 0,
        "MacAddress": "02:42:ac:12:00:03",
        "DriverOpts": null
    }
}
// ...
```

3. if you found your backend container's network name, you can then launch db container and connect it to the same network

```sh
docker network connect "your docker network name" yourmoon-db
```

4. if you cannot find your backend container's network name, you can create a new docker network for it and connect your db to it

```sh
docker network create your-moon-backend-network
docker network connect your-moon-backend-network yourmoon-db
docker network connect your-moon-backend-network your-moon-server
```

1. now, you should be able to see both db and backend containers present in the output of following command

```sh
docker network inspect "your docker network name"
```

6. Once your backend and db container are in the same network, you can use their name as host name, docker will do the DNS for us automatically. In the backend config, you can set:

```jsonc
// ...
"db": {
    "host": "yourmoon-db",
    "port": 3306,
    "user": "root",
    "password": "root",
    "database": "YourMoonDB"
}
// ...
```

## After Database Setup

At this point, you already can use the database with the root account. However, it is a bad idea to deploy your app using database root account. So we recommend you to setup an user account for this application.

Go to file [Init User.sql](./Init%20User.sql). This file contains all the commands you need for creating an user called `yourmoonapp` who only have the necessary privileges for this app.

You need to modify the password by changing this line:

```sql
CREATE USER 'yourmoonapp'@'%' IDENTIFIED BY 'password';
```

Just replace `password` with something more secure.

Then, you can copy the modified command to your MySQL Client and execute them with root account.

**Optional Step**

* you can ask MySQL Server to only allow this user connecting from specific IP by:
  * replace all the character `%` in the file with your desire IP
* This step will add an extra layer of protection to your database. You can only allow the connection coming from specific remote server

## What's Next

Refer to [server setup documentation](../server/README.md#configure) for configuring your backend with the database.

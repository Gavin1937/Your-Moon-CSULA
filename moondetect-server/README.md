# Moon Detection Backend Server

## Run & Deploy

### Run with Docker (production ready)

1. build the image with command:

```sh
docker build -t moondetect-server .
```

2. run docker container with

```sh
docker run -d --rm -p 3002:3002 \
    -v "/path/to/image/dir:/app/data" \
    --name test-server test-server
```

* Note that, you MUST mount `/path/to/image/dir` to docker container in order for the moondetect-server to work.
* `/path/to/image/dir` is the absolute path to user uploaded image


### Run with Conda (development only)

1. setup conda environment

```sh
conda env create -f environment.yml && \
conda init bash && \
conda activate MoonDetect
```

2. run the server with

```sh
conda run -n MoonDetect python moondetect_server.py "/path/to/image/dir"
```

* Note that, you MUST supply parameter `/path/to/image/dir` to the server in order for it to work.
* `/path/to/image/dir` is the absolute path to user uploaded image


### Run with Python Virtual Environment (development only)

* If you don't want to use virtual environment, you need to install all the dependencies in your host machine. Just start from step #3

1. setup virtual environment

```sh
python -m venv .venv
```

2. [activate virtual environment](https://docs.python.org/3/tutorial/venv.html#creating-virtual-environments)

3. install dependencies

```sh
pip install -r requirements.txt
```

4. run the server with

```sh
python moondetect_server.py "/path/to/image/dir"
```

* Note that, you MUST supply parameter `/path/to/image/dir` to the server in order for it to work.
* `/path/to/image/dir` is the absolute path to user uploaded image


## API

There is only one api in this backend.

### **GET `/detectMoon`**

Find Moon from filename

#### Param:
  * filename [url query]
      * string filename to search in DATA_PATH
      * DATA_PATH is the path to user uploaded images
  * type     [url query]
      * OPTIONAL, string, type of return.
      * Can be one of following: `circle`, `square`, `rectangle`
      * Default: `circle`

#### Return:

* json return:
  * the key `payload` will contain different value base on different `type` parameter

```jsonc
{
    "ok": // bool,
    "payload": // { ... },
    "status": // int
}
```

* when mode == `circle`

```jsonc
{
    "payload": {
        "type": "circle",
        "x": // int,
        "y": // int,
        "radius": // int
    }
}
```

* when mode == `square`

```jsonc
{
    "payload": {
        "type": "square",
        "x": // int,
        "y": // int,
        "width": // int
    }
}
```

* when mode == `rectangle`

```jsonc
{
    "payload": {
        "type": "rectangle",
        "x1": // int,
        "y1": // int,
        "x2": // int,
        "y2": // int
    }
}
```

* when failed

```jsonc
{
    "ok": false,
    "status": 400,
    "error": "Error Message"
}
```

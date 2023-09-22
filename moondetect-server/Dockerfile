FROM ubuntu:20.04

# setup enviroments
ENV DEBIAN_FRONTEND=noninteractive TZ=America/Los_Angeles
RUN apt update -y && \
    apt install -y tzdata python3 python3-pip python3-opencv

# setup working dir & copy source code
WORKDIR /app
COPY . .

# install rest of dependencies & run the app
RUN pip3 install --upgrade -r requirements.txt && pip3 install --upgrade gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:3002", "wsgi:create_app(DATA_PATH='/app/data')"]

FROM mysql:latest

ARG ROOT_PASSWORD
# Check for mandatory build arguments
RUN \
    : "${ROOT_PASSWORD:?Build argument needs to be set and non-empty.}"

ENV MYSQL_ROOT_PASSWORD=${ROOT_PASSWORD} \
    MYSQL_DATABASE=YourMoonDB

ARG source="Your Moon Database.sql"
ADD ${source} /docker-entrypoint-initdb.d

EXPOSE 3306
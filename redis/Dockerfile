FROM redis

ARG REDIS_CONFIG=./redis.conf.defaultuser

COPY ${REDIS_CONFIG} /app/redis.conf

EXPOSE 6379

CMD ["redis-server", "/app/redis.conf"]

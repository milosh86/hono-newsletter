#!/usr/bin/env bash
set -x
set -eo pipefail

# check if script dependencies are installed before running the script
# required deps: docker, psql, sqlx-cli
if ! [ -x "$(command -v docker)" ];
  then echo >&2 "Error: docker is not installed."
  exit 1
fi

if ! [ -x "$(command -v psql)" ];
  then echo >&2 "Error: psql is not installed."
  exit 1
fi

if ! [ -x "$(command -v npm)" ]; then
  echo >&2 "Error: npm is not installed."
  exit 1
fi

# Check if a custom parameter has been set, otherwise use default values
DB_PORT="${DB_PORT:=5432}"
SUPERUSER="${SUPERUSER:=postgres}"
SUPERUSER_PWD="${SUPERUSER_PWD:=password}"
APP_USER="${APP_USER:=app}"
APP_USER_PWD="${APP_USER_PWD:=secret}"
APP_DB_NAME="${APP_DB_NAME:=hono_newsletter}"

# Allow to skip Docker if a dockerized Postgres database is already running
if [[ -z "${SKIP_DOCKER}" ]]
then
    # if a postgres container is running, print instructions to kill it and exit
    RUNNING_POSTGRES_CONTAINER=$(docker ps --filter 'name=postgres' --format '{{.ID}}')
    if [[ -n $RUNNING_POSTGRES_CONTAINER ]]; then
      echo >&2 "there is a postgres container already running, kill it with"
      echo >&2 "    docker kill ${RUNNING_POSTGRES_CONTAINER}"
      exit 1
    fi
    CONTAINER_NAME="postgres"
  # Launch postgres using Docker
  docker run \
    --env POSTGRES_USER=${SUPERUSER} \
    --env POSTGRES_PASSWORD=${SUPERUSER_PWD} \
    --health-cmd="pg_isready -U ${SUPERUSER} || exit 1" \
    --health-interval=1s \
    --health-timeout=5s \
    --health-retries=5 \
    --publish "${DB_PORT}":5432 \
    --detach \
    --name "${CONTAINER_NAME}" \
    postgres -N 1000
    # ^ Increased maximum number of connections for testing purposes

  until [ \
    "$(docker inspect -f "{{.State.Health.Status}}" ${CONTAINER_NAME})" == \
    "healthy" \
  ]; do
    >&2 echo "Postgres is still unavailable - sleeping"
    sleep 1
  done

  # Superuser has too many privileges, create the application user instead
  CREATE_QUERY="CREATE USER ${APP_USER} WITH PASSWORD '${APP_USER_PWD}';"
  docker exec -it "${CONTAINER_NAME}" psql -U "${SUPERUSER}" -c "${CREATE_QUERY}"

  # Grant create db privileges to the app user
  GRANT_QUERY="ALTER USER ${APP_USER} CREATEDB;"
  docker exec -it "${CONTAINER_NAME}" psql -U "${SUPERUSER}" -c "${GRANT_QUERY}"
fi

>&2 echo "Postgres is up and running on port ${DB_PORT} - running migrations now!"


# Set up database URL for Drizzle
DATABASE_URL=postgres://${APP_USER}:${APP_USER_PWD}@localhost:${DB_PORT}/${APP_DB_NAME}
export DATABASE_URL

# Create database if it doesn't exist
PGPASSWORD="${APP_USER_PWD}" psql -h "localhost" -U "${APP_USER}" -p "${DB_PORT}" -d "postgres" -c "CREATE DATABASE ${APP_DB_NAME}" || true

# Run Drizzle migrations
echo "Running Drizzle migrations..."
npx drizzle-kit generate
npx drizzle-kit migrate

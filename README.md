# Beth

## How to Build and Run

### With Docker

There's a `docker-compose.yml` in the root folder that includes backend, frontend, migrations, Redis, pgadmin 4, and a PostgreSQL database.

To build, ensure that the environment files are in the `env` folder. Set up the environment variables and execute the following:

```bash
docker compose up
```

You're good to go!

### Without Docker

Setup environment variables in the `env` directory. Ensure your database server and Redis server (if applicable) are accessible. Then run the following commands:

```bash
yarn install
yarn frontend:build
NEXT_PORT=3001 yarn root:start
```

You're good to go!

## How to Configure

To configure, use `.env` files or pass variables to your environment.

**NOTE: Some `package.json` commands require environment variables set.**

- `.backend.env` - Copy the `env/examples/.backend.env` file to the `env` directory
  - `APP_PORT` - The port on which the Express.JS server will be started
  - `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are settings for PostgreSQL
  - `REDIS_REQUIRED`, `REDIS_URL` - Use Redis? The application will fail if it cannot connect to the Redis server
  - `ACCESS_CONTROL_ALLOW_ORIGIN_HEADER` - [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
  - `JWT_TOKEN_SECRET` - Secret key for signing JWT tokens
  - `LOG_LEVEL` - Log level
  - `TEST_LOG_LEVEL` - Log level for testing
  - `USER_EX`, `USER_PERMISSIONS_EX`, `POST_EX`, `POST_REPLIES_EX`, `HOT_TAGS_EX`, and `VOTE_EX` - Cache expiration time for different records. Time is given in seconds
  - `NODE_ENV`
- `.frontend.env` - Copy the `env/examples/.frontend.env` file to the `env` directory
  - `SERVER_URL` - URL of the backend server, **NOTE: This variable cannot be changed after the frontend has been built. This is because any calls to process.env will simply be replaced with values from the environment. [dotenv-webpack](https://www.npmjs.com/package/dotenv-webpack#:~:text=As%20such%2C%20it%20does%20a%20text%20replace%20in%20the%20resulting%20bundle%20for%20any%20instances%20of%20process.env.)**
  - `NEXT_PORT` - The port on which the Next.JS server will be started
  - `CYPRESS_URL` - URL for Cypress to test
  - `NODE_ENV`

## `package.json` Commands

- **Backend**
  - `backend:start` - Starts the backend server
  - `backend:dev` - Starts the backend server with nodemon
  - `backend:migrate` - Runs Knex migrations
  - `backend:seed` - Seeds the database
  - `backend:test` - Runs Jest tests and fails if code coverage is below global thresholds
  - `backend:lint` - Runs ESLint against backend code

- **Frontend**
  - `frontend:test` - Runs Cypress tests against frontend code
    - `frontend:test:open` - Opens Cypress
    - `frontend:test:report` - Reports code coverage and fails if code coverage is below global thresholds
    - `frontend:test:full` - Starts backend and frontend servers and then runs Cypress tests against frontend code. **NOTE: Requires `APP_PORT` and `NEXT_PORT` environment variables to be set**
  - `frontend:dev` - Starts the Next dev server. **NOTE: Requires `NEXT_PORT` environment variable to be set**
  - `frontend:start` - Starts the Next production server. **NOTE: Requires `NEXT_PORT` environment variable to be set**
  - `frontend:build` - Generates an optimized version of the frontend application for production
  - `frontend:lint` - Runs ESLint against frontend code

- **Root**
  - `root:lint` - Runs ESLint against backend and frontend code
  - `root:dev` - Starts backend and frontend dev servers
  - `root:start` - Starts backend and frontend production servers

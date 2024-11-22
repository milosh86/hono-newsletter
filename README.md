# Hono Newsletter

Demo project implementing a newsletter subscriptions using Hono and TypeScript,
deployed on Cloudflare Workers.

Originally, demo project is based on "Zero To Production In Rust" book from Luca
Palmieri. I'm trying to get through the same steps using TypeScript and Hono.

## Tools
- TypeScript as a main language
- Hono framework set up with Wrangler as a Cloudflare Workers CLI
- Biomejs for linting and formatting (alternative to ESLint and Prettier)
- Vitest for testing

## How to run
```
npm install
npm run dev
```

```
npm run deploy
```

## Linting and formating

To lint and apply safe fixes, run:
```
npm run lint
```

To check both linting and formatting, run:
```
npm run check
```
This command will just check for compliance with the rules, without applying 
any changes, which is useful for CI/CD pipelines.

Set up your IDE to use Biomejs for linting and formatting, to 
streamline the process during development.

## Testing
Vitest is used for testing. To run tests, use:
```
npm run test
```

There are 2 types of tests:
- Unit tests (inside /src folder): testing individual functionality without external dependencies
- Integration tests (in /test folder) - testing the whole system with external dependencies and mocks where needed

For some unit tests, property-based testing is exercised with the `fast-check` and `faker-js` libraries.

## Security audit

To check for vulnerabilities in the dependencies, run:
```
npm audit
```

## Database
### DB local setup

To set up the database in local, run:
```
./scripts/init_db.sh
```

It will:
- run a new local instance of the Postgres database in the Docker
- create a new application user with enough permissions to create a new database
- create a new database for the application (APP_DB_NAME)
- run the migrations, with drizzle-kit, to set up the database schema

If you want to skip spinning up the new Postgres container, you can run the script 
with the SKIP_DOCKER=true env variable. It will then use the existing Postgres
instance and do other steps as usual.


### DB migrations and schema evolution
We use `drizzle-kit` to manage database migrations. To create a new migration:

- make sure `.env` file is set up with the correct database connection string, there is the `.env.example` file to use as a template
- update the `src/db/schema.ts` file as needed
- run `npx drizzle-kit generate --name=<migration_name>` to generate a new migration
- run `npx drizzle-kit migrate` to apply the migration

```
npm run db:new-migration
```

### Migrations in production
- Make sure that DB backups are in place and that migrations are tested
- Run the migration with:
  ```sh
  DATABASE_URL=<prod_db_url> npx drizzle-kit migrate
  ```

## Environment variables

To run the application, you need to set up the following environment variables:
- `DATABASE_URL`: (SECRET) connection string to the Postgres database
- `EMAIL_BASE_URL`: base URL for the email service
- `EMAIL_SENDER`: email address of the sender
- `EMAIL_API_KEY`: (SECRET) API key for the email service. Set up as a secret in Cloudflare. See [Mailjet docs](https://dev.mailjet.com/email/guides/send-api-v31)
- `EMAIL_API_SECRET`: (SECRET) API secret for the email service. Set up as a secret in Cloudflare. See [Mailjet docs](https://dev.mailjet.com/email/guides/send-api-v31)

### How to properly set up environment variables

- Env variables (non-secret) used in production, set in `wrangler.toml` file
- Secrets used in production, set either in Cloudflare Workers dashboard or by using wrangler CLI
- For local development, use the `.dev.vars` file. 
  - It overrides the environment variables set in the `wrangler.toml` file
  - Dev secret variables should be set up in the `.dev.vars` file too
  - It is git-ignored and should not be committed to the repository.
  - Use the `.dev.vars.example` file as a template
- The `.env` file is used only for database migrations by drizzle-kit and requires only the DATABASE_URL variable
  - It is git-ignored and should not be committed to the repository.
  - Use the `.env.example` file as a template

For more information check https://developers.cloudflare.com/workers/configuration/environment-variables/

## Getting started with development

1. Clone the repository
2. Install dependencies with `npm install`
3. Init `.env` file
4. Init `.dev.vars` file
5. Run the database setup script with `./scripts/init_db.sh`
6. Run the application with `npm run dev`

## Deployment

To deploy the application, you need to set up the Cloudflare account and an 
instance of the Postgres database deployed. You can use the free tier for both 
services.

1. Run `npm run deploy` to deploy the application to the Cloudflare Workers
2. Run the database migrations in the production environment
3. Set up the environment variables and secrets in the Cloudflare Workers dashboard

### Gradual updates

To gradually deploy new versions, you can route only a part of the traffic to the 
new version of the application during the transition period! 

See the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/) for more information.

- Create new version of the worker
  - `npx wrangler versions upload`
  - Don't forget to set new env variables and secrets if needed
- Create a new deployment that splits traffic between two versions of the Worker
  - `npx wrangler versions deploy`
- Monitor the new version and gradually increase the traffic to it

## External services
- Postgres database
- Email service
  - https://app.mailjet.com/

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
any changes. Setup your IDE to use Biomejs for linting and formatting, to 
streamline the process during development.


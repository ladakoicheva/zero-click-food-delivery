# Spoon — food delivery demo

Describe what you’re craving, choose a dish, enter a delivery address, and receive a demo tracking number.

## Run locally

In the first terminal, from `server`:

```sh
npm install
npm run dev
```

In a second terminal, from `client`:

```sh
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`). Vite proxies `/api` requests to the Express server at `http://localhost:3000`.

## Demo behavior

- Dish suggestions use a local menu and keyword matching. Popular dishes are shown when there’s no exact match.
- Orders are stored in server memory and disappear when the server restarts.
- Payment methods are for demonstration only. Card details are never requested and no money is charged.
- Tracking numbers and courier status updates are simulated; this is not a real delivery service.
- Menu prices are displayed in US dollars.

## Checks

```sh
# client
npm run build
npm run lint

# server
npm test
```

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
If the backend runs on a different port, start Vite with `API_PROXY_TARGET=http://127.0.0.1:3001 npm run dev`.

## Sign in

Firebase Authentication sends an email sign-in link; an enrolled Google Authenticator supplies the second factor. A new user must verify their email, scan the displayed QR code (or enter its key), then enter the current code. On later sign-ins, open a fresh email link and enter an Authenticator code. When the email link is opened on another device, enter the same email address there. Firebase stores the account and enrolled factor; the browser SDK stores its session.

1. Create a Firebase project and register a web app. Copy its web configuration to the ignored `client/.env` using `client/.env.example`. The web API key identifies the project and is not a service-account secret; never put service-account keys in the frontend.
2. In Firebase Authentication, enable **Email/Password** and **Email link (passwordless sign-in)**. Add the frontend domain under Authentication → Settings → Authorized domains. New projects do not authorize `localhost` automatically.
3. Upgrade Firebase Authentication to **Identity Platform** and enable TOTP MFA in project configuration. Follow Google's [TOTP setup guide](https://firebase.google.com/docs/auth/web/totp-mfa); upgrading can have billing implications. Use HTTPS for deployed sites.
4. Restart Vite after setting the variables. Open the configured frontend origin and request a link. Firebase must be reachable and its email sending quotas apply.

This is a demo identity UI, not authorization for the ordering API: existing orders are not associated with users, and the backend does not verify Firebase tokens. Firebase creates a signed-in session after the first email link, before TOTP enrollment; the UI requires setup, but this is not server-side MFA enforcement. Do not treat demo endpoints as protected. No account-recovery flow is implemented; losing the Authenticator factor may prevent sign-in.

## Nearby restaurants

The map asks the browser for the user's location and sends its coordinates to Google Maps in an iframe search for restaurants. Geolocation requires permission and HTTPS or localhost; the reported accuracy is an estimate. This uses no Google Places API key or backend restaurant search.

Google controls the map search results and iframe availability. The iframe does not expose restaurant coordinates to the app, so there is no graph search or guarantee that the closest restaurant is selected. The map does not establish Glovo participation, menu contents, or delivery availability. The existing menu and checkout remain a separate demo.

## Demo behavior

- Dish searches accept terms in a limited food dictionary (English, Ukrainian and Russian). Unrecognized queries return no match. The existing restaurant search can still generate demo dishes for recognized requests.
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

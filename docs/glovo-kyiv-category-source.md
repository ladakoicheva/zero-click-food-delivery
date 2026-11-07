# Glovo Kyiv food category source

## Status

This document records the Kyiv equivalent of the supplied Glovo page. It is **not an API specification**: the page and its response do not reveal a documented menu API endpoint or response schema.

## Source page

Glovo lists Kyiv as two separate areas:

- Right bank: `https://glovoapp.com/uk/ua/kyiv-right-bank/categories/yizha_1`
- Left bank: `https://glovoapp.com/uk/ua/kyiv-left-bank`

The original Odesa URL includes these repeated `type` query parameters:

| Parameter | Value | Interpreted category |
|---|---|---|
| `type` | `mizhnarodna_34694` | International |
| `type` | `amerikanska_34835` | American |
| `type` | `aziatska_34834` | Asian |
| `type` | `shaurma_35119` | Shawarma |
| `type` | `pitsa_34701` | Pizza |
| `type` | `gril_34811` | Grill |

These are page filters, not verified API parameters. The right-bank food page exposes links for these same six filters.

## Observed behavior

The right-bank food page displays restaurant links, and individual restaurant pages display menu items. The site asks for a delivery address to check nearby options; seeing an item on a page does not verify its availability for a particular address. Inspection with API Anything identified the server-rendered HTML page, not a documented menu API or pagination contract.

Glovo's [Ukrainian terms, section 13](https://docs.glovoapp.com/uk/ua/terms/) reserve rights to its content and prohibit copying, reuse and republication for public or commercial purposes without express written permission. The user stated that permission exists; its scope has not been independently reviewed.

On the inspected right-bank page with the six original filters, Glovo reported 230 results while the initial page contained 50 restaurant cards. Scrolling to the bottom without a delivery address did not load more cards. Selecting a location opens an address-confirmation flow; pagination and availability after that flow remain unverified. How to retrieve the remaining restaurants programmatically has not been established.

The site's client code includes a `POST` read for category pagination, with an offset, limit, filters, and previously seen store IDs. Its response and behavior have not been verified. This is an undocumented internal interface, not a supported API contract.

## API discovery requirements

Do not treat the page URL as a menu API or invent an endpoint/schema from its category IDs. To produce an API specification, first verify an authorized source that documents or exposes the actual read interface and its response contract. In particular, the following remain unknown:

- menu/list endpoint and required location or address input;
- restaurant and item response fields;
- availability semantics and refresh guarantees;
- pagination or continuation-token behavior;
- authentication, usage limits, and terms for automated access.

Until those details are verified, this page is only a source reference and cannot support reliable menu synchronization or infinite scrolling by itself.

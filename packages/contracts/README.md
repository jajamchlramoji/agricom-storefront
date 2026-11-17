# API contracts

Frontend apps communicate with the backend through HTTP contracts, not by importing backend storage code. Keep request and response shapes documented here. Generate shared TypeScript types from an OpenAPI document once the API stabilizes; do not share database models across services.

## Current local routes

- `POST /api/auth/login` — issue a local demo session for a seeded account
- `GET /api/auth/me` — read the current demo session
- `POST /api/auth/logout` — end the current demo session
- `GET|PUT /api/auth/admin/permissions` — owner-managed local role permissions
- `GET /api/catalog/products` — published storefront products
- `GET /api/catalog/admin/products` — all products for the local admin preview
- `POST /api/catalog/admin/products` — create a draft
- `PATCH /api/catalog/admin/products/:id` — update or publish a draft. Only the fields in `backend/services/catalog/validate.mjs` can be set; anything else (for example `id`, `rating`, `reviews`) returns 400. Status changes are appended to `product.history`
- `POST /api/orders` — validate and save an order request. Quantities must be whole numbers; repeated lines for one product are added together, up to 99 per product and 50 products per order. Request bodies over 1 MB return 413
- `GET /api/admin/orders` — list local demo orders. Each order includes `history` (`{ at, from, to, by }` per status change) and `nextStatuses` (the statuses it may move to)
- `PATCH /api/admin/orders/:id/status` — update order status. Returns 409 if the move is not allowed by `backend/services/orders/status.mjs`
- `PATCH /api/admin/orders/batch` — apply a status to selected requests. Each order is checked separately; returns `{ updated, skipped: [{ id, reason }], orders }`
- `GET /api/orders/mine` — current customer’s order requests
- `GET /api/fulfillment/sources` — available fulfilment sources
- `GET|PUT /api/fulfillment/admin/orders/:id` — read or set local demo fulfilment details

All admin routes are deliberately available only through local loopback services in this prototype. They use the local demo sign-in and role checks, not production authentication.

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
- `PATCH /api/catalog/admin/products/:id` — update or publish a draft
- `POST /api/orders` — validate and save an order request
- `GET /api/admin/orders` — list local demo orders
- `PATCH /api/admin/orders/:id/status` — update order status
- `PATCH /api/admin/orders/batch` — apply a status to selected requests
- `GET /api/orders/mine` — current customer’s order requests
- `GET /api/fulfillment/sources` — available fulfilment sources
- `GET|PUT /api/fulfillment/admin/orders/:id` — read or set local demo fulfilment details

All admin routes are deliberately available only through local loopback services in this prototype. They have no production authentication yet.

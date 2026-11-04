# AgriCom

AgriCom is a mobile-first storefront prototype for Indian farmers. This branch separates the customer storefront, the local admin preview, and backend services so the parts can be developed and deployed independently.

## Run the local test setup

Requirements: Node.js 20 or newer and npm.

1. Open a terminal in this project folder.
2. Install the existing project dependencies:

   ```sh
   npm install
   ```

3. Start the frontends and backend services:

   ```sh
   npm run dev
   ```

4. Open these local addresses:

   - Storefront: <http://127.0.0.1:5173>
   - Admin preview: <http://127.0.0.1:5174>
   - API health: <http://127.0.0.1:4000/api/health>

### Local demo sign-in accounts

| Role | Email | Password |
|---|---|---|
| Owner / admin | `admin@agricom.local` | `AgriComAdmin2026!` |
| Operations | `ops@agricom.local` | `AgriComOps2026!` |
| Catalog manager | `catalog@agricom.local` | `AgriComCatalog2026!` |
| Customer / farmer | `farmer@agricom.local` | `AgriComFarmer2026!` |

These are **demo-only credentials**. The Auth service hashes passwords in memory and keeps sign-in sessions in memory, so restarting the backend resets sessions. It does not yet have production account storage, password reset, or MFA. Do not reuse these passwords or expose the admin page publicly.

Press `Ctrl+C` in the terminal to stop the local processes. You can also start pieces separately with `npm run dev:storefront`, `npm run dev:admin`, and `npm run dev:backend`.

## Local test behavior and limits

- The API services bind to `127.0.0.1`, so they are intended for this computer only.
- The local admin preview has demo sign-in and role checks, but no production-grade account security. Use dummy data only; do not deploy it or enter real customer information.
- Products begin from `backend/data/catalog.seed.json`. Admin changes are saved to the ignored local file `backend/data/catalog.local.json`; local orders and fulfilment records are saved to ignored JSON files under `backend/data/`.
- The backend recalculates order totals from the catalog. The customer submits an order request; this prototype does not capture UPI, card, or COD payments.
- The frontend keeps a convenience copy of the request in browser storage. The API’s local order record is the shared source during this local run.
- Sample products and star ratings are illustrative. Do not treat them as verified listings or real reviews.

To reset local admin edits and demo orders, stop the app and remove `backend/data/catalog.local.json`, `backend/data/orders.json`, and `backend/data/fulfillment.json`. The sample seed file is not changed.

## Build

Build both frontend apps:

```sh
npm run build
```

The storefront build is written to `frontend/dist/`; the admin preview build is written to `admin/dist/`. The backend services run on Node.js and are not included in either static build.

## Architecture

```text
Farmer browser ──> Storefront app ──┐
                                    ├──> API Gateway ──> Auth service
Staff browser ───> Admin app ───────┘                 ├─> Catalog service
                                                      ├─> Orders service
                                                      └─> Fulfillment service
```

Each backend service is a separate Node.js process with its own HTTP routes and storage adapter. The local prototype uses JSON files to keep testing free and simple. It demonstrates service boundaries; it is not a production data platform. Before live use, replace local JSON persistence with a secured database, replace demo authentication with production identity and reviewed access policies, configure backups, and deploy each service behind production-grade routing and monitoring.

### Repository map

```text
AgriCom/
├── frontend/                         # Farmer-facing Vite + React + TypeScript app
│   ├── index.html                    # Storefront document and share metadata
│   ├── vite.config.ts                # Frontend development/build settings
│   └── src/
│       ├── App.tsx                   # Storefront routes, shell and SEO metadata
│       ├── components/Storefront.tsx # Current storefront page and UI components
│       ├── data/products.ts          # Product and order TypeScript shapes + demo fallback
│       ├── services/api.ts           # HTTP client for the API gateway
│       ├── store/catalog.ts          # Loads published products from Catalog service
│       ├── store/cart.ts             # Local browser cart state
│       ├── config/store.ts           # Public-facing store settings; never put secrets here
│       ├── i18n.ts                   # English and Telugu UI strings
│       └── styles.css                # Storefront design tokens and responsive styles
├── admin/                            # Separate local owner/admin frontend preview
│   ├── index.html                    # Admin app entry document, excluded from search indexing
│   ├── vite.config.ts                # Admin app dev/build settings
│   └── src/AdminApp.tsx              # Sign-in, drafts, request queue, fulfilment and permissions
├── backend/
│   ├── data/catalog.seed.json        # Committed demo catalog used for local startup
│   ├── services/api-gateway/         # Routes requests and checks demo role permissions
│   ├── services/auth/                # Local demo login, sessions and role permissions
│   ├── services/catalog/             # Product reads, draft creation and publishing
│   ├── services/orders/              # Validates requests and records order state
│   ├── services/fulfillment/         # Supplier-direct vs own-stock assignment
│   ├── services/payments/README.md   # Planned boundary; no payment collection yet
│   └── services/notifications/README.md # Planned boundary; manual WhatsApp follow-up now
├── packages/contracts/               # HTTP API route and payload documentation
├── scripts/dev.mjs                   # Starts all local applications and services
├── scripts/dev-backend.mjs           # Starts backend service processes
├── PROJECT_BRIEF.md                  # Product goals and launch assumptions
└── README.md                         # Setup, limits and architecture guide
```

## Service responsibilities

- **API Gateway:** one local API entry point for browser apps; forwards calls and checks the demo user’s role permissions.
- **Auth:** local demo customer/admin login. Owner, Operations, Catalog manager, and Customer roles have different permissions.
- **Catalog:** owns product data and draft/published status. Only published products are returned to the storefront.
- **Orders:** validates customer details and product IDs, recalculates totals, saves order requests, and updates their status.
- **Fulfillment:** records whether an order is assigned to a supplier or AgriCom stock. After a source is chosen, staff can add the supplier name and a tracking number on the request row.
- **Batch orders:** the admin can select multiple requests and apply a status update together; individual requests still have their own status.
- **Payments:** documented future boundary. Add only after choosing a provider and implementing server-side verification.
- **Notifications:** documented future boundary. Current checkout can prepare a WhatsApp message for manual confirmation.

The local JSON files are a temporary test adapter. A production service should own its data and expose it through APIs. The first hosted test may use one database with separate service schemas to control cost, but that is a migration compromise—not strict database isolation.

## Before any public launch

Replace demo sign-in with production authentication (including MFA for staff) and reviewed server-side authorization, and add secure database access, backups, rate limiting, production secrets, privacy notices, audit history and controlled deployments. Verify supplier/product documentation, product-label content, prices, shipping eligibility and delivery terms. The current demo-credential admin is intentionally not suitable for a public or shared preview.

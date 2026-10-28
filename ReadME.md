# AgriCom storefront

AgriCom is a mobile-first storefront prototype for Indian farmers. It is built with React, TypeScript and Vite, and outputs a static site that can be hosted on Vercel, Netlify, Cloudflare Pages or GitHub Pages.

## Run it locally

1. Install Node.js 20 or newer.
2. Open a terminal in this project folder.
3. Install the packages:

   ```sh
   npm install
   ```

4. Start the local development server:

   ```sh
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`).

To make a production build, run `npm run build`. The finished static files are written to `dist/`. To preview that build locally, run `npm run preview`.

## Before accepting real orders

This repository is a frontend starter, not a complete commerce backend. The checkout creates an order request in the browser and can open a prefilled WhatsApp message. It does not securely store orders on a server, reserve inventory, authenticate an admin, or charge a card or UPI payment automatically. The UPI QR is a payment intent display; the customer must verify the payee and amount in their UPI app. Confirm orders and payments through the store's own process.

Before launch, update `src/config/store.ts` with the real WhatsApp number and UPI ID. Add the verified phone and email. Replace the sample product records and illustrations in `src/data/products.ts` with supplier-approved product information and real product photos. Confirm product registration, label claims, stock, crop suitability, prices, tax handling, delivery coverage, shipping charges, and business policies. The sample product names and specifications are placeholders; usage guidance intentionally directs customers to the approved product label rather than inventing dosage instructions.

## Project map

```text
AgriCom/
├── .gitignore                 # Ignores local dependencies and generated build files
├── index.html                 # Browser document, global title and share metadata
├── package.json               # Dependencies and dev/build/preview commands
├── package-lock.json          # Exact dependency versions used by npm install
├── vite.config.ts             # Vite + React build configuration
├── tsconfig.json              # TypeScript project references
├── tsconfig.app.json          # Strict TypeScript settings for the app
├── tailwind.config.js         # Tailwind scan paths and AgriCom theme extensions
├── postcss.config.js          # Runs Tailwind and Autoprefixer during CSS processing
├── PROJECT_BRIEF.md           # Confirmed discovery brief
├── ReadME.md                  # Setup, operating notes and this architecture map
├── public/
│   └── og-image.svg            # Storewide social-sharing image
└── src/
    ├── main.tsx               # React entry point; mounts the app and browser router
    ├── App.tsx                 # Routes and shared page shell
    ├── styles.css             # Design tokens, reusable component styles and responsive layout
    ├── i18n.ts                 # English and Telugu interface strings and language type
    ├── config/
    │   └── store.ts            # Store contact, UPI, language and delivery settings
    ├── data/
    │   └── products.ts         # Product/category/cart/order TypeScript schemas and starter catalog
    ├── store/
    │   └── cart.ts             # Zustand cart actions persisted in this browser's localStorage
    └── components/
        └── Storefront.tsx       # Header, navigation, product cards, pages, checkout and footer
```

## Architecture in plain language

- **Routes and SEO:** `App.tsx` maps URLs such as `/shop`, `/product/root-rise`, `/cart` and `/checkout` to page components. It also updates the browser title, description, Open Graph tags and canonical URL when the route changes. The page content stays in `Storefront.tsx` so the initial project is easy to explore. As it grows, move each page into its own file under `src/pages/`.
- **Product data:** `data/products.ts` defines the `Product` type once and holds the catalog. Components read product data from here instead of duplicating names or prices in page markup. A future CMS or API can replace this module while keeping the same type shape.
- **Cart:** `store/cart.ts` exposes small cart actions (`add`, `setQuantity`, `remove`, `clear`). Zustand persists the cart locally, so refreshing the same browser keeps its cart. This is device-local storage, not a shared account cart.
- **Store settings:** `config/store.ts` is the single place for store-owned contact, UPI, language and delivery settings. Do not put private payment secrets here; this file ships to the browser.
- **Language:** `i18n.ts` contains English and Telugu UI labels. Product names and other customer-facing content also need human-reviewed translations before launch.
- **Design:** `styles.css` contains component styles and responsive breakpoints. CSS custom properties at the top define the palette and can be changed to re-theme the storefront. Tailwind is configured for additional utility styling where useful.
- **Checkout:** checkout validates basic customer details, builds an order summary, saves a convenience copy to local browser storage and can open WhatsApp with the prefilled order request. A production order system should submit to a server API, validate on the server, and integrate a payment provider.
- **Images:** catalog illustrations are generated as local SVG data URLs in `data/products.ts`; they need replacement by approved product photography for production.

## Routes included

| Route | Purpose |
| --- | --- |
| `/` | Seasonal home, categories, crops and featured items |
| `/shop` | Searchable catalog with crop, brand, category and type filters |
| `/product/:id` | Product facts, quantity selection, cart and WhatsApp enquiry |
| `/cart` | Persistent cart, quantities and estimated delivery summary |
| `/checkout` | Address, PIN code, UPI/COD selection and order request |
| `/account` | Order requests saved in the current browser |
| `/about` | Store story and responsible product information |
| `/contact` | Contact options and setup hints |
| `/shipping-policy` | Delivery coverage and estimate explanation |
| `/faq` | Common shopping and product-use questions |

## Static hosting notes

The project uses client-side routing. Configure your static host to serve `index.html` for unknown paths so direct visits to routes such as `/shop` work. For GitHub Pages, configure the Vite `base` path to the repository subpath before publishing. No server rendering is required for this starter.

# AgriCom — Project Brief

## Products and customers
AgriCom will sell pesticides, fertilisers and fungicides for crops such as cotton and chilli, aimed at farmers.

## Brand and design
- **Store name:** AgriCom
- **Personality:** Premium and expert
- **Visual direction:** Heritage Botanical, based on the user's reference image
- **Palette:** Deep green, warm gold, cream and olive
- **Imagery:** Botanical imagery

## Products at launch
- Start with about 10–30 products
- Most products will be priced around ₹500–₹2,000
- Use placeholder images until product photos are ready

## Pages and mobile layout
Include:
- Home
- Shop / Products
- Product Details
- Cart
- Checkout
- About
- Contact
- My Orders
- Account
- General FAQ

The mobile home page should follow the user's sketch, including delivery PIN entry, search, product categories, Shop by Crop, offers and bottom navigation.

## Languages
Launch in English and Telugu. Kannada and Hindi are potential later additions, as indicated in the sketch.

The sketch also includes AI voice search as a possible later-stage feature.

## Store features
- Offers banner
- Pack-size information
- Shipping information
- Product usage guidance
- Basic product information
- Customer star ratings out of 5

## Payments and contact
- Launch payment options: UPI and cash on delivery
- Keep payment options easy to update later, including adding card payments
- Customer contact options: WhatsApp, phone and email
- Contact details can be added later

## Domain
Use a temporary address for now. The domain name will be decided later.

## Architecture and operating decisions (planning update)
- Keep the current React, TypeScript and Vite storefront, but separate it from backend APIs.
- Use independently runnable services for catalog, orders, and fulfillment, behind an API gateway. Payments and automated notifications are later service boundaries.
- Keep a separate owner/admin frontend. The owner reviews product drafts before publishing them to the storefront.
- Launch as order requests: check supplier stock, price, and delivery availability before confirming with the customer. Suppliers are expected to ship most products; some orders may ship from AgriCom stock.
- Customer and admin sign-in screens are included in the local test. The customer can see their own order requests; admin roles have different permissions. Supplier logins are not required for the first test.
- The admin workspace needs incoming request handling, individual and batch status updates, fulfilment source assignment, and role permission settings.
- Initial product count planning range: 25–500. Supplier stock-update method is undecided; the test flow uses a manual availability check.
- Payment preference: UPI or COD, collected/confirmed only after the store confirms the order. No card processing in the first test.
- Keep the first preview private and local. Do not use real customer information or enable live payment collection in the test environment.
- Local service storage is for demonstration only. Production requires secured persistent storage, access controls, backups, and verified product, supplier, and shipping workflows.

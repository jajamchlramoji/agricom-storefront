# AgriCom — Project, Startup and Architecture Handoff

> **Purpose:** Give a local language model enough context to understand AgriCom, its current prototype, product direction, planned architecture, startup goals and likely delivery sequence. This document distinguishes user-confirmed decisions from working assumptions and questions still requiring validation. It is a planning handoff, not a claim that legal, supplier, payment or market research has been completed.

## 1. Executive summary

AgriCom is a planned India-wide digital commerce and order-fulfilment business for agricultural inputs, initially serving farmers who need crop-relevant pesticides, fertilisers and fungicides. The experience should help a farmer find products by crop and need, understand verified product information and request an order in a simple mobile-first flow. The business intends to coordinate product availability, pricing, delivery and fulfilment across suppliers and its own inventory where applicable.

The current repository is an early, private, local-test prototype on the `dev` branch. It has a customer storefront, a separate admin frontend, and independently runnable backend services behind a gateway. It demonstrates a product catalogue, demo role-based sign-in, order requests, a request queue, batch status changes, and fulfilment source assignment. It is not yet a production system: local JSON files, in-memory demo authentication, sample product content and local-only network binding are used. There is no real payment collection or verified production fulfilment integration.

The immediate aim is to validate the end-to-end workflow with dummy data, clarify the operating model and prove that staff can process incoming requests reliably. The longer-term aim is a scalable, trustworthy AgriCom-owned platform that can add suppliers, regions, languages, payment options and automation without making the first release unnecessarily complex.

## 2. Business and product description

### The problem AgriCom is trying to solve

Farmers often need to identify suitable agricultural inputs for a particular crop and situation, understand pack sizes and usage information, check availability and get the product delivered. A useful service needs dependable product information and a clear answer about whether an order can actually be supplied and delivered. AgriCom's proposed value is to combine an accessible digital catalogue with a human-supported confirmation and fulfilment process.

This problem statement is a product hypothesis and should be tested with farmers, suppliers and agricultural experts before it is treated as proven market research.

### Intended customers

- **Primary user:** Indian farmers, including customers growing cotton, chilli (mirchi), paddy, vegetables and other crops.
- **Initial experience:** Mobile-first and simple enough for customers with limited familiarity with ecommerce apps.
- **Languages:** English and Telugu for the initial interface direction. Hindi and Kannada are later possibilities from the original product sketch. Actual launch language and geographic coverage still need validation.
- **Support:** WhatsApp, phone and email are desired contact channels. Real contact details are not configured yet.
- **Other participants:** AgriCom owner/admin, operations staff, catalogue staff, suppliers and fulfilment partners. Supplier self-service access is not required for the first test.

### Proposed value

- Browse agricultural inputs by category, crop and product details.
- See clear, accurate pack-size, price, shipping, product-use and safety information.
- Submit an order request without assuming stock or delivery is guaranteed.
- Receive human confirmation after the business checks availability, price and delivery feasibility.
- Let internal staff review and process requests in a dedicated operations workspace.

## 3. Product and brand direction

- **Name:** AgriCom.
- **Brand personality:** Premium and expert, while remaining approachable and practical for farmers.
- **Visual reference:** “Heritage Botanical” direction based on the user's supplied app concept and palette reference.
- **Palette:** Deep botanical green, warm gold/amber, cream and olive. The supplied color reference is the preferred initial direction; final accessible color tokens can be adjusted later.
- **Photography:** Use clearly illustrative placeholders until genuine, authorized product photographs and label assets are available.
- **Initial catalogue planning range:** User has discussed starting small (about 10–30 items) and later gave a broader planning range of 25–500. Treat 10–30 as a sensible pilot hypothesis, not a final commitment; the exact launch SKU count is open.
- **Indicative price range:** Most products expected around ₹500–₹2,000, subject to product and supplier validation.
- **Ratings:** A five-star “x/5” display was requested. Do not fabricate customer reviews or imply sample ratings are verified.

## 4. Customer experience requirements

### Storefront and discovery

- Responsive, mobile-first storefront.
- Home page with delivery/pincode prompt, search, categories, crop browsing, offers and prominent contact/help paths.
- Product catalogue with search, categories and crop relevance; future filtering can include brand and organic/chemical classification where product data supports it.
- Product detail page with verified product name, pack size, price, genuine images/label, relevant crops, approved use guidance, availability and shipping information.
- Cart and a simple checkout/order-request flow.
- About, contact, FAQ, shipping information, account and order-history areas.
- Bottom navigation on mobile and clear cart count.
- English and Telugu as the initial language direction.
- Future ideas from the sketch: voice/AI assistance and more languages. These are not MVP commitments.

### Order and payment experience

- Initial order submission is a **request**, pending human confirmation of supply and delivery.
- Preferred payment choices are UPI and cash on delivery (COD), with the option to add card payments later.
- The earlier project direction specifies taking/confirming payment only after the business confirms the request. No live payment collection exists in the current test prototype.
- WhatsApp, phone and email are desired support channels. Current WhatsApp handling is manual/future-oriented; no verified production messaging integration is configured.
- Order confirmation should clearly communicate status, payment instructions, shipping expectations and support contact.

### Product information and trust

Requested features include an offers banner, size/pack information, shipping details, product usage guidance, basic product information and customer star ratings out of five. Product claims, crop recommendations, dosage and safety directions must come from verified labels and qualified sources. The application should not invent pesticide/fertiliser guidance or let marketing content override approved product labels.

## 5. Admin and operations requirements

The admin experience is a separate application, with access based on staff role. The user specifically wants more than product editing:

- Admin sign-in and log-out.
- A customer login/account experience, separate from staff controls.
- Role-based admin permissions/settings.
- Create and edit product drafts; publish a product to the customer catalogue only after authorized review.
- View incoming order requests and their details.
- Process requests individually or in batches and see/update processing status.
- Assign fulfilment source: supplier-direct or AgriCom stock; record supplier/tracking information where applicable.
- Preserve per-order status even when a batch action is used.
- Give staff clear visibility of pending work and next actions.

The local prototype currently demonstrates owner/admin, operations and catalogue-manager roles plus a customer account. Demo roles and permissions are not a complete authorization policy. Before real use, define least-privilege access, approval rules, audit history and safe handling of customer data.

## 6. Startup goals

### Near-term validation goals

1. Test whether farmers understand the product discovery and order-request flow.
2. Validate the initial crop, region, language, catalogue and product-information needs.
3. Confirm how supplier availability, final pricing and shipping eligibility are checked.
4. Test the internal workflow from incoming request to confirmation, fulfilment assignment and completion/cancellation.
5. Measure whether staff can process requests reliably, including batch handling, without losing per-order state.
6. Establish trust practices for product identity, genuine stock, label information, support and delivery communication.

### Business goals to validate

- Build an AgriCom-owned ecommerce platform rather than depend on a single supplier storefront.
- Start with a controlled pilot and expand coverage after validating operations.
- Coordinate suppliers and AgriCom inventory while retaining control of customer experience and order records.
- Keep the first technology and operating cost low, then invest as demand and operational capacity are demonstrated.
- Make products easy to add through the admin workspace and publish after review.

### Useful pilot measures

These are suggested measures, not user-confirmed targets:

- Number of qualified farmer interviews and pilot users.
- Product search success and product detail engagement.
- Request submission completion rate.
- Time from request received to availability/price confirmation.
- Percentage of requests accepted, fulfilled, cancelled or unavailable.
- On-time delivery and order issue rate.
- Repeat order rate and customer support response time.
- Product data completeness and catalogue update time.
- Cost per processed order and gross contribution after shipping, payment and support costs.

Set numeric targets after baseline interviews and pilot operations.

## 7. Current prototype and repository state

### Current branch and local preview

- Repository branch: `dev` (created to keep the architecture work separate from `main`).
- Local storefront: `http://127.0.0.1:5173/`.
- Local customer login: `http://127.0.0.1:5173/login`.
- Local admin preview: `http://127.0.0.1:5174/`.
- Local API health: `http://127.0.0.1:4000/api/health`.
- Start with `npm install` then `npm run dev`; build with `npm run build`.
- Demo credentials and exact local setup instructions are in `ReadME.md`/`README.md`. Credentials are intentionally not duplicated here; they are test-only secrets and must not be reused or published.

### Implemented prototype capabilities

- React, TypeScript and Vite customer storefront.
- Separate Vite admin frontend.
- Node.js services for API gateway, demo auth, catalogue, orders and fulfilment.
- API contracts documented under `packages/contracts/`.
- Catalogue draft/publish path; public catalogue reads published entries.
- Customer order-request flow with backend price recalculation and local JSON persistence.
- Admin incoming request queue, individual/batch status controls, fulfilment source assignment and permission view.
- Demo customer account/order list and sign-in/log-out flows.
- English/Telugu interface direction and botanical visual treatment.

### Important limitations

- This is a local prototype, not a live business service.
- Demo authentication and sessions are not production-grade; sessions and credential setup are local/in-memory.
- Role checks and permission settings are demonstrations, not reviewed security controls.
- Local JSON files are not a secure, backed-up, concurrent production database.
- No live UPI/card gateway or COD reconciliation is implemented.
- Product catalogue, ratings, imagery and operational data may be illustrative and unverified.
- Supplier integrations, shipping integrations, tax/accounting, refund handling, customer notifications and monitoring are not complete.
- Do not put real customer data or payment details into the prototype or expose it publicly.

## 8. Architecture direction

### Guiding choice

Keep customer frontend, admin frontend and backend responsibilities separated. The user explicitly prefers a split frontend/backend and service-oriented or microservice direction over a monolithic application. The current local setup demonstrates separable processes. For a low-budget startup, keep service boundaries clear but avoid multiplying deployed infrastructure before traffic and team capacity justify it. A modular service architecture can be deployed simply at first, then split further when operational needs demand it.

### Current local architecture

```text
Farmer browser -> Storefront frontend --+
                                        +-> API Gateway -> Auth service
Staff browser  -> Admin frontend ------+               -> Catalog service
                                                        -> Orders service
                                                        -> Fulfillment service

Local demo persistence: JSON files; sessions: in memory
```

### Intended service ownership

- **Storefront:** product discovery, cart, customer account and order request submission.
- **Admin frontend:** staff workspace, catalogue management, request processing and permission UI.
- **API gateway:** single API entry point for browser applications, routing and request-level access checks.
- **Auth service:** customer/staff identity, sessions and role definitions. Replace demo auth before public preview.
- **Catalog service:** product data, draft/review/publish state and published catalogue.
- **Orders service:** validates order requests, recalculates totals, records order lifecycle and customer ownership.
- **Fulfillment service:** supplier-direct vs own-stock assignment, supplier details, shipment/tracking and fulfilment status.
- **Payments service:** future boundary for payment initiation, provider callbacks/webhooks, reconciliation and refunds. The current prototype does not collect payments.
- **Notifications service:** future boundary for email/WhatsApp/SMS updates and delivery of order status messages. Begin with manual contact if needed.
- **Shared contracts:** documented API routes and payloads in `packages/contracts/`; keep these explicit as services evolve.

### Data and low-cost test approach

The current local JSON adapter is only for local testing. The user asked for a free or very low-cost start and mentioned that even Excel could be useful. A spreadsheet can help staff review a small pilot or import/export products, but it should not be treated as the authoritative multi-user order database: concurrency, access control, change history, validation and customer privacy are weak. A low-cost hosted relational database with a free tier may be a better early backend store, subject to current pricing, region, backup and data-protection review. Keep data behind backend APIs; never put database secrets in browser code. Decide database/provider only after verifying current service terms and operational requirements.

### Basic security goals before external testing

- Use a managed identity/session approach or properly secured authentication; never ship shared demo passwords.
- Enforce server-side authorization on every protected operation; use least privilege.
- Protect admin accounts with strong credentials and MFA when available.
- Keep secrets in environment configuration, not source control or frontend bundles.
- Use HTTPS, secure cookies/session handling, rate limiting and input validation.
- Minimize customer data collected; define retention, export, correction and deletion processes.
- Keep audit records for product publication, permission changes, order status and fulfilment changes.
- Back up and test restoration of production data; separate test and production environments.
- Do not log passwords, payment credentials or unnecessary personal data.

## 9. Payments, AI and additional services

### Payments

- **Pilot:** accept an order request; confirm supply and final total first. Any UPI transfer or COD arrangement must be handled with a clear manual process and reconciliation until a gateway is selected.
- **Later:** integrate an India-supported payment provider after evaluating pricing, settlement, refunds, disputes, webhook verification, security and business eligibility. Add card processing only if customer demand and economics support it.
- Never trust a browser's “payment successful” message alone. Verify payment status server-side with signed provider callbacks/API checks and record idempotent transaction events.
- Whether COD can be offered across all India, how COD remittance/returns work and which carriers support the products/regions are open operating questions.

### AI assistant

AI chat, image-based problem diagnosis and voice search are ideas from the design discussion, not MVP necessities. An unsafe recommendation could cause crop loss, health/environment risks or incorrect pesticide use. Start with searchable, verified product information and a clear path to a human/agronomist. If AI is explored later, constrain it to reviewed content, display source/label context, avoid diagnosis or dosage invention, protect uploaded photos and provide human escalation. Test in one language and limited scope before broad deployment.

### Other likely capabilities to plan for

- Product and supplier verification workflow.
- Shipping/eligibility checks and tracking; returns, damaged goods and cancellation handling.
- Customer support ownership and response-time process.
- Inventory/availability and price freshness.
- Tax invoices, accounting and reconciliation.
- Analytics with privacy-aware event collection.
- Error monitoring, backups, security review and deployment rollback.
- Content governance for labels, claims, localized translations and product warnings.

These require discovery and provider research before selection.

## 10. Proposed delivery roadmap and timeline

The following timeline is a planning estimate, not a promised launch date. It assumes one small product/engineering team, responsive stakeholder decisions, and no major regulatory, supplier or logistics blocker. Re-estimate after confirming team size, availability, pilot region and operational partners. Durations can overlap where appropriate.

| Phase | Indicative duration | Outcome / exit check |
|---|---:|---|
| 0. Discovery and operating model | 1–2 weeks | Choose pilot geography/crops, interview farmers and suppliers, define request-to-delivery workflow, confirm product data owner, support process, fulfillment model and launch measures. |
| 1. Local prototype validation | 1 week | Walk through storefront, customer login, request submission and admin batch queue using dummy information; record usability issues and refine statuses/permissions. |
| 2. Private hosted test foundation | 2–4 weeks | Set up isolated test deployment, managed database, real auth controls, secrets, backups, logging, basic monitoring, test-only accounts and a product/order import/export process. No public payments. |
| 3. Controlled pilot readiness | 2–4 weeks | Load verified initial products, confirm supplier terms and shipping coverage, finalize policies/support scripts, test cancellations/returns and run end-to-end fulfilment rehearsals with a small invited group. |
| 4. Limited pilot | 4–8 weeks | Operate in one selected region/crop cohort; manually confirm stock and orders; measure support, fulfilment, delivery, conversion and unit economics. Expand only if reliability is acceptable. |
| 5. Broader launch preparation | 4–8+ weeks | Address pilot findings, expand catalogue/regions/languages, automate stable workflows, complete payment and notification integrations, security/privacy review and operational readiness. |
| 6. Scale | Ongoing | Add supplier tools, deeper integrations, analytics, automation and carefully scoped AI only when demonstrated bottlenecks and business value justify them. |

### Timeline dependencies and gates

- The project should not move from local demo to public customer use until identity, access control, data storage, backups, product content and order support are ready.
- The first pilot geography must be selected before delivery promises, pincode behavior and carrier planning can be finalized.
- Product and pesticide/fertiliser content must be verified before real listings are published.
- Payment integration depends on the business model, seller/payment eligibility and refund/reconciliation process.
- Any India-wide rollout depends on supply, shipping eligibility, regional operating capacity and applicable legal/compliance review; “across India” is an ambition, not a confirmed first launch footprint.

## 11. Decisions: confirmed, provisional and open

### Confirmed or directly requested

- AgriCom name and farmer-focused agricultural inputs concept.
- Products include pesticides, fertilisers and fungicides; crops include cotton and chilli.
- Premium/expert, Heritage Botanical visual direction with deep green, gold, cream and olive.
- Customer mobile storefront and a separate admin experience.
- English and Telugu as initial language direction; Hindi/Kannada are later ideas.
- UPI and COD are preferred payment methods; card capability should be possible later.
- WhatsApp, phone, email and a general FAQ are desired customer support options.
- Product offers, pack-size/size information, shipping information, usage/basic information and star ratings are desired.
- Admin needs product publishing, incoming requests, batch processing/statuses, permissions and log out.
- Keep current testing private/local and avoid real customer/payment data.
- User wants a split backend/frontend and service-oriented architecture, and asked to make architecture changes on a separate `dev` branch.

### Provisional planning assumptions

- Begin with a smaller catalogue, then grow toward hundreds of products.
- Start with manual human review of availability, final price and delivery before confirming requests.
- Use suppliers for many products and AgriCom stock for some; this has not yet been proven operationally.
- Keep supplier logins out of the first test.
- Use English/Telugu in the initial pilot if customer research confirms it.
- Prefer low-cost managed infrastructure for a hosted private test; exact vendors remain unselected.
- Defer AI diagnosis, AI image analysis and voice support until product, safety and support foundations are reliable.

### Open questions for the next planning round

1. Which state/district and first crop/customer segment should the pilot serve?
2. Who owns the business, inventory, customer support and day-to-day order operations?
3. Will AgriCom resell inventory, act as a marketplace/agent, or use a blended model? Who is seller of record?
4. Which suppliers are committed, what stock/price feeds can they provide, and what are their dispatch/return terms?
5. Which products and pack sizes are approved for the pilot, and who verifies label/crop/dosage content?
6. What is the exact order status lifecycle, including awaiting review, confirmed, payment pending/paid, preparing, shipped, delivered, cancelled, unavailable and refunded?
7. How will shipping charges, delivery estimates, remote-area serviceability, restricted products, COD, failed delivery and returns be handled?
8. What legal entity, tax invoicing, licenses, product restrictions and state/central compliance review are required for the chosen products and operating model?
9. What is the realistic startup budget, team size and desired pilot date?
10. What customer identity is required: guest checkout, phone OTP, or account/password? What data is truly necessary?
11. Which spreadsheet/database and hosting approach fits the chosen pilot scale and privacy needs?
12. What targets must be reached before adding UPI gateway automation, cards, supplier portal, more languages or AI?

## 12. Instructions for a local LLM using this file

When helping with AgriCom:

1. Treat sections marked confirmed as the current direction, but preserve explicit open questions.
2. Do not invent supplier agreements, prices, reviews, product facts, legal conclusions, service pricing or launch dates.
3. Label recommendations and assumptions clearly; ask one focused question at a time when a decision blocks meaningful progress.
4. Prioritize farmer usability, verified product information, privacy, safe order handling and low startup cost.
5. Do not suggest public deployment of the current demo with real user information.
6. Keep AI product diagnosis and payment handling out of the MVP until validated and safely designed.
7. Use the repository's current `dev` branch and implementation as described, but inspect the actual files before making code changes because this handoff may become outdated.
8. Before selecting any current vendor, law, price, API behavior or regulatory requirement, perform up-to-date research and cite authoritative sources.
9. Distinguish a limited pilot plan from the longer-term India-wide startup ambition.

## 13. Related repository documents

- `PROJECT_BRIEF.md` — shorter product brief and architecture decisions.
- `ReadME.md` / `README.md` — local setup, demo credentials, repository layout and limitations.
- `packages/contracts/README.md` — current API routes and payload notes.
- `backend/services/payments/README.md` — future payment service notes.
- `backend/services/notifications/README.md` — future notifications boundary.


# Payments service (planned)

Not active in the local test release. The current customer flow records a UPI or COD preference; payment is confirmed manually after product availability and delivery are checked.

When this service is implemented, it must create provider payments on the server, verify signed callbacks/webhooks, and never store card data. Until then, no payment is collected by this application.

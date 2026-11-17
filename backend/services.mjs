/** The backend services, in start order. Used by the dev script and the tests. */
export const services = [
  {
    name: 'catalog',
    file: 'backend/services/catalog/server.mjs',
    portEnv: 'CATALOG_PORT',
    urlEnv: 'CATALOG_SERVICE_URL',
    port: 4101,
  },
  {
    name: 'orders',
    file: 'backend/services/orders/server.mjs',
    portEnv: 'ORDERS_PORT',
    urlEnv: 'ORDERS_SERVICE_URL',
    port: 4102,
  },
  {
    name: 'fulfillment',
    file: 'backend/services/fulfillment/server.mjs',
    portEnv: 'FULFILLMENT_PORT',
    urlEnv: 'FULFILLMENT_SERVICE_URL',
    port: 4103,
  },
  {
    name: 'auth',
    file: 'backend/services/auth/server.mjs',
    portEnv: 'AUTH_PORT',
    urlEnv: 'AUTH_SERVICE_URL',
    port: 4104,
  },
  {
    name: 'api gateway',
    file: 'backend/services/api-gateway/server.mjs',
    portEnv: 'API_PORT',
    urlEnv: 'API_URL',
    port: 4000,
  },
];

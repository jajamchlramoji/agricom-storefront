import type { Fulfillment, Order } from '../types';

const batchStatuses = [
  'checking_availability',
  'confirmed',
  'awaiting_payment',
  'ready_to_dispatch',
  'dispatched',
  'delivered',
  'cancelled',
];

type Props = {
  orders: Order[];
  fulfillment: Record<string, Fulfillment>;
  selected: string[];
  setSelected: (ids: string[]) => void;
  batchStatus: string;
  setBatchStatus: (status: string) => void;
  saving: boolean;
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
  processBatch: () => Promise<void>;
  setOrderStatus: (order: Order, status: string) => Promise<void>;
  setOrderFulfillment: (order: Order, changes: Partial<Omit<Fulfillment, 'orderId'>>) => Promise<void>;
};

export function OrdersPage({
  orders,
  fulfillment,
  selected,
  setSelected,
  batchStatus,
  setBatchStatus,
  saving,
  can,
  refresh,
  processBatch,
  setOrderStatus,
  setOrderFulfillment,
}: Props) {
  return (
    <section className="admin-card orders-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">ORDERS SERVICE</p>
          <h2>Incoming requests</h2>
          <p className="section-subcopy">Review each request, check stock and delivery, then update its progress.</p>
        </div>
        <button className="quiet-button" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>
      {can('orders.update') && (
        <div className="batch-bar">
          <label>
            <input
              type="checkbox"
              checked={orders.length > 0 && selected.length === orders.length}
              onChange={(e) => setSelected(e.target.checked ? orders.map((order) => order.id) : [])}
            />{' '}
            Select all
          </label>
          <span>{selected.length} selected</span>
          <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)}>
            {batchStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <button className="small-button" disabled={!selected.length || saving} onClick={() => void processBatch()}>
            {saving ? 'Processing…' : 'Apply to selected'}
          </button>
        </div>
      )}
      {orders.length ? (
        <div className="list">
          {orders.map((order) => (
            <article className="order-row" key={order.id}>
              <div className="order-top">
                {can('orders.update') && (
                  <input
                    type="checkbox"
                    checked={selected.includes(order.id)}
                    onChange={(e) =>
                      setSelected(e.target.checked ? [...selected, order.id] : selected.filter((id) => id !== order.id))
                    }
                    aria-label={`Select ${order.id}`}
                  />
                )}
                <div>
                  <b>{order.id}</b>
                  <small>
                    {order.name} · {order.phone} · PIN {order.pincode}
                  </small>
                </div>
                <b>₹{order.total.toLocaleString('en-IN')}</b>
              </div>
              <p>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ')}</p>
              <div className="order-actions">
                <span className="status">{order.status.replaceAll('_', ' ')}</span>
                {can('orders.update') && order.nextStatuses.length > 0 && (
                  <select
                    value={order.status}
                    onChange={(e) => void setOrderStatus(order, e.target.value)}
                    aria-label={`Update ${order.id} status`}
                  >
                    {[order.status, ...order.nextStatuses].map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                )}
                {can('fulfillment.manage') && (
                  <select
                    value={fulfillment[order.id]?.source || ''}
                    onChange={(e) =>
                      void setOrderFulfillment(order, { source: e.target.value as Fulfillment['source'] })
                    }
                    aria-label={`Set fulfilment source for ${order.id}`}
                  >
                    <option value="" disabled>
                      Choose fulfilment
                    </option>
                    <option value="supplier">Supplier direct</option>
                    <option value="own_stock">AgriCom stock</option>
                  </select>
                )}
              </div>
              {can('fulfillment.manage') && fulfillment[order.id] && (
                <div className="fulfillment-details">
                  {fulfillment[order.id].source === 'supplier' && (
                    <input
                      key={`${order.id}-supplier-${fulfillment[order.id].supplierName}`}
                      defaultValue={fulfillment[order.id].supplierName}
                      placeholder="Supplier name"
                      aria-label={`Supplier for ${order.id}`}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value !== fulfillment[order.id]?.supplierName)
                          void setOrderFulfillment(order, { supplierName: value });
                      }}
                    />
                  )}
                  <input
                    key={`${order.id}-tracking-${fulfillment[order.id].trackingNumber}`}
                    defaultValue={fulfillment[order.id].trackingNumber}
                    placeholder="Tracking number"
                    aria-label={`Tracking number for ${order.id}`}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value !== fulfillment[order.id]?.trackingNumber)
                        void setOrderFulfillment(order, { trackingNumber: value });
                    }}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-note">No order requests yet. New requests appear here after checkout.</p>
      )}
    </section>
  );
}

import type { Order, Product, User } from '../types';

type Props = {
  user: User;
  products: Product[];
  orders: Order[];
  newRequests: number;
  openOrders: () => void;
};

export function OverviewPage({ user, products, orders, newRequests, openOrders }: Props) {
  return (
    <section className="dashboard-content">
      <p className="welcome-copy">Welcome back, {user.name.split(' ')[0]}. Here’s the current local test activity.</p>
      <div className="stat-grid">
        <article className="stat-card">
          <span>Published products</span>
          <b>{products.filter((item) => item.status === 'published').length}</b>
          <small>Visible in the storefront catalog</small>
        </article>
        <article className="stat-card">
          <span>Draft products</span>
          <b>{products.filter((item) => item.status === 'draft').length}</b>
          <small>Waiting for review</small>
        </article>
        <article className="stat-card">
          <span>New requests</span>
          <b>{newRequests}</b>
          <small>Need availability checks</small>
        </article>
        <article className="stat-card">
          <span>All order requests</span>
          <b>{orders.length}</b>
          <small>Saved by the local Orders service</small>
        </article>
      </div>
      <div className="admin-card overview-card">
        <div>
          <p className="eyebrow">NEXT STEP</p>
          <h2>Review stock before confirming</h2>
          <p>
            Check supplier availability and delivery for the customer’s PIN, then move the request through its status
            steps.
          </p>
        </div>
        <button className="primary-button" onClick={openOrders}>
          Open order requests
        </button>
      </div>
    </section>
  );
}

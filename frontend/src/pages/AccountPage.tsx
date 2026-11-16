import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, PackageCheck } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../store/auth';
import { money } from '../lib/format';

type CustomerOrder = {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  paymentPreference: string;
  items: { productId: string; name: string; quantity: number; unitPrice: number }[];
};

export function AccountPage() {
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user) {
      navigate('/login?next=/account', { replace: true });
      return;
    }
    apiRequest<{ orders: CustomerOrder[] }>('/orders/mine')
      .then((data) => setOrders(data.orders))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load order requests.'));
  }, [user, navigate]);
  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }
  return (
    <main className="wrap page-main">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>My orders</span>
      </div>
      <div className="shop-heading">
        <div>
          <span className="eyebrow">YOUR AGRICOM</span>
          <h1>My order requests</h1>
          <p>{user ? `Signed in as ${user.name}.` : 'Sign in to view your requests.'}</p>
        </div>
        {user && (
          <button className="btn btn-outline" onClick={() => void signOut()}>
            Log out
          </button>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <span className="eyebrow">ORDER REQUEST</span>
                <h2>{order.id}</h2>
                <small>
                  {new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.paymentPreference}
                </small>
              </div>
              <div>
                {order.items.map((item) => (
                  <p key={item.productId}>
                    {item.name} × {item.quantity}
                  </p>
                ))}
              </div>
              <strong>{money(order.total)}</strong>
              <span className="order-status">{order.status.replace(/_/g, ' ')}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <PackageCheck size={38} />
          <h2>No order requests yet</h2>
          <p>When you place one, you can follow its status here.</p>
          <Link to="/shop" className="btn btn-primary">
            Explore products
          </Link>
        </div>
      )}
    </main>
  );
}

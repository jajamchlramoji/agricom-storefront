import { useCallback, useEffect, useMemo, useState } from 'react';
import { request } from './api';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { OverviewPage } from './pages/OverviewPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { ProductsPage } from './pages/ProductsPage';
import type {
  Availability,
  BatchResult,
  Fulfillment,
  Order,
  Page,
  PermissionMap,
  Product,
  ProductForm,
  User,
} from './types';

const pageNames: Record<Page, string> = {
  overview: 'Overview',
  products: 'Products',
  orders: 'Incoming requests',
  permissions: 'Permissions',
};

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [login, setLogin] = useState({ email: 'admin@agricom.local', password: 'AgriComAdmin2026!' });
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState<Page>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fulfillment, setFulfillment] = useState<Record<string, Fulfillment>>({});
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState('checking_availability');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    category: 'Plant nutrition',
    price: '',
    size: '',
    brand: '',
    crop: 'Cotton, Chilli',
    description: '',
    fulfillmentSource: 'supplier',
  });

  const refresh = useCallback(async () => {
    try {
      const tasks: Promise<unknown>[] = [];
      if (user?.permissions.includes('catalog.read'))
        tasks.push(
          request<{ products: Product[] }>('/catalog/admin/products').then((data) => setProducts(data.products)),
        );
      if (user?.permissions.includes('orders.read'))
        tasks.push(
          request<{ orders: Order[] }>('/admin/orders').then(async (data) => {
            setOrders(data.orders);
            if (user.permissions.includes('fulfillment.manage')) {
              const records = await Promise.all(
                data.orders.map(async (order) => {
                  try {
                    const result = await request<{ fulfillment: Fulfillment | null }>(
                      `/fulfillment/admin/orders/${encodeURIComponent(order.id)}`,
                    );
                    return [order.id, result.fulfillment] as const;
                  } catch {
                    return [order.id, null] as const;
                  }
                }),
              );
              setFulfillment(
                Object.fromEntries(records.filter((row): row is readonly [string, Fulfillment] => row[1] !== null)),
              );
            }
          }),
        );
      if (user?.permissions.includes('permissions.manage'))
        tasks.push(
          request<{ permissions: PermissionMap }>('/auth/admin/permissions').then((data) =>
            setPermissions(data.permissions),
          ),
        );
      await Promise.all(tasks);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not refresh admin data.');
    }
  }, [user]);

  useEffect(() => {
    const token = sessionStorage.getItem('agricom-admin-token');
    if (!token) {
      setAuthReady(true);
      return;
    }
    request<{ user: User }>('/auth/me')
      .then(({ user: current }) => {
        if (current.role === 'customer') throw new Error('Use the customer sign-in page for customer accounts.');
        setUser(current);
      })
      .catch(() => sessionStorage.removeItem('agricom-admin-token'))
      .finally(() => setAuthReady(true));
  }, []);
  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setLoginError('');
    try {
      const result = await request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(login),
      });
      if (result.user.role === 'customer')
        throw new Error('This is a customer account. Sign in from the storefront instead.');
      sessionStorage.setItem('agricom-admin-token', result.token);
      setUser(result.user);
    } catch (error) {
      sessionStorage.removeItem('agricom-admin-token');
      setLoginError(error instanceof Error ? error.message : 'Could not sign in.');
    }
  }
  async function signOut() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      /* The local session can still be cleared if the service is unavailable. */
    }
    sessionStorage.removeItem('agricom-admin-token');
    setUser(null);
    setProducts([]);
    setOrders([]);
    setPage('overview');
  }
  async function addProduct(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await request('/catalog/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          crop: form.crop
            .split(',')
            .map((crop) => crop.trim())
            .filter(Boolean),
        }),
      });
      setForm({
        name: '',
        category: 'Plant nutrition',
        price: '',
        size: '',
        brand: '',
        crop: 'Cotton, Chilli',
        description: '',
        fulfillmentSource: 'supplier',
      });
      setMessage('Product saved as a draft. Review it, then publish it.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save product.');
    } finally {
      setSaving(false);
    }
  }
  async function setProductStatus(product: Product, status: Product['status']) {
    try {
      await request(`/catalog/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update product.');
    }
  }
  async function setProductAvailability(product: Product, availability: Availability) {
    try {
      await request(`/catalog/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ availability }),
      });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update product.');
    }
  }
  async function setOrderStatus(order: Order, status: string) {
    try {
      await request(`/admin/orders/${encodeURIComponent(order.id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update order.');
    }
  }
  async function setOrderFulfillment(order: Order, changes: Partial<Omit<Fulfillment, 'orderId'>>) {
    const previous = fulfillment[order.id];
    const source = changes.source || previous?.source;
    if (!source) {
      setMessage('Choose a fulfilment source before adding supplier or tracking details.');
      return;
    }
    try {
      await request(`/fulfillment/admin/orders/${encodeURIComponent(order.id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          source,
          supplierName: changes.supplierName ?? previous?.supplierName ?? '',
          trackingNumber: changes.trackingNumber ?? previous?.trackingNumber ?? '',
        }),
      });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save fulfilment source.');
    }
  }
  async function processBatch() {
    if (!selected.length) return;
    setSaving(true);
    try {
      const result = await request<BatchResult>('/admin/orders/batch', {
        method: 'PATCH',
        body: JSON.stringify({ ids: selected, status: batchStatus }),
      });
      setSelected([]);
      await refresh();
      // refresh() clears the message, so report the batch result after it.
      const skipped = result.skipped.map((item) => item.reason).join(' ');
      setMessage(`${result.updated} order request(s) updated.${skipped ? ` Skipped: ${skipped}` : ''}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Batch update failed.');
    } finally {
      setSaving(false);
    }
  }
  async function savePermissions() {
    setSaving(true);
    try {
      const result = await request<{ permissions: PermissionMap }>('/auth/admin/permissions', {
        method: 'PUT',
        body: JSON.stringify({ permissions }),
      });
      setPermissions(result.permissions);
      setMessage('Role permissions saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save permissions.');
    } finally {
      setSaving(false);
    }
  }
  function togglePermission(role: string, permission: string) {
    setPermissions((current) => {
      const currentList = current[role] || [];
      return {
        ...current,
        [role]: currentList.includes(permission)
          ? currentList.filter((item) => item !== permission)
          : [...currentList, permission],
      };
    });
  }

  const can = (permission: string) => Boolean(user?.permissions.includes(permission));
  const newRequests = useMemo(() => orders.filter((order) => order.status === 'new_request').length, [orders]);
  if (!authReady) return <div className="auth-loading">Checking local session…</div>;
  if (!user) return <LoginPage login={login} setLogin={setLogin} loginError={loginError} signIn={signIn} />;

  const showPage = (selectedPage: Page) => {
    if (selectedPage === 'products' && !can('catalog.read')) return;
    if (selectedPage === 'orders' && !can('orders.read')) return;
    if (selectedPage === 'permissions' && !can('permissions.manage')) return;
    setPage(selectedPage);
  };
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="brand-dot">✳</span>
          <div>
            <b>AgriCom</b>
            <small>ADMIN WORKSPACE</small>
          </div>
        </div>
        <nav aria-label="Admin sections">
          <span className="nav-caption">WORKSPACE</span>
          <button className={page === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => showPage('overview')}>
            ▦ <span>Overview</span>
          </button>
          {can('catalog.read') && (
            <button
              className={page === 'products' ? 'nav-item active' : 'nav-item'}
              onClick={() => showPage('products')}
            >
              ◇ <span>Products</span>
            </button>
          )}
          {can('orders.read') && (
            <button className={page === 'orders' ? 'nav-item active' : 'nav-item'} onClick={() => showPage('orders')}>
              ▤ <span>Incoming requests</span>
              {newRequests > 0 && <i>{newRequests}</i>}
            </button>
          )}
          {can('permissions.manage') && (
            <button
              className={page === 'permissions' ? 'nav-item active' : 'nav-item'}
              onClick={() => showPage('permissions')}
            >
              ⚙ <span>Permissions</span>
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <span className="local-pill">Local test only</span>
          <small>Private preview · no live payments</small>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">AGRICOM OPERATIONS</span>
            <h1>{pageNames[page]}</h1>
          </div>
          <div className="user-controls">
            <div className="user-chip">
              <span>{user.name.slice(0, 1)}</span>
              <div>
                <b>{user.name}</b>
                <small>{user.role.replaceAll('_', ' ')}</small>
              </div>
            </div>
            <button className="quiet-button" onClick={() => void signOut()}>
              Log out
            </button>
          </div>
        </header>
        {message && (
          <p className="admin-message" role="status">
            {message}
          </p>
        )}
        {page === 'overview' && (
          <OverviewPage
            user={user}
            products={products}
            orders={orders}
            newRequests={newRequests}
            openOrders={() => showPage('orders')}
          />
        )}
        {page === 'products' && (
          <ProductsPage
            products={products}
            form={form}
            setForm={setForm}
            saving={saving}
            can={can}
            addProduct={addProduct}
            refresh={refresh}
            setProductStatus={setProductStatus}
            setProductAvailability={setProductAvailability}
          />
        )}
        {page === 'orders' && (
          <OrdersPage
            orders={orders}
            fulfillment={fulfillment}
            selected={selected}
            setSelected={setSelected}
            batchStatus={batchStatus}
            setBatchStatus={setBatchStatus}
            saving={saving}
            can={can}
            refresh={refresh}
            processBatch={processBatch}
            setOrderStatus={setOrderStatus}
            setOrderFulfillment={setOrderFulfillment}
          />
        )}
        {page === 'permissions' && (
          <PermissionsPage
            permissions={permissions}
            saving={saving}
            savePermissions={savePermissions}
            togglePermission={togglePermission}
          />
        )}
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';

const API = 'http://127.0.0.1:4000/api';
type User = { id: string; email: string; name: string; role: string; permissions: string[] };
type Product = { id: string; name: string; category: string; price: number; size: string; status: 'draft' | 'published' | 'archived'; availability: string };
type Order = { id: string; createdAt: string; status: string; name: string; phone: string; address: string; pincode: string; items: { name: string; quantity: number; unitPrice: number }[]; total: number; paymentPreference: string };
type Fulfillment = { orderId: string; source: 'supplier' | 'own_stock'; supplierName: string; trackingNumber: string };
type Page = 'overview' | 'products' | 'orders' | 'permissions';
type PermissionMap = Record<string, string[]>;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('agricom-admin-token');
  const headers: Record<string, string> = { 'content-type': 'application/json', ...options.headers as Record<string, string> };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

const pageNames: Record<Page, string> = { overview: 'Overview', products: 'Products', orders: 'Incoming requests', permissions: 'Permissions' };

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
  const [form, setForm] = useState({ name: '', category: 'Plant nutrition', price: '', size: '', brand: '', crop: 'Cotton, Chilli', description: '', fulfillmentSource: 'supplier' });

  async function refresh() {
    try {
      const tasks: Promise<unknown>[] = [];
      if (user?.permissions.includes('catalog.read')) tasks.push(request<{ products: Product[] }>('/catalog/admin/products').then((data) => setProducts(data.products)));
      if (user?.permissions.includes('orders.read')) tasks.push(request<{ orders: Order[] }>('/admin/orders').then(async (data) => {
        setOrders(data.orders);
        if (user.permissions.includes('fulfillment.manage')) {
          const records = await Promise.all(data.orders.map(async (order) => {
            try { const result = await request<{ fulfillment: Fulfillment | null }>(`/fulfillment/admin/orders/${encodeURIComponent(order.id)}`); return [order.id, result.fulfillment] as const; }
            catch { return [order.id, null] as const; }
          }));
          setFulfillment(Object.fromEntries(records.filter((row): row is readonly [string, Fulfillment] => row[1] !== null)));
        }
      }));
      if (user?.permissions.includes('permissions.manage')) tasks.push(request<{ permissions: PermissionMap }>('/auth/admin/permissions').then((data) => setPermissions(data.permissions)));
      await Promise.all(tasks); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not refresh admin data.'); }
  }

  useEffect(() => {
    const token = sessionStorage.getItem('agricom-admin-token');
    if (!token) { setAuthReady(true); return; }
    request<{ user: User }>('/auth/me').then(({ user: current }) => {
      if (current.role === 'customer') throw new Error('Use the customer sign-in page for customer accounts.');
      setUser(current);
    }).catch(() => sessionStorage.removeItem('agricom-admin-token')).finally(() => setAuthReady(true));
  }, []);
  useEffect(() => { if (user) void refresh(); }, [user]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setLoginError('');
    try {
      const result = await request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(login) });
      if (result.user.role === 'customer') throw new Error('This is a customer account. Sign in from the storefront instead.');
      sessionStorage.setItem('agricom-admin-token', result.token); setUser(result.user);
    } catch (error) { sessionStorage.removeItem('agricom-admin-token'); setLoginError(error instanceof Error ? error.message : 'Could not sign in.'); }
  }
  async function signOut() {
    try { await request('/auth/logout', { method: 'POST' }); } catch { /* The local session can still be cleared if the service is unavailable. */ }
    sessionStorage.removeItem('agricom-admin-token'); setUser(null); setProducts([]); setOrders([]); setPage('overview');
  }
  async function addProduct(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      await request('/catalog/admin/products', { method: 'POST', body: JSON.stringify({ ...form, price: Number(form.price), crop: form.crop.split(',').map((crop) => crop.trim()).filter(Boolean) }) });
      setForm({ name: '', category: 'Plant nutrition', price: '', size: '', brand: '', crop: 'Cotton, Chilli', description: '', fulfillmentSource: 'supplier' });
      setMessage('Product saved as a draft. Review it, then publish it.'); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save product.'); }
    finally { setSaving(false); }
  }
  async function setProductStatus(product: Product, status: Product['status']) {
    try { await request(`/catalog/admin/products/${encodeURIComponent(product.id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update product.'); }
  }
  async function setOrderStatus(order: Order, status: string) {
    try { await request(`/admin/orders/${encodeURIComponent(order.id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update order.'); }
  }
  async function setOrderFulfillment(order: Order, changes: Partial<Omit<Fulfillment, 'orderId'>>) {
    const previous = fulfillment[order.id];
    const source = changes.source || previous?.source;
    if (!source) { setMessage('Choose a fulfilment source before adding supplier or tracking details.'); return; }
    try { await request(`/fulfillment/admin/orders/${encodeURIComponent(order.id)}`, { method: 'PUT', body: JSON.stringify({ source, supplierName: changes.supplierName ?? previous?.supplierName ?? '', trackingNumber: changes.trackingNumber ?? previous?.trackingNumber ?? '' }) }); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save fulfilment source.'); }
  }
  async function processBatch() {
    if (!selected.length) return;
    setSaving(true);
    try { await request('/admin/orders/batch', { method: 'PATCH', body: JSON.stringify({ ids: selected, status: batchStatus }) }); setSelected([]); setMessage(`${selected.length} order request(s) updated.`); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Batch update failed.'); }
    finally { setSaving(false); }
  }
  async function savePermissions() {
    setSaving(true);
    try { const result = await request<{ permissions: PermissionMap }>('/auth/admin/permissions', { method: 'PUT', body: JSON.stringify({ permissions }) }); setPermissions(result.permissions); setMessage('Role permissions saved.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save permissions.'); }
    finally { setSaving(false); }
  }
  function togglePermission(role: string, permission: string) {
    setPermissions((current) => {
      const currentList = current[role] || [];
      return { ...current, [role]: currentList.includes(permission) ? currentList.filter((item) => item !== permission) : [...currentList, permission] };
    });
  }

  const can = (permission: string) => Boolean(user?.permissions.includes(permission));
  const newRequests = useMemo(() => orders.filter((order) => order.status === 'new_request').length, [orders]);
  if (!authReady) return <div className="auth-loading">Checking local session…</div>;
  if (!user) return <main className="admin-login-page"><section className="admin-login-art"><span className="admin-brand">AgriCom</span><p className="eyebrow">OWNER WORKSPACE</p><h1>Good decisions<br/>start with a clear view.</h1><p>Manage product drafts, order requests and fulfilment from one place.</p><div className="login-leaf">✳</div></section><section className="admin-login-panel"><div className="login-card"><p className="eyebrow">LOCAL TEST ADMIN</p><h2>Sign in</h2><p>Use a demo account to preview role permissions and admin workflows.</p><form onSubmit={signIn} className="product-form"><label>Email<input type="email" autoComplete="username" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })}/></label><label>Password<input type="password" autoComplete="current-password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })}/></label>{loginError && <p className="admin-message error-message" role="alert">{loginError}</p>}<button className="primary-button">Sign in to admin</button></form><div className="demo-credentials"><b>Demo owner credentials</b><span>admin@agricom.local</span><code>AgriComAdmin2026!</code><small>Local testing only. Do not deploy this login or password.</small></div></div></section></main>;

  const showPage = (selectedPage: Page) => {
    if (selectedPage === 'products' && !can('catalog.read')) return;
    if (selectedPage === 'orders' && !can('orders.read')) return;
    if (selectedPage === 'permissions' && !can('permissions.manage')) return;
    setPage(selectedPage);
  };
  return <div className="admin-layout">
    <aside className="admin-sidebar"><div className="sidebar-brand"><span className="brand-dot">✳</span><div><b>AgriCom</b><small>ADMIN WORKSPACE</small></div></div><nav aria-label="Admin sections"><span className="nav-caption">WORKSPACE</span><button className={page==='overview'?'nav-item active':'nav-item'} onClick={() => showPage('overview')}>▦ <span>Overview</span></button>{can('catalog.read')&&<button className={page==='products'?'nav-item active':'nav-item'} onClick={() => showPage('products')}>◇ <span>Products</span></button>}{can('orders.read')&&<button className={page==='orders'?'nav-item active':'nav-item'} onClick={() => showPage('orders')}>▤ <span>Incoming requests</span>{newRequests>0&&<i>{newRequests}</i>}</button>}{can('permissions.manage')&&<button className={page==='permissions'?'nav-item active':'nav-item'} onClick={() => showPage('permissions')}>⚙ <span>Permissions</span></button>}</nav><div className="sidebar-bottom"><span className="local-pill">Local test only</span><small>Private preview · no live payments</small></div></aside>
    <section className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">AGRICOM OPERATIONS</span><h1>{pageNames[page]}</h1></div><div className="user-controls"><div className="user-chip"><span>{user.name.slice(0,1)}</span><div><b>{user.name}</b><small>{user.role.replaceAll('_',' ')}</small></div></div><button className="quiet-button" onClick={() => void signOut()}>Log out</button></div></header>
      {message && <p className="admin-message" role="status">{message}</p>}
      {page==='overview'&&<section className="dashboard-content"><p className="welcome-copy">Welcome back, {user.name.split(' ')[0]}. Here’s the current local test activity.</p><div className="stat-grid"><article className="stat-card"><span>Published products</span><b>{products.filter((item)=>item.status==='published').length}</b><small>Visible in the storefront catalog</small></article><article className="stat-card"><span>Draft products</span><b>{products.filter((item)=>item.status==='draft').length}</b><small>Waiting for review</small></article><article className="stat-card"><span>New requests</span><b>{newRequests}</b><small>Need availability checks</small></article><article className="stat-card"><span>All order requests</span><b>{orders.length}</b><small>Saved by the local Orders service</small></article></div><div className="admin-card overview-card"><div><p className="eyebrow">NEXT STEP</p><h2>Review stock before confirming</h2><p>Check supplier availability and delivery for the customer’s PIN, then move the request through its status steps.</p></div><button className="primary-button" onClick={()=>showPage('orders')}>Open order requests</button></div></section>}
      {page==='products'&&<div className="admin-grid"><section className="admin-card"><div className="card-heading"><div><p className="eyebrow">CATALOG SERVICE</p><h2>Add a product</h2></div></div><form className="product-form" onSubmit={addProduct}><label>Product name<input required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></label><div className="two-col"><label>Category<select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}><option>Plant nutrition</option><option>Pest management</option><option>Disease management</option><option>Soil health</option></select></label><label>Price (₹)<input required min="1" type="number" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})}/></label></div><div className="two-col"><label>Pack size<input required placeholder="e.g. 500 ml" value={form.size} onChange={(e)=>setForm({...form,size:e.target.value})}/></label><label>Brand<input value={form.brand} onChange={(e)=>setForm({...form,brand:e.target.value})}/></label></div><label>Crops, separated by commas<input value={form.crop} onChange={(e)=>setForm({...form,crop:e.target.value})}/></label><label>Default fulfilment<select value={form.fulfillmentSource} onChange={(e)=>setForm({...form,fulfillmentSource:e.target.value})}><option value="supplier">Supplier ships</option><option value="own_stock">AgriCom stock</option></select></label><label>Product description<textarea rows={3} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></label><button className="primary-button" disabled={saving}>{saving?'Saving…':'Save as draft'}</button></form></section><section className="admin-card"><div className="card-heading"><div><p className="eyebrow">CATALOG</p><h2>Review before publishing</h2></div><button className="quiet-button" onClick={()=>void refresh()}>Refresh</button></div><div className="list">{products.map((product)=><article className="list-row" key={product.id}><div><b>{product.name}</b><small>{product.category} · {product.size} · ₹{product.price}</small></div><span className={`status status-${product.status}`}>{product.status}</span>{product.status==='draft'&&<button className="small-button" onClick={()=>void setProductStatus(product,'published')}>Publish</button>}{product.status==='published'&&<button className="small-button" onClick={()=>void setProductStatus(product,'draft')}>Unpublish</button>}</article>)}</div></section></div>}
      {page==='orders'&&<section className="admin-card orders-card"><div className="card-heading"><div><p className="eyebrow">ORDERS SERVICE</p><h2>Incoming requests</h2><p className="section-subcopy">Review each request, check stock and delivery, then update its progress.</p></div><button className="quiet-button" onClick={()=>void refresh()}>Refresh</button></div>{can('orders.update')&&<div className="batch-bar"><label><input type="checkbox" checked={orders.length>0&&selected.length===orders.length} onChange={(e)=>setSelected(e.target.checked?orders.map((order)=>order.id):[])}/> Select all</label><span>{selected.length} selected</span><select value={batchStatus} onChange={(e)=>setBatchStatus(e.target.value)}>{['checking_availability','confirmed','awaiting_payment','ready_to_dispatch','dispatched','delivered','cancelled'].map((status)=><option key={status} value={status}>{status.replaceAll('_',' ')}</option>)}</select><button className="small-button" disabled={!selected.length||saving} onClick={()=>void processBatch()}>{saving?'Processing…':'Apply to selected'}</button></div>}{orders.length?<div className="list">{orders.map((order)=><article className="order-row" key={order.id}><div className="order-top">{can('orders.update')&&<input type="checkbox" checked={selected.includes(order.id)} onChange={(e)=>setSelected(e.target.checked?[...selected,order.id]:selected.filter((id)=>id!==order.id))} aria-label={`Select ${order.id}`}/>}<div><b>{order.id}</b><small>{order.name} · {order.phone} · PIN {order.pincode}</small></div><b>₹{order.total.toLocaleString('en-IN')}</b></div><p>{order.items.map((item)=>`${item.name} × ${item.quantity}`).join(' · ')}</p><div className="order-actions"><span className="status">{order.status.replaceAll('_',' ')}</span>{can('orders.update')&&<select value={order.status} onChange={(e)=>void setOrderStatus(order,e.target.value)} aria-label={`Update ${order.id} status`}>{['new_request','checking_availability','confirmed','awaiting_payment','ready_to_dispatch','dispatched','delivered','cancelled'].map((status)=><option key={status} value={status}>{status.replaceAll('_',' ')}</option>)}</select>}{can('fulfillment.manage')&&<select value={fulfillment[order.id]?.source||''} onChange={(e)=>void setOrderFulfillment(order,{source:e.target.value as Fulfillment['source']})} aria-label={`Set fulfilment source for ${order.id}`}><option value="" disabled>Choose fulfilment</option><option value="supplier">Supplier direct</option><option value="own_stock">AgriCom stock</option></select>}</div>{can('fulfillment.manage')&&fulfillment[order.id]&&<div className="fulfillment-details">{fulfillment[order.id].source==='supplier'&&<input key={`${order.id}-supplier-${fulfillment[order.id].supplierName}`} defaultValue={fulfillment[order.id].supplierName} placeholder="Supplier name" aria-label={`Supplier for ${order.id}`} onBlur={(e)=>{const value=e.target.value.trim();if(value!==fulfillment[order.id]?.supplierName)void setOrderFulfillment(order,{supplierName:value});}}/>}<input key={`${order.id}-tracking-${fulfillment[order.id].trackingNumber}`} defaultValue={fulfillment[order.id].trackingNumber} placeholder="Tracking number" aria-label={`Tracking number for ${order.id}`} onBlur={(e)=>{const value=e.target.value.trim();if(value!==fulfillment[order.id]?.trackingNumber)void setOrderFulfillment(order,{trackingNumber:value});}}/></div>}</article>)}</div>:<p className="empty-note">No order requests yet. New requests appear here after checkout.</p>}</section>}
      {page==='permissions'&&<section className="admin-card permissions-card"><div className="card-heading"><div><p className="eyebrow">ACCESS CONTROL</p><h2>Role permissions</h2><p className="section-subcopy">Choose what staff roles can do. The owner keeps full control.</p></div><button className="primary-button" disabled={saving} onClick={()=>void savePermissions()}>{saving?'Saving…':'Save permissions'}</button></div><div className="permission-matrix"><div className="permission-head"><span>Role</span><span>View catalog</span><span>Edit catalog</span><span>View requests</span><span>Update requests</span><span>Manage fulfilment</span></div>{(['operations','catalog_manager'] as const).map((role)=><div className="permission-row" key={role}><b>{role==='operations'?'Operations':'Catalog manager'}</b>{(['catalog.read','catalog.write','orders.read','orders.update','fulfillment.manage'] as const).map((permission)=><label key={permission} aria-label={`${role} ${permission}`}><input type="checkbox" checked={(permissions[role]||[]).includes(permission)} onChange={()=>togglePermission(role,permission)}/></label>)}</div>)}<div className="permission-row locked"><b>Owner</b>{['catalog.read','catalog.write','orders.read','orders.update','fulfillment.manage'].map((permission)=><label key={permission}><input type="checkbox" checked disabled aria-label={`Owner always has ${permission}`}/></label>)}</div><div className="permission-row locked"><b>Customer</b><span>Own order requests only</span><span>—</span><span>Own orders only</span><span>—</span><span>—</span></div></div><p className="permission-note">These demo roles are local test accounts. For a live admin, add real identity verification, audit history and secure account recovery.</p></section>}
    </section>
  </div>;
}

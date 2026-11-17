import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronRight, Copy, CreditCard, ShieldCheck } from 'lucide-react';
import { type OrderPayload, type Product } from '../data/products';
import { useCart } from '../store/cart';
import { useCatalog } from '../store/catalog';
import { apiRequest } from '../services/api';
import { useAuth } from '../store/auth';
import { storeConfig } from '../config/store';
import { money } from '../lib/format';

type CustomerForm = {
  name: string;
  phone: string;
  address: string;
  pincode: string;
  payment: 'UPI' | 'Cash on delivery';
};

export function CheckoutPage() {
  const products = useCatalog((state) => state.products);
  const customer = useAuth((state) => state.user);
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [form, setForm] = useState<CustomerForm>({ name: '', phone: '', address: '', pincode: '', payment: 'UPI' });
  const [error, setError] = useState('');
  const [done, setDone] = useState<OrderPayload | null>(null);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const mapped = items
    .map((line) => ({ product: products.find((p) => p.id === line.productId), quantity: line.quantity }))
    .filter((x) => x.product) as { product: Product; quantity: number }[];
  const subtotal = mapped.reduce((sum, x) => sum + x.product.price * x.quantity, 0);
  const total = subtotal + (subtotal > 0 && subtotal < storeConfig.freeShippingMinimum ? 90 : 0);
  useEffect(() => {
    if (done && storeConfig.upiId) {
      import('qrcode').then(({ default: QRCode }) =>
        QRCode.toDataURL(
          `upi://pay?pa=${encodeURIComponent(storeConfig.upiId)}&pn=${encodeURIComponent(storeConfig.upiPayeeName)}&am=${done.total.toFixed(2)}&cu=INR`,
        )
          .then(setQr)
          .catch(() => setQr('')),
      );
    }
  }, [done]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) {
      navigate('/login?next=/checkout');
      return;
    }
    if (mapped.length === 0) {
      navigate('/cart');
      return;
    }
    if (!form.name.trim()) {
      setError('Enter your name.');
      return;
    }
    if (!form.address.trim()) {
      setError('Enter your delivery address.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      setError('Enter a valid 6-digit PIN code.');
      return;
    }
    setError('');
    try {
      const result = await apiRequest<{ order: { id: string; createdAt: string; total: number } }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          paymentPreference: form.payment,
          items: mapped.map((x) => ({ productId: x.product.id, quantity: x.quantity })),
        }),
      });
      const order: OrderPayload = {
        ...form,
        id: result.order.id,
        createdAt: result.order.createdAt,
        items: mapped,
        total: result.order.total,
      };
      setDone(order);
      localStorage.setItem('agricom-last-order', JSON.stringify(order));
      const prior = JSON.parse(localStorage.getItem('agricom-orders') || '[]') as OrderPayload[];
      localStorage.setItem('agricom-orders', JSON.stringify([order, ...prior]));
      const message = [
        `Hello AgriCom, I'd like to place order ${order.id}.`,
        `Name: ${order.name}`,
        `Phone: ${order.phone}`,
        `Address: ${order.address}, PIN ${order.pincode}`,
        `Payment preference: ${order.payment}`,
        'Items:',
        ...mapped.map((x) => `• ${x.product.name} × ${x.quantity} — ${money(x.product.price * x.quantity)}`),
        `Estimated total: ${money(order.total)}`,
        'Please confirm availability, delivery and final charges.',
      ].join('\n');
      if (storeConfig.whatsappNumber)
        window.open(
          `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(message)}`,
          '_blank',
          'noopener,noreferrer',
        );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not submit the order request. Please try again.');
    }
  }
  async function copyUpi() {
    if (!storeConfig.upiId) return;
    await navigator.clipboard.writeText(storeConfig.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  if (done)
    return (
      <main className="wrap page-main">
        <div className="success-card">
          <span className="success-icon">
            <BadgeCheck size={33} />
          </span>
          <span className="eyebrow">ORDER REQUEST PREPARED</span>
          <h1>Thank you, {done.name.split(' ')[0]}.</h1>
          <p>
            Your order request <b>{done.id}</b> is ready. Please confirm it with AgriCom on WhatsApp. The store team
            will verify availability, delivery and final charges.
          </p>
          {storeConfig.whatsappNumber ? (
            <a
              className="btn btn-primary"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(`Hello AgriCom, I am following up on order ${done.id}.`)}`}
            >
              Continue in WhatsApp <ArrowRight size={17} />
            </a>
          ) : (
            <p className="notice">
              Set the WhatsApp number in <code>frontend/src/config/store.ts</code> to receive order requests.
            </p>
          )}
          {done.payment === 'UPI' && (
            <div className="payment-box">
              <h2>UPI payment</h2>
              {storeConfig.upiId ? (
                <>
                  <p>Scan with a UPI app and verify the payee and amount before paying.</p>
                  {qr && <img className="upi-qr" src={qr} alt="UPI payment QR code" />}
                  <b>{money(done.total)}</b>
                  <div className="copy-upi">
                    <code>{storeConfig.upiId}</code>
                    <button className="btn btn-outline" onClick={copyUpi}>
                      <Copy size={15} />
                      {copied ? 'Copied' : 'Copy UPI ID'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="notice">
                  UPI details will appear here once the store UPI ID is configured. Please confirm payment instructions
                  with AgriCom.
                </p>
              )}
            </div>
          )}
          <button
            className="text-link"
            onClick={() => {
              clear();
              navigate('/shop');
            }}
          >
            Continue shopping <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  return (
    <main className="wrap page-main">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/cart">Cart</Link>
        <ChevronRight size={14} />
        <span>Checkout</span>
      </div>
      <div className="shop-heading">
        <div>
          <span className="eyebrow">ALMOST THERE</span>
          <h1>Delivery & payment</h1>
          <p>No account needed. We’ll confirm your order with you.</p>
        </div>
      </div>
      <form className="checkout-layout" onSubmit={submit} noValidate>
        <section className="checkout-form">
          <div className="form-card">
            <h2>1. Your details</h2>
            <div className="form-grid">
              <label>
                Farmer / customer name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                  placeholder="Your full name"
                />
              </label>
              <label>
                Mobile number
                <input
                  required
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                />
              </label>
              <label className="span-two">
                Delivery address
                <textarea
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  autoComplete="street-address"
                  placeholder="Village, street, mandal / town, district"
                  rows={3}
                />
              </label>
              <label>
                PIN code
                <input
                  required
                  inputMode="numeric"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  autoComplete="postal-code"
                  placeholder="6-digit PIN code"
                />
              </label>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="form-card">
            <h2>2. Choose how to pay</h2>
            <label className={`payment-option ${form.payment === 'UPI' ? 'selected' : ''}`}>
              <input
                type="radio"
                checked={form.payment === 'UPI'}
                onChange={() => setForm({ ...form, payment: 'UPI' })}
              />
              <span className="payment-icon">▦</span>
              <span>
                <b>UPI payment</b>
                <small>Pay with your UPI app after confirming your order</small>
              </span>
            </label>
            <label className={`payment-option ${form.payment === 'Cash on delivery' ? 'selected' : ''}`}>
              <input
                type="radio"
                checked={form.payment === 'Cash on delivery'}
                onChange={() => setForm({ ...form, payment: 'Cash on delivery' })}
              />
              <span className="payment-icon">
                <CreditCard />
              </span>
              <span>
                <b>Cash on delivery</b>
                <small>Pay when your order arrives, where available</small>
              </span>
            </label>
          </div>
          <p className="checkout-smallprint">
            <ShieldCheck size={16} /> Submitting creates an order request. The store confirms stock, delivery
            eligibility and any applicable charges before fulfillment.
          </p>
        </section>
        <aside className="summary-card checkout-summary">
          <h2>Order summary</h2>
          {mapped.map((x) => (
            <div className="checkout-line" key={x.product.id}>
              <span>
                {x.product.name} <small>× {x.quantity}</small>
              </span>
              <b>{money(x.product.price * x.quantity)}</b>
            </div>
          ))}
          <div className="summary-total">
            <span>Order total</span>
            <b>{money(total)}</b>
          </div>
          <button type="submit" className="btn btn-primary full-btn">
            Place order request <ArrowRight size={17} />
          </button>
          <p className="secure-note">
            <ShieldCheck size={14} /> Secure checkout · No login needed
          </p>
        </aside>
      </form>
    </main>
  );
}

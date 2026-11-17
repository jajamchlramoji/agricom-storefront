import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
import { maxQuantity } from '../data/products';
import { useCart } from '../store/cart';
import { useCatalog } from '../store/catalog';
import { storeConfig } from '../config/store';
import { copy, type Language } from '../i18n';
import { money } from '../lib/format';

export function CartPage({ lang }: { lang: Language }) {
  const products = useCatalog((state) => state.products);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const mapped = items
    .map((item) => ({ line: item, product: products.find((p) => p.id === item.productId) }))
    .filter((x) => x.product);
  const subtotal = mapped.reduce((sum, x) => sum + x.product!.price * x.line.quantity, 0);
  const delivery = subtotal === 0 || subtotal >= storeConfig.freeShippingMinimum ? 0 : 90;
  return (
    <main className="wrap page-main">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>Cart</span>
      </div>
      <div className="page-title-row">
        <div>
          <span className="eyebrow">YOUR SELECTION</span>
          <h1>{copy[lang].cart}</h1>
        </div>
        <Link to="/shop" className="text-link">
          <ArrowLeft size={16} /> Continue shopping
        </Link>
      </div>
      {mapped.length === 0 ? (
        <div className="empty-cart">
          <span className="empty-bag">
            <ShoppingBag size={35} />
          </span>
          <h2>{copy[lang].empty}</h2>
          <p>Browse our field essentials and find products for the season ahead.</p>
          <Link to="/shop" className="btn btn-primary">
            Explore products <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            <div className="cart-list-head">
              Your items{' '}
              <span>
                {mapped.length} {copy[lang].items}
              </span>
            </div>
            {mapped.map(({ line, product }) => (
              <article className="cart-item" key={product!.id}>
                <Link to={`/product/${product!.id}`} className="cart-image">
                  <img src={product!.image} alt="" />
                </Link>
                <div className="cart-item-info">
                  <Link to={`/product/${product!.id}`}>
                    <b>{product!.name}</b>
                  </Link>
                  <small>
                    {product!.category} · {product!.size}
                  </small>
                  <button className="remove-btn" onClick={() => remove(product!.id)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
                <div className="cart-item-end">
                  <strong>{money(product!.price * line.quantity)}</strong>
                  <div className="stepper">
                    <button onClick={() => setQty(product!.id, line.quantity - 1)} aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <b>{line.quantity}</b>
                    <button
                      onClick={() => setQty(product!.id, Math.min(maxQuantity, line.quantity + 1))}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <div className="shipping-note">
              <Truck size={18} />
              <span>Delivery fee is calculated from the cart total. Please confirm service for your PIN.</span>
            </div>
          </section>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <div>
              <span>{copy[lang].subtotal}</span>
              <b>{money(subtotal)}</b>
            </div>
            <div>
              <span>{copy[lang].delivery}</span>
              <b>{delivery === 0 ? 'Free' : money(delivery)}</b>
            </div>
            {subtotal < storeConfig.freeShippingMinimum && (
              <div className="free-ship-msg">
                Add {money(storeConfig.freeShippingMinimum - subtotal)} more for free delivery
              </div>
            )}
            <div className="summary-total">
              <span>{copy[lang].total}</span>
              <b>{money(subtotal + delivery)}</b>
            </div>
            <Link to="/checkout" className="btn btn-primary full-btn">
              {copy[lang].checkout} <ArrowRight size={17} />
            </Link>
            <p className="secure-note">
              <ShieldCheck size={14} /> No account needed. Pay by UPI or cash on delivery.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

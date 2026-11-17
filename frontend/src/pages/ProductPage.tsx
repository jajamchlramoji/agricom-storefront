import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShieldCheck, ShoppingBag, ShoppingCart, Star, Truck } from 'lucide-react';
import { canOrder, maxQuantity, type Product } from '../data/products';
import { useCart } from '../store/cart';
import { useCatalog } from '../store/catalog';
import { storeConfig } from '../config/store';
import { copy, type Language } from '../i18n';
import { money } from '../lib/format';
import { ProductCard } from '../components/ProductCard';

export function ProductPage({ lang }: { lang: Language }) {
  const products = useCatalog((state) => state.products);
  const { id } = useParams();
  const p = products.find((item) => item.id === id);
  const add = useCart((s) => s.add);
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState('');
  if (!p)
    return (
      <main className="wrap page-main">
        <div className="empty-state">
          <h1>We couldn't find that product</h1>
          <Link to="/shop" className="btn btn-primary">
            Browse products
          </Link>
        </div>
      </main>
    );
  const product: Product = p;
  const related = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
  function buyWhatsApp() {
    const msg = `Hello AgriCom, I'm interested in ${product.name} (${product.size}) x ${qty}. Please confirm availability and delivery.`;
    if (!storeConfig.whatsappNumber) {
      setNotice('WhatsApp contact is not set up yet. Please use the Contact page.');
      return;
    }
    window.open(
      `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }
  return (
    <main className="wrap page-main">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop">Products</Link>
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </div>
      <section className="product-detail">
        <div className="detail-gallery">
          <div className="detail-main-image">
            <img src={product.image} alt={`${product.name} illustrative placeholder`} />
          </div>
          <div className="image-caption">Illustrative image · replace with verified product packaging</div>
        </div>
        <div className="detail-info">
          <span className="eyebrow">{product.category.toUpperCase()}</span>
          <h1>{lang === 'te' ? product.localName : product.name}</h1>
          <div className="detail-rating">
            <span className="rating">
              <Star size={15} fill="currentColor" /> {product.rating}/5 sample rating
            </span>{' '}
            · {product.reviews} sample ratings
          </div>
          <div className="detail-price">
            {money(product.price)} {product.compareAt && <del>{money(product.compareAt)}</del>}{' '}
            <small>Inclusive of applicable taxes*</small>
          </div>
          <div className="detail-rule" />
          <p className="detail-description">{product.description}</p>
          <div className="detail-pack">
            <span>Pack size</span>
            <b>{product.size}</b>
          </div>
          <div className="stock-line">
            <span className="stock-dot" /> {canOrder(product) ? 'Available to order' : 'Currently unavailable'}{' '}
            <small>· We confirm stock before payment</small>
          </div>
          <div className="quantity-control">
            <span>Quantity</span>
            <div>
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">
                <Minus size={17} />
              </button>
              <b>{qty}</b>
              <button onClick={() => setQty(Math.min(maxQuantity, qty + 1))} aria-label="Increase quantity">
                <Plus size={17} />
              </button>
            </div>
            <small>Up to {maxQuantity} per order request</small>
          </div>
          {notice && <p className="notice">{notice}</p>}
          <div className="detail-actions">
            <button
              className="btn btn-primary"
              disabled={!canOrder(product)}
              onClick={() => {
                add(product.id, qty);
                navigate('/cart');
              }}
            >
              <ShoppingBag size={18} />
              {copy[lang].buy} · {money(product.price * qty)}
            </button>
            <button
              className="btn btn-outline"
              disabled={!canOrder(product)}
              onClick={() => {
                add(product.id, qty);
                setNotice(`${qty} added to your cart`);
                setTimeout(() => setNotice(''), 1600);
              }}
            >
              <ShoppingCart size={18} />
              {copy[lang].add}
            </button>
            <button className="btn btn-whatsapp" onClick={buyWhatsApp}>
              WhatsApp enquiry
            </button>
          </div>
          <div className="detail-assurance">
            <div>
              <Truck size={18} />
              <span>
                Delivery by PIN code<small>Enter your PIN at the top</small>
              </span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>
                Use as labeled<small>Follow approved product directions</small>
              </span>
            </div>
          </div>
          <div className="detail-disclaimer">
            *Price, tax, product registration and claims must be reviewed against the verified product listing before
            launch.
          </div>
        </div>
      </section>
      <section className="details-tabs">
        <div className="tabs-title">Product information</div>
        <div className="info-columns">
          <div>
            <h3>About this product</h3>
            <p>{product.description}</p>
            <h3>Crop application</h3>
            <p>
              Listed for: {product.crop.join(', ')}. Confirm crop approval on the product's original label before
              purchase or use.
            </p>
          </div>
          <div>
            <h3>Ingredients</h3>
            <p>{product.ingredients}</p>
            <h3>Usage guidance</h3>
            <p>{product.usage}</p>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="section related-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">KEEP EXPLORING</span>
              <h2>More in {product.category.toLowerCase()}</h2>
            </div>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

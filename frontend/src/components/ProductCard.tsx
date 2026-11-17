import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Heart, Plus, Star } from 'lucide-react';
import { canOrder, type Product } from '../data/products';
import { useCart } from '../store/cart';
import { copy, type Language } from '../i18n';
import { money } from '../lib/format';

export function ProductCard({ product, lang }: { product: Product; lang: Language }) {
  const add = useCart((s) => s.add);
  const t = copy[lang];
  const [added, setAdded] = useState(false);
  function addToCart() {
    add(product.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }
  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-link">
        <img
          className="product-image"
          src={product.image}
          alt={`${product.name} illustrative botanical placeholder`}
          loading="lazy"
        />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          className="wishlist"
          aria-label={`Save ${product.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.currentTarget.classList.toggle('liked');
          }}
        >
          <Heart size={17} />
        </button>
      </Link>
      <div className="product-info">
        <div className="product-meta">
          <span>{product.category}</span>
          <span className="rating">
            <Star size={13} fill="currentColor" /> {product.rating}/5 <small>sample</small>
          </span>
        </div>
        <Link to={`/product/${product.id}`} className="product-name">
          {lang === 'te' ? product.localName : product.name}
        </Link>
        <div className="product-size">Pack size · {product.size}</div>
        <div className="product-bottom">
          <div>
            <strong className="price">{money(product.price)}</strong>
            {product.compareAt && <del>{money(product.compareAt)}</del>}
          </div>
          <button
            className="add-btn"
            disabled={!canOrder(product)}
            onClick={addToCart}
            aria-label={`${t.add}: ${product.name}`}
          >
            {added ? <BadgeCheck size={19} /> : <Plus size={19} />}
            <span>{added ? 'Added' : t.add}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronRight, Headphones, Leaf, ShieldCheck, Truck, Wheat } from 'lucide-react';
import { categories } from '../data/products';
import { useCatalog } from '../store/catalog';
import { copy, type Language } from '../i18n';
import { ProductCard } from '../components/ProductCard';

export function HomePage({ lang }: { lang: Language }) {
  const products = useCatalog((state) => state.products);
  const t = copy[lang];
  const featured = products.slice(0, 4);
  const cropRows = [
    ['Cotton', 'Cotton fields', '🌱'],
    ['Chilli', 'Chilli farms', '🌶️'],
    ['Paddy', 'Paddy fields', '🌾'],
    ['Vegetables', 'Vegetables', '🥬'],
  ];
  return (
    <main>
      <section className="hero-section">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> {t.offer}
            </div>
            <h1>
              {t.heroTitle}
              <br />
              <em>Rooted in care.</em>
            </h1>
            <p>{t.heroText}</p>
            <div className="hero-buttons">
              <Link to="/shop" className="btn btn-primary">
                Explore products <ArrowRight size={17} />
              </Link>
              <a href="#how-we-help" className="text-link">
                Why AgriCom? <ChevronRight size={16} />
              </a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span>🌿</span>
                <span>🌾</span>
                <span>👨🏽‍🌾</span>
              </div>
              <span>
                <b>Built around your field</b>
                <small>Reliable support, every season</small>
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-circle" />
            <div className="art-sun" />
            <img src={products[0].image} alt="Illustrated botanical leaves" />
            <div className="hero-tag tag-one">
              <span>✦</span>
              <div>
                <b>Thoughtfully selected</b>
                <small>Field essentials</small>
              </div>
            </div>
            <div className="hero-tag tag-two">
              <span>🌿</span>
              <div>
                <b>Crop care, made clear</b>
                <small>Guidance you can trust</small>
              </div>
            </div>
            <div className="hero-caption">HERITAGE BOTANICAL COLLECTION · 01</div>
          </div>
        </div>
      </section>
      <div className="wrap trust-strip">
        <div>
          <ShieldCheck />
          <span>
            <b>Genuine products</b>
            <small>Source details shown clearly</small>
          </span>
        </div>
        <div>
          <Truck />
          <span>
            <b>Rural delivery</b>
            <small>Check service by PIN code</small>
          </span>
        </div>
        <div>
          <Headphones />
          <span>
            <b>Farmer-first support</b>
            <small>Talk to our team</small>
          </span>
        </div>
        <div>
          <Leaf />
          <span>
            <b>Useful crop guidance</b>
            <small>Always follow product labels</small>
          </span>
        </div>
      </div>
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CARE FOR EVERY ACRE</span>
            <h2>{t.categories}</h2>
          </div>
          <Link to="/shop" className="text-link">
            {t.viewAll} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((c, i) => (
            <Link key={c.id} to={`/shop?category=${encodeURIComponent(c.id)}`} className={`category-tile ${c.color}`}>
              <span className="category-icon">{c.icon}</span>
              <span>
                <b>{c.label}</b>
                <small>
                  {['Balanced nutrition', 'Thoughtful protection', 'Healthy leaves', 'Build living soil'][i]}
                </small>
              </span>
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>
      </section>
      <section className="crop-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MADE FOR YOUR FIELD</span>
              <h2>{t.crops}</h2>
            </div>
            <span className="subtle">Find care for the crop you grow</span>
          </div>
          <div className="crop-row">
            {cropRows.map(([crop, label, emoji]) => (
              <Link className="crop-card" key={crop} to={`/shop?crop=${crop}`}>
                <span>{emoji}</span>
                <b>{crop}</b>
                <small>{label}</small>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SELECTED FOR THE SEASON</span>
            <h2>{t.featured}</h2>
          </div>
          <Link to="/shop" className="text-link">
            {t.viewAll} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="product-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} lang={lang} />
          ))}
        </div>
      </section>
      <section className="promo-band wrap">
        <div>
          <span className="eyebrow">CARE THAT GROWS WITH YOU</span>
          <h2>
            Good advice is part
            <br />
            of a good harvest.
          </h2>
          <p>Speak with our team about products, delivery and field questions.</p>
          <Link to="/contact" className="btn btn-light">
            Talk to AgriCom <ArrowRight size={16} />
          </Link>
        </div>
        <div className="promo-plant">🌿</div>
      </section>
      <section className="section values-section" id="how-we-help">
        <div className="wrap">
          <div className="section-heading centered">
            <div>
              <span className="eyebrow">THE AGRICOM PROMISE</span>
              <h2>
                Carefully chosen.
                <br />
                Clearly explained.
              </h2>
            </div>
          </div>
          <div className="values-grid">
            <div>
              <span>
                <BadgeCheck />
              </span>
              <h3>Know what you're buying</h3>
              <p>See pack sizes, product details and supplier information before placing an order.</p>
            </div>
            <div>
              <span>
                <Wheat />
              </span>
              <h3>Made for Indian crops</h3>
              <p>Explore products by cotton, chilli, paddy and other crops you grow.</p>
            </div>
            <div>
              <span>
                <Headphones />
              </span>
              <h3>Here when you need us</h3>
              <p>Get in touch for help. Always use products according to their approved labels.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

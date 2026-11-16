import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, Search, ShoppingCart, Sprout, UserRound } from 'lucide-react';
import { categories } from '../data/products';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { copy, type Language } from '../i18n';

export function Header({ lang, setLang }: { lang: Language; setLang: (lang: Language) => void }) {
  const t = copy[lang];
  const count = useCart((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const customer = useAuth((s) => s.user);
  const [pin, setPin] = useState(localStorage.getItem('agricom-pin') || '');
  const [pinSaved, setPinSaved] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => setQuery(new URLSearchParams(location.search).get('q') || ''), [location.search]);
  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(query)}`);
  }
  return (
    <>
      <div className="topline">
        <div className="wrap topline-inner">
          <button
            className="pin-btn"
            onClick={() => {
              const next = window.prompt('Enter your 6-digit delivery PIN code', pin);
              if (next && /^\d{6}$/.test(next)) {
                setPin(next);
                localStorage.setItem('agricom-pin', next);
                setPinSaved(true);
              }
            }}
            aria-label="Set delivery PIN"
          >
            <MapPin size={15} />
            <span>{pin ? `${t.location} ${pin.slice(0, 2)}••••` : 'Set delivery PIN'}</span>
            <ChevronDown size={13} />
          </button>
          <span className="topline-note">
            {pinSaved ? 'PIN saved on this device' : 'Delivery availability depends on your PIN'}
          </span>
          <label className="language-select">
            <span className="sr-only">{t.language}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as Language)} aria-label={t.language}>
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>
          </label>
        </div>
      </div>
      <header className="header">
        <div className="wrap header-inner">
          <Link to="/" className="brand" aria-label="AgriCom home">
            <span className="brand-mark">
              <Sprout size={23} />
            </span>
            <span>
              <strong>AgriCom</strong>
              <small>GROW WITH CONFIDENCE</small>
            </span>
          </Link>
          <form className="searchbox" role="search" onSubmit={submitSearch}>
            <Search size={18} />
            <input
              placeholder={t.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t.search}
            />
            <button type="submit" className="search-submit">
              Search
            </button>
          </form>
          <div className="header-actions">
            <Link
              to={customer ? '/account' : '/login'}
              className="icon-link"
              aria-label={customer ? 'My orders' : 'Sign in'}
            >
              <UserRound size={21} />
              <span>{customer ? 'My orders' : 'Sign in'}</span>
            </Link>
            <Link to="/cart" className="icon-link cart-link" aria-label={`Cart, ${count} items`}>
              <ShoppingCart size={21} />
              <span>Cart</span>
              {count > 0 && <b className="count-badge">{count}</b>}
            </Link>
          </div>
        </div>
      </header>
      <nav className="category-nav">
        <div className="wrap category-nav-inner">
          <NavLink to="/shop" end>
            All products
          </NavLink>
          {categories.map((c) => (
            <NavLink key={c.id} to={`/shop?category=${encodeURIComponent(c.id)}`}>
              {c.label}
            </NavLink>
          ))}
          <NavLink to="/shop?crop=Cotton">Cotton care</NavLink>
          <NavLink to="/shop?crop=Chilli">Chilli care</NavLink>
        </div>
      </nav>
    </>
  );
}

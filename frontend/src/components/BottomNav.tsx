import { NavLink } from 'react-router-dom';
import { Home, Leaf, ShoppingBag, UserRound } from 'lucide-react';
import { useCart } from '../store/cart';

export function BottomNav() {
  const count = useCart((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const tabs = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/shop', label: 'Products', icon: Leaf },
    { to: '/cart', label: 'Cart', icon: ShoppingBag },
    { to: '/account', label: 'Account', icon: UserRound },
  ];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink to={to} end={to === '/'} key={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="bottom-icon">
            <Icon size={20} />
            {label === 'Cart' && count > 0 && <b>{count}</b>}
          </span>
          <small>{label}</small>
        </NavLink>
      ))}
    </nav>
  );
}

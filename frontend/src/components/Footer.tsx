import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Link to="/" className="brand footer-brand">
            <span className="brand-mark">
              <Sprout size={22} />
            </span>
            <span>
              <strong>AgriCom</strong>
              <small>GROW WITH CONFIDENCE</small>
            </span>
          </Link>
          <p>Thoughtful crop care and farm essentials, rooted in the needs of Indian fields.</p>
        </div>
        <div>
          <b>Explore</b>
          <Link to="/shop">All products</Link>
          <Link to="/shop?crop=Cotton">Cotton care</Link>
          <Link to="/shop?crop=Chilli">Chilli care</Link>
          <Link to="/account">My orders</Link>
        </div>
        <div>
          <b>Need help?</b>
          <Link to="/contact">Contact us</Link>
          <Link to="/faq">Common questions</Link>
          <Link to="/shipping-policy">Shipping information</Link>
          <Link to="/about">About AgriCom</Link>
        </div>
        <div className="footer-note">
          <span className="eyebrow">GROW RESPONSIBLY</span>
          <p>
            Always use agricultural inputs as directed on their original approved labels. Keep products away from
            children and animals.
          </p>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} AgriCom. All rights reserved.</span>
        <span>Starter storefront · Product details require verification</span>
      </div>
    </footer>
  );
}

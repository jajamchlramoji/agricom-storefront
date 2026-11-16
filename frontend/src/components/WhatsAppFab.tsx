import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleHelp, X } from 'lucide-react';

export function WhatsAppFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="help-fab" onClick={() => setOpen(!open)} aria-label="Open help options">
        {open ? <X size={22} /> : <CircleHelp size={22} />}
      </button>
      {open && (
        <div className="help-popover">
          <b>How can we help?</b>
          <p>Talk to AgriCom about products, delivery or orders.</p>
          <Link to="/contact" onClick={() => setOpen(false)} className="btn btn-primary">
            Contact support <ArrowRight size={15} />
          </Link>
          <Link to="/faq" onClick={() => setOpen(false)} className="help-faq">
            <CircleHelp size={15} /> Browse common questions
          </Link>
        </div>
      )}
    </>
  );
}

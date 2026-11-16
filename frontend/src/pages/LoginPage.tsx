import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/auth';

export function LoginPage() {
  const [credentials, setCredentials] = useState({ email: 'farmer@agricom.local', password: 'AgriComFarmer2026!' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const login = useAuth((state) => state.login);
  const user = useAuth((state) => state.user);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  useEffect(() => {
    if (user) navigate(params.get('next') || '/account', { replace: true });
  }, [user, navigate, params]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(credentials.email, credentials.password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="customer-login-page">
      <section className="customer-login-story">
        <span className="eyebrow">AGRICOM · FARMER ACCOUNT</span>
        <h1>
          Your field essentials,
          <br />
          all in one place.
        </h1>
        <p>Sign in to see your order requests and follow their progress.</p>
        <span className="login-botanical">✳</span>
      </section>
      <section className="customer-login-card">
        <div className="login-card-inner">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Customer sign in</h2>
          <p>Use your AgriCom customer account to continue.</p>
          <form className="customer-login-form" onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary full-btn" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="customer-demo-login">
            <b>Local demo account</b>
            <span>farmer@agricom.local</span>
            <code>AgriComFarmer2026!</code>
            <small>Testing only. This demo password must not be reused for a live account.</small>
          </div>
          <Link className="text-link" to="/shop">
            Continue browsing products
          </Link>
        </div>
      </section>
    </main>
  );
}

type Props = {
  login: { email: string; password: string };
  setLogin: (login: { email: string; password: string }) => void;
  loginError: string;
  signIn: (event: React.FormEvent) => void;
};

export function LoginPage({ login, setLogin, loginError, signIn }: Props) {
  return (
    <main className="admin-login-page">
      <section className="admin-login-art">
        <span className="admin-brand">AgriCom</span>
        <p className="eyebrow">OWNER WORKSPACE</p>
        <h1>
          Good decisions
          <br />
          start with a clear view.
        </h1>
        <p>Manage product drafts, order requests and fulfilment from one place.</p>
        <div className="login-leaf">✳</div>
      </section>
      <section className="admin-login-panel">
        <div className="login-card">
          <p className="eyebrow">LOCAL TEST ADMIN</p>
          <h2>Sign in</h2>
          <p>Use a demo account to preview role permissions and admin workflows.</p>
          <form onSubmit={signIn} className="product-form">
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={login.email}
                onChange={(e) => setLogin({ ...login, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={login.password}
                onChange={(e) => setLogin({ ...login, password: e.target.value })}
              />
            </label>
            {loginError && (
              <p className="admin-message error-message" role="alert">
                {loginError}
              </p>
            )}
            <button className="primary-button">Sign in to admin</button>
          </form>
          <div className="demo-credentials">
            <b>Demo owner credentials</b>
            <span>admin@agricom.local</span>
            <code>AgriComAdmin2026!</code>
            <small>Local testing only. Do not deploy this login or password.</small>
          </div>
        </div>
      </section>
    </main>
  );
}

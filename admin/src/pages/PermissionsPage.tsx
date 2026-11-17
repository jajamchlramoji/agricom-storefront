import type { PermissionMap } from '../types';

type Props = {
  permissions: PermissionMap;
  saving: boolean;
  savePermissions: () => Promise<void>;
  togglePermission: (role: string, permission: string) => void;
};

export function PermissionsPage({ permissions, saving, savePermissions, togglePermission }: Props) {
  return (
    <section className="admin-card permissions-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">ACCESS CONTROL</p>
          <h2>Role permissions</h2>
          <p className="section-subcopy">Choose what staff roles can do. The owner keeps full control.</p>
        </div>
        <button className="primary-button" disabled={saving} onClick={() => void savePermissions()}>
          {saving ? 'Saving…' : 'Save permissions'}
        </button>
      </div>
      <div className="permission-matrix">
        <div className="permission-head">
          <span>Role</span>
          <span>View catalog</span>
          <span>Edit catalog</span>
          <span>View requests</span>
          <span>Update requests</span>
          <span>Manage fulfilment</span>
        </div>
        {(['operations', 'catalog_manager'] as const).map((role) => (
          <div className="permission-row" key={role}>
            <b>{role === 'operations' ? 'Operations' : 'Catalog manager'}</b>
            {(['catalog.read', 'catalog.write', 'orders.read', 'orders.update', 'fulfillment.manage'] as const).map(
              (permission) => (
                <label key={permission} aria-label={`${role} ${permission}`}>
                  <input
                    type="checkbox"
                    checked={(permissions[role] || []).includes(permission)}
                    onChange={() => togglePermission(role, permission)}
                  />
                </label>
              ),
            )}
          </div>
        ))}
        <div className="permission-row locked">
          <b>Owner</b>
          {['catalog.read', 'catalog.write', 'orders.read', 'orders.update', 'fulfillment.manage'].map((permission) => (
            <label key={permission}>
              <input type="checkbox" checked disabled aria-label={`Owner always has ${permission}`} />
            </label>
          ))}
        </div>
        <div className="permission-row locked">
          <b>Customer</b>
          <span>Own order requests only</span>
          <span>—</span>
          <span>Own orders only</span>
          <span>—</span>
          <span>—</span>
        </div>
      </div>
      <p className="permission-note">
        These demo roles are local test accounts. For a live admin, add real identity verification, audit history and
        secure account recovery.
      </p>
    </section>
  );
}

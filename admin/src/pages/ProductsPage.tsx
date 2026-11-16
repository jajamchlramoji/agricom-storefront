import { availabilityLabels, type Availability, type Product, type ProductForm } from '../types';

type Props = {
  products: Product[];
  form: ProductForm;
  setForm: (form: ProductForm) => void;
  saving: boolean;
  can: (permission: string) => boolean;
  addProduct: (event: React.FormEvent) => void;
  refresh: () => Promise<void>;
  setProductStatus: (product: Product, status: Product['status']) => Promise<void>;
  setProductAvailability: (product: Product, availability: Availability) => Promise<void>;
};

export function ProductsPage({
  products,
  form,
  setForm,
  saving,
  can,
  addProduct,
  refresh,
  setProductStatus,
  setProductAvailability,
}: Props) {
  return (
    <div className="admin-grid">
      <section className="admin-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">CATALOG SERVICE</p>
            <h2>Add a product</h2>
          </div>
        </div>
        <form className="product-form" onSubmit={addProduct}>
          <label>
            Product name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="two-col">
            <label>
              Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Plant nutrition</option>
                <option>Pest management</option>
                <option>Disease management</option>
                <option>Soil health</option>
              </select>
            </label>
            <label>
              Price (₹)
              <input
                required
                min="1"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
          </div>
          <div className="two-col">
            <label>
              Pack size
              <input
                required
                placeholder="e.g. 500 ml"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
            </label>
            <label>
              Brand
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </label>
          </div>
          <label>
            Crops, separated by commas
            <input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} />
          </label>
          <label>
            Default fulfilment
            <select
              value={form.fulfillmentSource}
              onChange={(e) => setForm({ ...form, fulfillmentSource: e.target.value })}
            >
              <option value="supplier">Supplier ships</option>
              <option value="own_stock">AgriCom stock</option>
            </select>
          </label>
          <label>
            Product description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save as draft'}
          </button>
        </form>
      </section>
      <section className="admin-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">CATALOG</p>
            <h2>Review before publishing</h2>
          </div>
          <button className="quiet-button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        <div className="list">
          {products.map((product) => (
            <article className="list-row product-row" key={product.id}>
              <div>
                <b>{product.name}</b>
                <small>
                  {product.category} · {product.size} · ₹{product.price}
                </small>
              </div>
              {can('catalog.write') && (
                <select
                  className="availability-select"
                  value={product.availability}
                  onChange={(e) => void setProductAvailability(product, e.target.value as Availability)}
                  aria-label={`Availability of ${product.name}`}
                >
                  {Object.entries(availabilityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
              <span className={`status status-${product.status}`}>{product.status}</span>
              {product.status === 'draft' && (
                <button className="small-button" onClick={() => void setProductStatus(product, 'published')}>
                  Publish
                </button>
              )}
              {product.status === 'published' && (
                <button className="small-button" onClick={() => void setProductStatus(product, 'draft')}>
                  Unpublish
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

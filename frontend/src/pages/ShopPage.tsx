import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownUp, ChevronRight, Filter, Search, X } from 'lucide-react';
import { categories } from '../data/products';
import { useCatalog } from '../store/catalog';
import { copy, type Language } from '../i18n';
import { ProductCard } from '../components/ProductCard';

export function ShopPage({ lang }: { lang: Language }) {
  const products = useCatalog((state) => state.products);
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('popular');
  const [mobileFilters, setMobileFilters] = useState(false);
  const query = (params.get('q') || '').toLowerCase();
  const category = params.get('category') || '';
  const crop = params.get('crop') || '';
  const brand = params.get('brand') || '';
  const type = params.get('type') || '';
  const results = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (!query ||
              `${p.name} ${p.localName} ${p.category} ${p.brand} ${p.crop.join(' ')}`.toLowerCase().includes(query)) &&
            (!category || p.category === category) &&
            (!crop || p.crop.includes(crop)) &&
            (!brand || p.brand === brand) &&
            (!type || (type === 'organic' ? p.organic : !p.organic)),
        )
        .sort((a, b) =>
          sort === 'low'
            ? a.price - b.price
            : sort === 'high'
              ? b.price - a.price
              : sort === 'rating'
                ? b.rating - a.rating
                : b.reviews - a.reviews,
        ),
    [products, query, category, crop, brand, type, sort],
  );
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  const filterBody = (
    <>
      <label>
        Crop
        <select value={crop} onChange={(e) => change('crop', e.target.value)}>
          <option value="">All crops</option>
          {['Cotton', 'Chilli', 'Paddy', 'Vegetables'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        Category
        <select value={category} onChange={(e) => change('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Brand
        <select value={brand} onChange={(e) => change('brand', e.target.value)}>
          <option value="">All brands</option>
          {[...new Set(products.map((p) => p.brand))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        Product type
        <select value={type} onChange={(e) => change('type', e.target.value)}>
          <option value="">All types</option>
          <option value="organic">Organic</option>
          <option value="chemical">Other</option>
        </select>
      </label>
    </>
  );
  return (
    <main className="wrap page-main">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>Shop</span>
      </div>
      <div className="shop-heading">
        <div>
          <span className="eyebrow">THE AGRICOM CATALOG</span>
          <h1>Products for your field</h1>
          <p>Explore crop care and farm essentials, by category or crop.</p>
        </div>
        <div className="shop-sort">
          <ArrowDownUp size={17} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            <option value="popular">Popularity</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>
      <div className="shop-layout">
        <aside className={`filters ${mobileFilters ? 'show' : ''}`}>
          <div className="filters-title">
            <b>
              <Filter size={17} /> Filters
            </b>
            <button
              onClick={() => {
                setParams(new URLSearchParams());
              }}
              className="text-link"
            >
              Clear all
            </button>
            <button className="mobile-filter-close" onClick={() => setMobileFilters(false)}>
              <X />
            </button>
          </div>
          {filterBody}
        </aside>
        <div className="shop-results">
          <div className="results-head">
            <span>
              {results.length} {copy[lang].products}
              {query && <> matching “{query}”</>}
            </span>
            <button className="filter-open" onClick={() => setMobileFilters(true)}>
              <Filter size={17} /> Filters
            </button>
          </div>
          {results.length ? (
            <div className="product-grid">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={35} />
              <h2>No products found</h2>
              <p>Try clearing a filter or searching another crop or product.</p>
              <button className="btn btn-primary" onClick={() => setParams(new URLSearchParams())}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

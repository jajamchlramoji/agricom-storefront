import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AccountPage, AboutPage, BottomNav, CartPage, CheckoutPage, ContactPage, FaqPage, Footer, Header, HomePage, ProductPage, ShippingPage, ShopPage, WhatsAppFab } from './components/Storefront';
import { storeConfig } from './config/store';
import type { Language } from './i18n';
import { products } from './data/products';

export default function App() {
  const [lang,setLang]=useState<Language>(storeConfig.defaultLanguage); const location=useLocation();
  useEffect(() => {
    const productId = location.pathname.startsWith('/product/') ? location.pathname.split('/')[2] : '';
    const product = products.find((item) => item.id === productId);
    const pageName = location.pathname === '/' ? 'Grow with confidence' : location.pathname.startsWith('/shop') ? 'Shop crop care & farm essentials' : location.pathname.replace(/\//g, ' ').trim().replace(/-/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
    const title = product ? `${product.name} | AgriCom` : `${pageName} | AgriCom`;
    const description = product ? `${product.description} Pack size: ${product.size}. Follow the approved product label.` : 'Explore crop care, plant nutrition and farm essentials for Indian growers. Shop by crop, discover product details and contact AgriCom for help.';
    document.title = title;
    const ensureMeta = (selector: string, attributes: Record<string, string>, content: string) => {
      let tag = document.head.querySelector<HTMLMetaElement>(selector);
      if (!tag) { tag = document.createElement('meta'); document.head.appendChild(tag); }
      Object.entries(attributes).forEach(([name, value]) => tag!.setAttribute(name, value));
      tag.setAttribute('content', content);
    };
    ensureMeta('meta[name="description"]', { name: 'description' }, description);
    ensureMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    ensureMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    ensureMeta('meta[property="og:image"]', { property: 'og:image' }, new URL('/og-image.svg', window.location.origin).toString());
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = new URL(location.pathname, window.location.origin).toString();
  }, [location.pathname, location.search]);
  return <div className="app-shell"><Header lang={lang} setLang={setLang}/><Routes>
    <Route path="/" element={<HomePage lang={lang}/>}/>
    <Route path="/shop" element={<ShopPage lang={lang}/>}/>
    <Route path="/product/:id" element={<ProductPage lang={lang}/>}/>
    <Route path="/cart" element={<CartPage lang={lang}/>}/>
    <Route path="/checkout" element={<CheckoutPage key={location.key}/>}/>
    <Route path="/account" element={<AccountPage/>}/>
    <Route path="/about" element={<AboutPage/>}/>
    <Route path="/contact" element={<ContactPage/>}/>
    <Route path="/shipping-policy" element={<ShippingPage/>}/>
    <Route path="/faq" element={<FaqPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes><Footer/><BottomNav/><WhatsAppFab/></div>;
}

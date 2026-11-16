export type User = { id: string; email: string; name: string; role: string; permissions: string[] };
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  size: string;
  status: 'draft' | 'published' | 'archived';
  availability: Availability;
};
export type Availability = 'confirm_with_supplier' | 'in_stock' | 'unavailable';
export const availabilityLabels: Record<Availability, string> = {
  confirm_with_supplier: 'Confirm with supplier',
  in_stock: 'In stock',
  unavailable: 'Unavailable',
};
export type Order = {
  id: string;
  createdAt: string;
  status: string;
  name: string;
  phone: string;
  address: string;
  pincode: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  paymentPreference: string;
  /** Statuses this order may move to next, from the orders service. */
  nextStatuses: string[];
};
export type Fulfillment = {
  orderId: string;
  source: 'supplier' | 'own_stock';
  supplierName: string;
  trackingNumber: string;
};
export type Page = 'overview' | 'products' | 'orders' | 'permissions';
export type PermissionMap = Record<string, string[]>;
export type ProductForm = {
  name: string;
  category: string;
  price: string;
  size: string;
  brand: string;
  crop: string;
  description: string;
  fulfillmentSource: string;
};
export type BatchResult = { updated: number; skipped: { id: string; reason: string }[] };

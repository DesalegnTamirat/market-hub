// ============================================
// USER & AUTH TYPES
// ============================================

export type Role = 'ADMIN' | 'VENDOR' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// ============================================
// STORE TYPES
// ============================================

export interface Store {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: {
    products: number;
  };
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  storeId: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  store?: Store;
  category?: Category;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  storeId: string;
  categoryId?: string;
}

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
}

// ============================================
// ORDER TYPES
// ============================================

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  orderId: string;
  productId: string;
  storeId: string;
  storeName: string;
  product: Product;
  order: Order
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  customerId: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment?: Payment;
  subtotal: number;
}

export interface CreateOrderData {
  shippingAddress: ShippingAddress;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  orderId: string;
  createdAt: string;
}

export interface CreatePaymentIntentData {
  orderId: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

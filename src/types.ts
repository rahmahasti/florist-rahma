export type ProductCategory = 'Buket Bunga' | 'Standing Flower' | 'Bunga Meja';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  rating: number;
  soldCount: number;
  isFeatured?: boolean;
  tag?: string;
  flowerTypes?: string[];
  dimensions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethodType = 'BCA' | 'Mandiri' | 'BRI' | 'QRIS';

export type PaymentStatus = 
  | 'pending'                  // Menunggu Pembayaran
  | 'paid_waiting_approval'    // Bukti Terupload, Menunggu Approval Admin
  | 'approved'                 // Pembayaran Disetujui
  | 'rejected';                // Bukti Ditolak

export type OrderStatus = 
  | 'pending'                  // Menunggu Pembayaran
  | 'processing'               // Diproses & Rangkaian Disiapkan
  | 'shipped'                  // Dalam Pengiriman oleh Kurir
  | 'completed'                // Pesanan Selesai / Diterima
  | 'cancelled';               // Dibatalkan

export interface OrderItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  deliveryDate: string;
  cardMessage: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentProofUrl?: string;
  paymentProofName?: string;
  rejectionReason?: string;
  adminNotes?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'manager' | 'staff';
}

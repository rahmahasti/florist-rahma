export type ProductCategory = 'Buket Bunga' | 'Standing Flower' | 'Bunga Meja';

export interface Product {
  id: string;
  sku?: string;
  name: string;
  category: ProductCategory;
  costPrice: number;            // Harga Beli / HPP (Harga Pokok Penjualan)
  price: number;                // Harga Jual ke Pelanggan
  stock: number;                // Stok Fisik Tersedia
  minStockAlert?: number;       // Batas Minimum Peringatan Restock
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

// POS Cart Item for Cashier Desk
export interface PosCartItem {
  productId: string;
  sku: string;
  productName: string;
  category: ProductCategory;
  imageUrl: string;
  costPrice: number;            // HPP per item
  sellingPrice: number;         // Harga Jual per item
  quantity: number;
  discountItem: number;         // Potongan per item (IDR)
  subtotal: number;             // quantity * sellingPrice - discountItem
  costSubtotal: number;         // quantity * costPrice
  profitSubtotal: number;       // subtotal - costSubtotal
}

export type PosPaymentMethod = 'Tunai' | 'QRIS' | 'Debit/Kartu' | 'Transfer';

export interface PosTransaction {
  id: string;
  receiptNumber: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  items: PosCartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  totalCost: number;            // Total HPP seluruh item
  profitAmount: number;         // Keuntungan Bersih (Total Jual - Total HPP)
  profitRatio: number;          // Persentase Markup / Profit Ratio %
  paymentMethod: PosPaymentMethod;
  amountTendered: number;       // Uang diterima dari pembeli
  changeAmount: number;         // Uang kembalian
  notes?: string;
  createdAt: string;
}

export type InventoryMutationType = 'in' | 'out' | 'opname';

export interface InventoryLog {
  id: string;
  productId: string;
  productSku?: string;
  productName: string;
  type: InventoryMutationType;  // 'in': barang masuk/pembelian, 'out': kasir/pesanan, 'opname': penyesuaian
  quantityChange: number;       // +10 atau -2
  previousStock: number;
  newStock: number;
  notes: string;
  staffName: string;
  costPriceAtTime?: number;
  createdAt: string;
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
  costPrice?: number;
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
  totalCost?: number;
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

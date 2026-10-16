import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  AlertTriangle, 
  ExternalLink, 
  RotateCcw, 
  X, 
  Clock, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Check, 
  Sparkles,
  ArrowUpRight,
  Flower,
  CreditCard,
  Tag,
  Calculator,
  Store
} from 'lucide-react';
import { Product, Order, Customer, ProductCategory, OrderStatus, InventoryLog, PosTransaction } from '../../types';
import { 
  updateProductStock, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  resetToDefault12Products 
} from '../../services/productService';
import { 
  approvePaymentProof, 
  rejectPaymentProof, 
  updateOrderStatus 
} from '../../services/orderService';
import { formatIDR, formatDate } from '../../utils/formatters';
import { PosKasir } from '../pos/PosKasir';
import { InventoryManagement } from '../inventory/InventoryManagement';
import { PriceProfitSettings } from '../pricing/PriceProfitSettings';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  inventoryLogs?: InventoryLog[];
  posTransactions?: PosTransaction[];
  defaultTab?: 'orders' | 'pos' | 'products' | 'inventory' | 'pricing' | 'customers' | 'reports';
  onReturnToStore: () => void;
  onOpenPos?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  customers,
  inventoryLogs = [],
  posTransactions = [],
  defaultTab = 'orders',
  onReturnToStore,
  onOpenPos,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'pos' | 'products' | 'inventory' | 'pricing' | 'customers' | 'reports'>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Search and filter states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('Semua');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [inspectCustomerOrders, setInspectCustomerOrders] = useState<Customer | null>(null);

  // Loading & status feedback
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Orders count waiting approval
  const waitingApprovalOrders = useMemo(
    () => orders.filter((o) => o.paymentStatus === 'paid_waiting_approval'),
    [orders]
  );

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = productCategoryFilter === 'Semua' || p.category === productCategoryFilter;
      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      let matchStatus = true;
      if (orderStatusFilter === 'waiting_approval') {
        matchStatus = o.paymentStatus === 'paid_waiting_approval';
      } else if (orderStatusFilter === 'pending') {
        matchStatus = o.paymentStatus === 'pending';
      } else if (orderStatusFilter === 'approved') {
        matchStatus = o.paymentStatus === 'approved';
      } else if (orderStatusFilter === 'processing') {
        matchStatus = o.orderStatus === 'processing';
      } else if (orderStatusFilter === 'shipped') {
        matchStatus = o.orderStatus === 'shipped';
      } else if (orderStatusFilter === 'completed') {
        matchStatus = o.orderStatus === 'completed';
      } else if (orderStatusFilter === 'rejected') {
        matchStatus = o.paymentStatus === 'rejected';
      }

      const matchSearch = o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.recipientName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerPhone.includes(orderSearch);

      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // Sales Analytics KPIs (Combined Webstore + POS Kasir)
  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.paymentStatus === 'approved');
    const onlineRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const posRevenue = posTransactions.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalRevenue = onlineRevenue + posRevenue;
    
    const totalSuccessfulOrders = validOrders.length + posTransactions.length;
    
    let totalItemsSold = 0;
    const categoryRevenue: Record<ProductCategory, number> = {
      'Buket Bunga': 0,
      'Standing Flower': 0,
      'Bunga Meja': 0,
    };

    validOrders.forEach((order) => {
      order.items.forEach((item) => {
        totalItemsSold += item.quantity;
        if (categoryRevenue[item.category] !== undefined) {
          categoryRevenue[item.category] += item.price * item.quantity;
        }
      });
    });

    posTransactions.forEach((posTx) => {
      posTx.items.forEach((item) => {
        totalItemsSold += item.quantity;
        if (categoryRevenue[item.category] !== undefined) {
          categoryRevenue[item.category] += item.subtotal;
        }
      });
    });

    const posCost = posTransactions.reduce((sum, p) => sum + p.totalCost, 0);
    const onlineCost = validOrders.reduce((sum, o) => {
      return sum + o.items.reduce((iSum, it) => iSum + (it.costPrice || Math.round(it.price * 0.6)) * it.quantity, 0);
    }, 0);
    const totalCost = posCost + onlineCost;
    const totalNetProfit = Math.max(0, totalRevenue - totalCost);
    const profitMarginPercent = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

    const averageOrderValue = totalSuccessfulOrders > 0 ? totalRevenue / totalSuccessfulOrders : 0;

    return {
      onlineRevenue,
      posRevenue,
      totalRevenue,
      totalCost,
      totalNetProfit,
      profitMarginPercent,
      posTransactionsCount: posTransactions.length,
      onlineOrdersCount: validOrders.length,
      totalSuccessfulOrders,
      totalItemsSold,
      averageOrderValue,
      categoryRevenue,
    };
  }, [orders, posTransactions]);

  // Stock Handlers
  const handleQuickStockChange = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      setActionLoadingId(productId);
      await updateProductStock(productId, newStock);
      showNotification(`Stok produk berhasil diperbarui menjadi ${newStock}.`);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Payment Approval Handler
  const handleApprovePayment = async (orderId: string) => {
    try {
      setActionLoadingId(orderId);
      await approvePaymentProof(orderId, 'Pembayaran disetujui oleh admin.');
      showNotification('Pembayaran berhasil disetujui! Status pesanan kini "Diproses" dan stok otomatis berkurang.');
    } catch (e: any) {
      console.error(e);
      alert('Gagal menyetujui pembayaran: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Payment Reject Handler
  const handleConfirmRejectPayment = async () => {
    if (!rejectingOrder) return;
    try {
      setActionLoadingId(rejectingOrder.id);
      await rejectPaymentProof(
        rejectingOrder.id,
        rejectionReasonInput.trim() || 'Bukti transfer tidak sesuai atau dana belum masuk'
      );
      showNotification('Bukti pembayaran ditolak. Alasan penolakan telah dicatat.');
      setRejectingOrder(null);
      setRejectionReasonInput('');
    } catch (e: any) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Order Status Handler
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setActionLoadingId(orderId);
      await updateOrderStatus(orderId, newStatus);
      showNotification(`Status pesanan diperbarui menjadi "${newStatus}".`);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Invoice', 'Tanggal', 'Pelanggan', 'Email', 'No_HP', 'Penerima', 'Metode_Bayar', 'Status_Bayar', 'Status_Pesanan', 'Total_IDR'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.createdAt.split('T')[0],
      `"${o.customerName}"`,
      o.customerEmail,
      o.customerPhone,
      `"${o.recipientName}"`,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      o.totalAmount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_penjualan_rahma_florist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#faf5f6] pb-20">
      {/* Top Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#283830] text-[#fce4ea] px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-xs animate-in slide-in-from-top-4 duration-300 border border-[#e8b5c0]">
          <CheckCircle2 className="w-4 h-4 text-[#8bd1ab] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Admin Subheader & Navigation */}
      <div className="bg-white border-b border-[#ebd2d7] sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
            
            {/* Identity & Status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3f6351] to-[#c76e80] text-white flex items-center justify-center font-bold font-serif shadow-2xs">
                RF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif font-bold text-[#283830] text-lg">
                    Rahma Florist Control Center
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#edf5f0] text-[#395c47] text-[10px] font-semibold uppercase tracking-wider border border-[#d2e6d8]">
                    Live Firestore DB
                  </span>
                </div>
                <p className="text-xs text-[#6e7b73]">
                  Panel Pengelolaan Toko, Stok, Order & Laporan Penjualan
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onReturnToStore}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#324f40] bg-[#eef5f1] hover:bg-[#e2ede6] border border-[#d4e5db] transition-colors flex items-center gap-1.5"
              >
                <span>Lihat Toko Publik</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#b5586b]" />
              </button>

              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mereset dan menginisialisasi ulang 12 produk awal di Firestore? Data produk custom akan diganti ke 12 produk katalog awal.')) {
                    resetToDefault12Products().then(() => showNotification('12 Produk Rahma Florist berhasil di-reset ke data default!'));
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#5c6962] border border-[#ebd0d6] hover:bg-[#fbf4f6] transition-colors flex items-center gap-1.5"
                title="Reset database produk ke 12 bunga standar"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#b5586b]" />
                <span>Reset 12 Produk</span>
              </button>
            </div>

          </div>

          {/* Navigation Tabs with Soft Sage & Blush Harmony */}
          <div className="flex space-x-1 sm:space-x-2 border-t border-[#f2dee3] pt-1 overflow-x-auto scrollbar-none text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-3.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-[#b5586b] text-[#8c3649]'
                  : 'border-transparent text-[#66756d] hover:text-[#283830]'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-[#b5586b]" />
              <span>Pesanan & Bukti Bayar</span>
              {waitingApprovalOrders.length > 0 && (
                <span className="bg-[#b5586b] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                  {waitingApprovalOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`py-3 px-3.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pos'
                  ? 'border-[#3f6351] text-[#2c4739]'
                  : 'border-transparent text-[#66756d] hover:text-[#283830]'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#3f6351]" />
              <span>Kasir POS ({posTransactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`py-3 px-3.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-[#3f6351] text-[#2c4739]'
                  : 'border-transparent text-[#66756d] hover:text-[#283830]'
              }`}
            >
              <Package className="w-4 h-4 text-[#3f6351]" />
              <span>Katalog Produk ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-3 px-3.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'border-[#3f6351] text-[#2c4739]'
                  : 'border-transparent text-[#66756d] hover:text-[#283830]'
              }`}
            >
              <Tag className="w-4 h-4 text-[#3f6351]" />
              <span>Inventory & Stok ({inventoryLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-3 px-3.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pricing'
                  ? 'border-[#3f6351] text-[#2c4739]'
                  : 'border-transparent text-[#66756d] hover:text-[#283830]'
              }`}
            >
              <Calculator className="w-4 h-4 text-[#3f6351]" />
              <span>Pengaturan Harga & Auto Ratio</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`py-3 px-3.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'customers'
                  ? 'border-[#3f6351] text-[#2c4739]'
                  : 'border-transparent text-[#66756d] hover:text-[#283830]'
              }`}
            >
              <Users className="w-4 h-4 text-[#3f6351]" />
              <span>Pelanggan ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`py-3 px-3.5 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'border-[#b5586b] text-[#8c3649]'
                  : 'border-transparent text-[#66756d] hover:text-[#283830]'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-[#b5586b]" />
              <span>Laporan Sales & Profit</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* TAB 1: ORDERS & PAYMENT APPROVAL */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Top Filter and Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#ebd0d6] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5586b]" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Cari No Invoice, nama pelanggan, penerima..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b]"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
                {[
                  { id: 'all', label: `Semua (${orders.length})` },
                  { id: 'waiting_approval', label: `Perlu Approval (${waitingApprovalOrders.length})`, highlight: true },
                  { id: 'pending', label: 'Menunggu Bayar' },
                  { id: 'processing', label: 'Diproses' },
                  { id: 'shipped', label: 'Dikirim' },
                  { id: 'completed', label: 'Selesai' },
                  { id: 'rejected', label: 'Bukti Ditolak' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrderStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      orderStatusFilter === st.id
                        ? 'bg-[#3e5b4e] text-white'
                        : st.highlight && waitingApprovalOrders.length > 0
                        ? 'bg-[#fdf0f3] text-[#9c4355] font-bold border border-[#f2c9d2]'
                        : 'bg-[#faf2f4] text-[#55635b] hover:bg-[#f4e2e6]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-[#ebd0d6] text-center text-[#7f8c84] space-y-2">
                <ShoppingCart className="w-12 h-12 mx-auto opacity-30 text-[#b5586b]" />
                <p className="text-sm font-medium">Belum ada pesanan pada filter ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const needsApproval = order.paymentStatus === 'paid_waiting_approval';
                  return (
                    <div 
                      key={order.id}
                      className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-2xs ${
                        needsApproval
                          ? 'border-[#e0b0bc] ring-2 ring-[#fae6ea]'
                          : 'border-[#ebd0d6] hover:border-[#dfb5be]'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f2dee3]">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            needsApproval ? 'bg-[#b5586b] text-white shadow-2xs' : 'bg-[#eaf2ee] text-[#395c47]'
                          }`}>
                            #{order.orderNumber.slice(-4)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-mono font-bold text-[#283830] text-sm sm:text-base">
                                {order.orderNumber}
                              </h3>
                              <span className="text-[11px] text-[#7d8c83] font-normal">
                                • {formatDate(order.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-[#55635b]">
                              Metode: <strong className="text-[#283830]">{order.paymentMethod}</strong> • Total: <strong className="text-[#324f40] font-bold">{formatIDR(order.totalAmount)}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Status Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            order.paymentStatus === 'approved'
                              ? 'bg-[#eef5f1] text-[#395c47] border border-[#d6e5dc]'
                              : order.paymentStatus === 'paid_waiting_approval'
                              ? 'bg-[#fdf0f3] text-[#9c4355] border border-[#f2c9d2] font-bold'
                              : order.paymentStatus === 'rejected'
                              ? 'bg-[#fbebee] text-[#912d3f]'
                              : 'bg-[#faf2eb] text-[#8c522d]'
                          }`}>
                            Pembayaran: {
                              order.paymentStatus === 'approved' ? 'Disetujui ✓' :
                              order.paymentStatus === 'paid_waiting_approval' ? 'Perlu Approval Bukti ⚠️' :
                              order.paymentStatus === 'rejected' ? 'Bukti Ditolak ✕' : 'Menunggu Bayar'
                            }
                          </span>

                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f5f2f2] text-[#4d5c53]">
                            Status: {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* Main Grid Details */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
                        
                        {/* Left Info: Customer & Shipping */}
                        <div className="md:col-span-5 space-y-3 text-xs">
                          <div className="p-3 rounded-xl bg-[#faf5f6] border border-[#f0dee2] space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-[#9e4659] tracking-wider">
                              Identitas Pemesan
                            </span>
                            <p className="font-bold text-[#283830] text-sm">{order.customerName}</p>
                            <p className="text-[#55635b] flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#3f6351]" />
                              <a href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:underline text-[#395c47] font-medium">
                                {order.customerPhone} (WhatsApp)
                              </a>
                            </p>
                            <p className="text-[#6d7a72] flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#b5586b]" />
                              {order.customerEmail}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-[#faf5f6] border border-[#f0dee2] space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-[#9e4659] tracking-wider">
                              Penerima & Pengiriman
                            </span>
                            <p className="font-semibold text-[#283830]">
                              Kepada: {order.recipientName} ({order.recipientPhone})
                            </p>
                            <p className="text-[#55635b] flex items-start gap-1.5">
                              <MapPin className="w-3 h-3 text-[#3f6351] shrink-0 mt-0.5" />
                              <span>{order.shippingAddress}</span>
                            </p>
                            <p className="text-[#55635b] flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-[#3f6351]" />
                              <span>Tanggal Kirim: <strong className="text-[#324f40]">{order.deliveryDate}</strong></span>
                            </p>
                            {order.cardMessage && (
                              <div className="pt-1 border-t border-[#f0dee2] text-[#55635b]">
                                <span className="font-semibold text-[11px] text-[#873647]">Pesan Kartu:</span>
                                <p className="italic text-[11px] text-[#55635b] mt-0.5">"{order.cardMessage}"</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle Info: Ordered Floral Items */}
                        <div className="md:col-span-4 space-y-2 text-xs">
                          <span className="text-[10px] uppercase font-bold text-[#395c47] tracking-wider block">
                            Produk Bunga ({order.items.reduce((s, i) => s + i.quantity, 0)} item)
                          </span>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#faf5f6] border border-[#ebd0d6]">
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#ebd0d6]"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-[#283830] truncate">{item.productName}</p>
                                  <p className="text-[11px] text-[#9c4355] font-medium">{item.category} • {item.quantity} tangkai/rangkaian</p>
                                </div>
                                <span className="font-bold text-[#283830] text-xs shrink-0">
                                  {formatIDR(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Section: APPROVAL PANEL BUKTI PEMBAYARAN */}
                        <div className="md:col-span-3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#f2dee3] md:pl-5 pt-4 md:pt-0">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#9e4659] tracking-wider block mb-2">
                              Verifikasi Bukti Transfer
                            </span>

                            {order.paymentProofUrl ? (
                              <div className="space-y-2">
                                <div 
                                  onClick={() => setPreviewProofUrl(order.paymentProofUrl!)}
                                  className="relative aspect-4/3 rounded-xl overflow-hidden border border-[#ebd0d6] bg-[#faf5f6] cursor-pointer group shadow-2xs hover:border-[#b5586b] transition-colors"
                                  title="Klik untuk memperbesar bukti transfer"
                                >
                                  <img
                                    src={order.paymentProofUrl}
                                    alt="Bukti Transfer Pelanggan"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1 transition-opacity">
                                    <Eye className="w-4 h-4 text-[#fce4ea]" /> Perbesar
                                  </div>
                                </div>
                                <p className="text-[10px] text-[#6d7a72] text-center">
                                  {order.paymentProofName || 'Bukti Transfer Terupload'}
                                </p>
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl bg-[#faf5f6] border border-[#ebd0d6] text-center text-[#7d8c83] text-xs">
                                <Clock className="w-5 h-5 mx-auto mb-1 opacity-50 text-[#b5586b]" />
                                <span>Pelanggan belum mengunggah bukti</span>
                              </div>
                            )}

                            {order.rejectionReason && (
                              <div className="mt-2 p-2 rounded-lg bg-[#fbebee] border border-[#f5d0d8] text-[11px] text-[#873647]">
                                <strong>Ditolak:</strong> {order.rejectionReason}
                              </div>
                            )}
                          </div>

                          {/* Approval and Status Action Buttons */}
                          <div className="pt-4 space-y-2">
                            {needsApproval ? (
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => handleApprovePayment(order.id)}
                                  className="w-full py-2.5 px-3 rounded-xl bg-[#3f6351] hover:bg-[#345343] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-[#fae1e6]" />
                                  <span>Setujui Pembayaran (Approve)</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => setRejectingOrder(order)}
                                  className="w-full py-2 px-3 rounded-xl bg-[#fdf0f3] hover:bg-[#fae1e6] text-[#9c4355] border border-[#f2c9d2] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Tolak Bukti Transfer</span>
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1 text-xs">
                                <label className="block text-[10px] uppercase font-bold text-[#7d8c83]">
                                  Update Status Pesanan:
                                </label>
                                <select
                                  value={order.orderStatus}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#ebd0d6] rounded-lg text-[#283830] focus:outline-hidden focus:border-[#b5586b]"
                                >
                                  <option value="pending">Menunggu Pembayaran</option>
                                  <option value="processing">Diproses / Dirangkai</option>
                                  <option value="shipped">Dalam Pengiriman Kurir</option>
                                  <option value="completed">Selesai / Diterima</option>
                                  <option value="cancelled">Dibatalkan</option>
                                </select>
                              </div>
                            )}
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PRODUCTS & STOCK MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Header controls */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#ebd0d6] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5586b]" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Cari nama produk bunga..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b]"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm bg-white border border-[#ebd0d6] rounded-xl text-[#3d4b43] cursor-pointer w-full sm:w-auto"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Buket Bunga">Buket Bunga</option>
                  <option value="Standing Flower">Standing Flower</option>
                  <option value="Bunga Meja">Bunga Meja</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#b5586b] hover:bg-[#a34a5d] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Bunga Baru</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#ebd0d6] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#526157]">
                  <thead className="bg-[#faf5f6] border-b border-[#ebd0d6] text-[11px] uppercase tracking-wider text-[#873647] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Produk</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Harga (IDR)</th>
                      <th className="py-3 px-4 text-center">Kelola Stok Real-Time</th>
                      <th className="py-3 px-4 text-center">Terjual</th>
                      <th className="py-3 px-4 text-center">Rating</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2dee3]">
                    {filteredProducts.map((prod) => {
                      const isLow = prod.stock > 0 && prod.stock <= 5;
                      const isZero = prod.stock === 0;
                      return (
                        <tr key={prod.id} className="hover:bg-[#fbf7f8] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-12 h-12 rounded-xl object-cover border border-[#ebd0d6] shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-serif font-bold text-[#283830] text-sm truncate max-w-xs">
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-[#7d8c83] truncate max-w-xs">
                                  {prod.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#eef5f1] text-[#395c47] border border-[#d6e5dc]">
                              {prod.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-[#324f40] text-sm whitespace-nowrap">
                            {formatIDR(prod.price)}
                          </td>

                          {/* Quick Inline Stock Adjuster */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-[#faf4f6] border border-[#ebd0d6] rounded-xl p-1">
                              <button
                                onClick={() => handleQuickStockChange(prod.id, prod.stock, -1)}
                                disabled={actionLoadingId === prod.id || prod.stock <= 0}
                                className="w-6 h-6 rounded-lg bg-white border border-[#ebd0d6] hover:bg-[#fae6ea] text-[#3d4b43] font-bold flex items-center justify-center disabled:opacity-30"
                                title="Kurangi stok 1"
                              >
                                -
                              </button>
                              
                              <span className={`px-2 text-xs font-bold min-w-[2.5rem] text-center ${
                                isZero ? 'text-[#a84457]' : isLow ? 'text-[#b5586b]' : 'text-[#395c47]'
                              }`}>
                                {prod.stock}
                              </span>

                              <button
                                onClick={() => handleQuickStockChange(prod.id, prod.stock, 1)}
                                disabled={actionLoadingId === prod.id}
                                className="w-6 h-6 rounded-lg bg-white border border-[#ebd0d6] hover:bg-[#fae6ea] text-[#3d4b43] font-bold flex items-center justify-center disabled:opacity-30"
                                title="Tambah stok 1"
                              >
                                +
                              </button>
                            </div>
                            {isZero && <span className="block text-[10px] text-[#a84457] font-bold mt-0.5">Habis</span>}
                            {isLow && <span className="block text-[10px] text-[#b5586b] font-semibold mt-0.5">Kritis!</span>}
                          </td>

                          <td className="py-3.5 px-4 text-center font-medium text-[#9c4355] whitespace-nowrap">
                            {prod.soldCount}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="font-bold text-[#d98b48]">★ {prod.rating.toFixed(1)}</span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setEditingProduct(prod)}
                                className="p-1.5 rounded-lg text-[#395c47] hover:text-[#283830] hover:bg-[#eef5f1] transition-colors"
                                title="Edit data produk"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Hapus produk "${prod.name}" dari katalog?`)) {
                                    await deleteProduct(prod.id);
                                    showNotification('Produk berhasil dihapus dari database.');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-[#9ea8a2] hover:text-[#a84457] hover:bg-[#fdf0f3] transition-colors"
                                title="Hapus produk"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CUSTOMERS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#ebd0d6] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5586b]" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Cari nama pelanggan, email, atau nomor WhatsApp..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b]"
                />
              </div>

              <div className="text-xs text-[#6e7b73]">
                Total Pelanggan Terdaftar: <strong className="text-[#324f40]">{customers.length} Orang</strong>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#ebd0d6] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#526157]">
                  <thead className="bg-[#faf5f6] border-b border-[#ebd0d6] text-[11px] uppercase tracking-wider text-[#873647] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Nama Pelanggan</th>
                      <th className="py-3 px-4">Kontak WhatsApp</th>
                      <th className="py-3 px-4">Alamat Pengiriman Utama</th>
                      <th className="py-3 px-4 text-center">Total Order</th>
                      <th className="py-3 px-4 text-right">Total Belanja (LTV)</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2dee3]">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#9ea8a2]">
                          Belum ada data pelanggan tersimpan. Pelanggan otomatis tercatat saat membuat order.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-[#fbf7f8] transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#283830] text-sm">{cust.name}</p>
                            <p className="text-[11px] text-[#9c4355]">{cust.email}</p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <a
                              href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eef5f1] text-[#395c47] hover:bg-[#e2ede6] font-medium border border-[#d6e5dc]"
                            >
                              <Phone className="w-3 h-3 text-[#395c47]" />
                              <span>{cust.phone}</span>
                            </a>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-[#55635b]">
                            {cust.address || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-[#283830]">
                            {cust.totalOrders}x
                          </td>
                          <td className="py-3.5 px-4 text-right font-serif font-bold text-[#324f40] text-sm whitespace-nowrap">
                            {formatIDR(cust.totalSpent)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setInspectCustomerOrders(cust)}
                              className="px-3 py-1 rounded-lg bg-[#fdf2f4] hover:bg-[#fae6ea] text-[#9c4355] text-xs font-semibold transition-colors border border-[#f5d7de]"
                            >
                              Lihat Riwayat
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: SALES REPORT & ANALYTICS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            
            {/* KPI Cards in Soft Pastel Theme with Profit & HPP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#ebd0d6] shadow-2xs space-y-2">
                <span className="text-[11px] uppercase font-bold text-[#9e4659] tracking-wider">
                  Total Omset Penjualan
                </span>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-[#324f40]">
                  {formatIDR(analytics.totalRevenue)}
                </p>
                <div className="text-[10px] text-[#7d8c83] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Webstore:</span>
                    <strong className="text-[#324f40]">{formatIDR(analytics.onlineRevenue)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir POS:</span>
                    <strong className="text-[#324f40]">{formatIDR(analytics.posRevenue)}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#ebd0d6] shadow-2xs space-y-2">
                <span className="text-[11px] uppercase font-bold text-[#395c47] tracking-wider">
                  Total Modal HPP (Biaya Bunga)
                </span>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-[#283830]">
                  {formatIDR(analytics.totalCost)}
                </p>
                <p className="text-[11px] text-[#7d8c83]">
                  Berdasarkan harga beli modal per rangkaian
                </p>
              </div>

              <div className="bg-gradient-to-br from-white to-[#fcf2f4] p-5 rounded-2xl border border-[#fadce3] shadow-2xs space-y-2">
                <span className="text-[11px] uppercase font-bold text-[#b55e71] tracking-wider flex items-center justify-between">
                  <span>Keuntungan Bersih (Profit)</span>
                  <span className="bg-[#b55e71] text-white px-2 py-0.5 rounded-full text-[10px]">
                    +{analytics.profitMarginPercent}%
                  </span>
                </span>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3f6351]">
                  +{formatIDR(analytics.totalNetProfit)}
                </p>
                <p className="text-[11px] text-[#7d8c83]">
                  Total omset dikurangi HPP bunga terjual
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#ebd0d6] shadow-2xs space-y-2">
                <span className="text-[11px] uppercase font-bold text-[#395c47] tracking-wider">
                  Total Transaksi Selesai
                </span>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-[#283830]">
                  {analytics.totalSuccessfulOrders} Transaksi
                </p>
                <p className="text-[11px] text-[#7d8c83]">
                  {analytics.onlineOrdersCount} Online Webstore • {analytics.posTransactionsCount} Kasir POS
                </p>
              </div>
            </div>

            {/* Sales Channel Breakdown Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#ebd0d6] shadow-2xs space-y-3">
                <h4 className="font-serif font-bold text-[#283830] text-sm flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#3f6351]" />
                  <span>Komparasi Channel Penjualan</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-[#48564f] mb-1">
                      <span>Online Webstore ({analytics.onlineOrdersCount} order)</span>
                      <span>{formatIDR(analytics.onlineRevenue)}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#3f6351] rounded-full"
                        style={{ width: `${analytics.totalRevenue > 0 ? (analytics.onlineRevenue / analytics.totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-[#48564f] mb-1">
                      <span>Kasir POS Toko Offline ({analytics.posTransactionsCount} struk)</span>
                      <span>{formatIDR(analytics.posRevenue)}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#c76e80] rounded-full"
                        style={{ width: `${analytics.totalRevenue > 0 ? (analytics.posRevenue / analytics.totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#ebd0d6] shadow-2xs space-y-3">
                <h4 className="font-serif font-bold text-[#283830] text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#c76e80]" />
                  <span>Ringkasan Margin Bunga</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-[#faf5f6] p-3 rounded-xl border border-[#edd7dd]">
                    <span className="text-[10px] text-[#718077] block">Bunga Terjual:</span>
                    <strong className="text-base text-[#283830]">{analytics.totalItemsSold} Rangkaian</strong>
                  </div>
                  <div className="bg-[#f4f7f5] p-3 rounded-xl border border-[#dce8e1]">
                    <span className="text-[10px] text-[#718077] block">Rata-rata Order (AOV):</span>
                    <strong className="text-sm text-[#3f6351]">{formatIDR(analytics.averageOrderValue)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-[#ebd0d6] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-[#283830] text-lg">
                    Distribusi Penjualan per Kategori Bunga
                  </h3>
                  <p className="text-xs text-[#7d8c83]">
                    Perbandingan kontribusi omset antara buket, standing flower, dan bunga meja
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {(['Buket Bunga', 'Standing Flower', 'Bunga Meja'] as ProductCategory[]).map((cat) => {
                  const rev = analytics.categoryRevenue[cat] || 0;
                  const percentage = analytics.totalRevenue > 0
                    ? Math.round((rev / analytics.totalRevenue) * 100)
                    : 0;

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[#3b4740]">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            cat === 'Buket Bunga' ? 'bg-[#b5586b]' :
                            cat === 'Standing Flower' ? 'bg-[#3f6351]' : 'bg-[#c97b8a]'
                          }`} />
                          {cat}
                        </span>
                        <span>{formatIDR(rev)} ({percentage}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-[#faf2f4] rounded-full overflow-hidden border border-[#ebd0d6]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat === 'Buket Bunga' ? 'bg-[#b5586b]' :
                            cat === 'Standing Flower' ? 'bg-[#3f6351]' : 'bg-[#c97b8a]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Export CSV & Print */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-[#ebd0d6] bg-white hover:bg-[#faf4f6] text-[#3d4b43] font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-2xs"
              >
                <Printer className="w-4 h-4 text-[#3f6351]" />
                <span>Cetak Laporan Penjualan</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-[#3f6351] hover:bg-[#345343] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-[#fae1e6]" />
                <span>Export Laporan ke File CSV</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 5: POS KASIR */}
        {activeTab === 'pos' && (
          <PosKasir
            products={products}
            customers={customers}
            posTransactions={posTransactions}
            onReturnToStore={onReturnToStore}
            onOpenInventory={() => setActiveTab('inventory')}
            onOpenPricing={() => setActiveTab('pricing')}
          />
        )}

        {/* TAB 6: INVENTORY & STOCK */}
        {activeTab === 'inventory' && (
          <InventoryManagement
            products={products}
            inventoryLogs={inventoryLogs}
            onOpenPos={() => setActiveTab('pos')}
            onOpenPricing={() => setActiveTab('pricing')}
          />
        )}

        {/* TAB 7: PRICING & AUTO RATIO PROFIT */}
        {activeTab === 'pricing' && (
          <PriceProfitSettings
            products={products}
            onOpenInventory={() => setActiveTab('inventory')}
            onOpenPos={() => setActiveTab('pos')}
          />
        )}

      </main>

      {/* MODAL: PROOF IMAGE ZOOM VIEW */}
      {previewProofUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
          onClick={() => setPreviewProofUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-3xl p-3 overflow-hidden shadow-xl border border-[#ebd0d6]">
            <button
              onClick={() => setPreviewProofUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-900/60 text-white hover:bg-stone-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewProofUrl}
              alt="Bukti Transfer Detail"
              className="max-h-[82vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}

      {/* MODAL: REJECT PAYMENT PROOF */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#ebd0d6]">
            <h3 className="font-serif font-bold text-lg text-[#283830]">
              Tolak Bukti Pembayaran #{rejectingOrder.orderNumber}
            </h3>
            <p className="text-xs text-[#55635b]">
              Berikan alasan penolakan agar pelanggan dapat membaca penjelasan dan mengunggah ulang bukti yang valid.
            </p>
            <textarea
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="Contoh: Nominal transfer kurang Rp 50.000, atau bukti transfer buram tidak terbaca."
              className="w-full p-3 rounded-xl border border-[#ebd0d6] text-xs text-[#283830] focus:outline-hidden focus:border-[#b5586b]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#55635b] hover:bg-[#faf4f6]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectPayment}
                className="px-4 py-2 rounded-xl bg-[#b5586b] hover:bg-[#a34a5d] text-white font-semibold text-xs"
              >
                Konfirmasi Tolak Bukti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {(isAddProductOpen || editingProduct) && (
        <ProductFormModal
          isOpen={isAddProductOpen || Boolean(editingProduct)}
          initialProduct={editingProduct}
          onClose={() => {
            setIsAddProductOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setIsAddProductOpen(false);
            setEditingProduct(null);
            showNotification('Data produk berhasil disimpan ke database Firestore!');
          }}
        />
      )}

      {/* MODAL: CUSTOMER ORDER HISTORY INSPECTOR */}
      {inspectCustomerOrders && (
        <CustomerHistoryModal
          customer={inspectCustomerOrders}
          orders={orders.filter((o) => o.customerEmail.toLowerCase() === inspectCustomerOrders.email.toLowerCase())}
          onClose={() => setInspectCustomerOrders(null)}
        />
      )}

    </div>
  );
};

// Modal for Adding or Editing Product
interface ProductFormModalProps {
  isOpen: boolean;
  initialProduct: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  initialProduct,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState<ProductCategory>(initialProduct?.category || 'Buket Bunga');
  const [costPrice, setCostPrice] = useState(initialProduct?.costPrice || Math.round((initialProduct?.price || 450000) * 0.6));
  const [price, setPrice] = useState(initialProduct?.price || 450000);
  const [stock, setStock] = useState(initialProduct?.stock || 10);
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');
  const [tag, setTag] = useState(initialProduct?.tag || 'Best Seller');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim()) return;

    try {
      setIsSubmitting(true);
      if (initialProduct) {
        await updateProduct(initialProduct.id, {
          name: name.trim(),
          category,
          costPrice: Number(costPrice) || Math.round(Number(price) * 0.6),
          price: Number(price),
          stock: Number(stock),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          tag: tag.trim(),
        });
      } else {
        await addProduct({
          name: name.trim(),
          category,
          costPrice: Number(costPrice) || Math.round(Number(price) * 0.6),
          price: Number(price),
          stock: Number(stock),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          rating: 5.0,
          soldCount: 0,
          tag: tag.trim(),
          flowerTypes: ['Mawar Segar', 'Foliage Eukaliptus'],
          dimensions: 'Standar Rahma Florist',
        });
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#ebd0d6]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2dee3]">
          <h3 className="font-serif font-bold text-lg text-[#283830]">
            {initialProduct ? 'Edit Produk Bunga' : 'Tambah Produk Bunga Baru'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#faf4f6] text-[#7d8c83]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#3b4740] mb-1">Nama Produk Bunga *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Royal Peony Velvet Bouquet"
              className="w-full px-3 py-2 rounded-xl border border-[#ebd0d6] text-[#283830] focus:outline-hidden focus:border-[#b5586b]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#3b4740] mb-1">Kategori *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 rounded-xl border border-[#ebd0d6] text-[#283830]"
              >
                <option value="Buket Bunga">Buket Bunga</option>
                <option value="Standing Flower">Standing Flower</option>
                <option value="Bunga Meja">Bunga Meja</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#3b4740] mb-1">Badge Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Best Seller / New / Populer"
                className="w-full px-3 py-2 rounded-xl border border-[#ebd0d6] text-[#283830]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#3b4740] mb-1">Harga Beli / HPP *</label>
              <input
                type="number"
                required
                min={0}
                step={5000}
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#ebd0d6] text-[#283830]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3b4740] mb-1">Harga Jual *</label>
              <input
                type="number"
                required
                min={0}
                step={5000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#ebd0d6] text-[#283830]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3b4740] mb-1">Stok Tersedia *</label>
              <input
                type="number"
                required
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#ebd0d6] text-[#283830]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#3b4740] mb-1">URL Gambar Bunga (Unsplash / Link Foto) *</label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 rounded-xl border border-[#ebd0d6] text-[#283830]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3b4740] mb-1">Deskripsi Rangkaian *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan jenis bunga, keunikan, aroma, dan nuansa rangkaian..."
              className="w-full px-3 py-2 rounded-xl border border-[#ebd0d6] text-[#283830]"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[#f2dee3]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#55635b] hover:bg-[#faf4f6]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#3f6351] hover:bg-[#345343] text-white font-semibold"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Customer Order History Modal
const CustomerHistoryModal: React.FC<{
  customer: Customer;
  orders: Order[];
  onClose: () => void;
}> = ({ customer, orders, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto border border-[#ebd0d6]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2dee3]">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#283830]">
              Riwayat Pesanan: {customer.name}
            </h3>
            <p className="text-xs text-[#9c4355]">{customer.email} • {customer.phone}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#faf4f6] text-[#7d8c83]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-xs text-[#9ea8a2] py-6 text-center">Belum ada riwayat order.</p>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="p-3 rounded-xl border border-[#ebd0d6] text-xs space-y-1.5 bg-[#faf5f6]">
                <div className="flex justify-between font-bold text-[#283830]">
                  <span>#{ord.orderNumber}</span>
                  <span className="text-[#324f40]">{formatIDR(ord.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[#6e7b73] text-[11px]">
                  <span>{formatDate(ord.createdAt)}</span>
                  <span>Bayar: {ord.paymentStatus} • Kirim: {ord.orderStatus}</span>
                </div>
                <div className="text-[#55635b]">
                  {ord.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Receipt, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  User, 
  X, 
  Store, 
  Sparkles, 
  Percent, 
  ArrowRight,
  History,
  TrendingUp,
  Tag,
  Clock,
  Check
} from 'lucide-react';
import { Product, PosCartItem, PosPaymentMethod, PosTransaction, Customer } from '../../types';
import { processPosTransaction, generateReceiptNumber } from '../../services/posService';
import { formatIDR, formatDate } from '../../utils/formatters';

interface PosKasirProps {
  products: Product[];
  customers: Customer[];
  posTransactions: PosTransaction[];
  onReturnToStore?: () => void;
  onOpenInventory?: () => void;
  onOpenPricing?: () => void;
}

export const PosKasir: React.FC<PosKasirProps> = ({
  products,
  customers,
  posTransactions,
  onReturnToStore,
  onOpenInventory,
  onOpenPricing
}) => {
  // Cashier Desk State
  const [cashierName, setCashierName] = useState('Kasir Rahma Florist');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // POS Cart
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [discountPercentInput, setDiscountPercentInput] = useState<string>('');
  
  // Customer info
  const [customerName, setCustomerName] = useState('Pelanggan Umum / Walk-in');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PosPaymentMethod>('Tunai');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [transactionNotes, setTransactionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Receipt Print & Success Modal
  const [completedTransaction, setCompletedTransaction] = useState<PosTransaction | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryTx, setSelectedHistoryTx] = useState<PosTransaction | null>(null);

  // Filtered Products for POS catalog
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'Semua' || prod.category === selectedCategory;
      const matchSearch = 
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.sku && prod.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        prod.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems]);

  const totalCost = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.costSubtotal, 0);
  }, [cartItems]);

  const finalTotalAmount = useMemo(() => {
    return Math.max(0, cartSubtotal - orderDiscount);
  }, [cartSubtotal, orderDiscount]);

  const netProfit = useMemo(() => {
    return Math.max(0, finalTotalAmount - totalCost);
  }, [finalTotalAmount, totalCost]);

  const profitRatioPercent = useMemo(() => {
    if (totalCost <= 0) return 0;
    return Math.round(((finalTotalAmount - totalCost) / totalCost) * 100);
  }, [finalTotalAmount, totalCost]);

  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Add Product to POS Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          return prev; // cannot exceed stock
        }
        return prev.map((item) => {
          if (item.productId === product.id) {
            const newQty = item.quantity + 1;
            const newSubtotal = newQty * item.sellingPrice - item.discountItem;
            const newCost = newQty * item.costPrice;
            return {
              ...item,
              quantity: newQty,
              subtotal: newSubtotal,
              costSubtotal: newCost,
              profitSubtotal: newSubtotal - newCost,
            };
          }
          return item;
        });
      }

      const cost = product.costPrice || Math.round(product.price * 0.6);
      const subtotal = product.price;
      const itemCost = cost;
      const newItem: PosCartItem = {
        productId: product.id,
        sku: product.sku || `SKU-${product.id.slice(0, 6)}`,
        productName: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        costPrice: cost,
        sellingPrice: product.price,
        quantity: 1,
        discountItem: 0,
        subtotal: subtotal,
        costSubtotal: itemCost,
        profitSubtotal: subtotal - itemCost,
      };

      return [...prev, newItem];
    });
  };

  // Update Cart Item Quantity
  const handleUpdateQty = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    const maxStock = product ? product.stock : 999;

    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > maxStock) return item; // limit to stock

            const newSubtotal = newQty * item.sellingPrice - item.discountItem;
            const newCost = newQty * item.costPrice;
            return {
              ...item,
              quantity: newQty,
              subtotal: newSubtotal,
              costSubtotal: newCost,
              profitSubtotal: newSubtotal - newCost,
            };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  // Remove Item
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Apply Discount Percent
  const handleApplyDiscountPercent = (percent: number) => {
    const calculatedDiscount = Math.round((cartSubtotal * percent) / 100);
    setOrderDiscount(calculatedDiscount);
    setDiscountPercentInput(percent.toString());
  };

  // Open Checkout Payment Modal
  const handleOpenPayment = () => {
    if (cartItems.length === 0) return;
    setAmountTendered(finalTotalAmount); // default to exact amount
    setSelectedPaymentMethod('Tunai');
    setIsPaymentModalOpen(true);
  };

  // Quick tender buttons for cash
  const quickTenderOptions = useMemo(() => {
    const base = finalTotalAmount;
    const presets = [base, 50000, 100000, 200000, 500000, 1000000];
    const unique = Array.from(new Set(presets.filter((p) => p >= base))).sort((a, b) => a - b);
    return unique.slice(0, 5);
  }, [finalTotalAmount]);

  // Execute POS Transaction
  const handleConfirmPayment = async () => {
    if (cartItems.length === 0) return;
    if (selectedPaymentMethod === 'Tunai' && amountTendered < finalTotalAmount) {
      alert('Nominal uang tunai yang diterima kurang dari total pembayaran!');
      return;
    }

    try {
      setIsProcessing(true);
      const receiptNumber = generateReceiptNumber();
      const changeAmount = selectedPaymentMethod === 'Tunai' 
        ? Math.max(0, amountTendered - finalTotalAmount) 
        : 0;

      const txPayload: Omit<PosTransaction, 'id'> = {
        receiptNumber,
        cashierName,
        customerName: customerName.trim() || 'Pelanggan Umum / Walk-in',
        customerPhone: customerPhone.trim() || '',
        items: cartItems,
        subtotal: cartSubtotal,
        discount: orderDiscount,
        totalAmount: finalTotalAmount,
        totalCost,
        profitAmount: netProfit,
        profitRatio: profitRatioPercent,
        paymentMethod: selectedPaymentMethod,
        amountTendered: selectedPaymentMethod === 'Tunai' ? amountTendered : finalTotalAmount,
        changeAmount,
        notes: transactionNotes,
        createdAt: new Date().toISOString(),
      };

      const docId = await processPosTransaction(txPayload);

      const createdTx: PosTransaction = {
        ...txPayload,
        id: docId,
      };

      setCompletedTransaction(createdTx);
      setIsPaymentModalOpen(false);
      // Clear Cart
      setCartItems([]);
      setOrderDiscount(0);
      setDiscountPercentInput('');
      setTransactionNotes('');
    } catch (error) {
      console.error('POS transaction failed:', error);
      alert('Gagal memproses transaksi kasir. Cek koneksi Firestore.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Print function
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="bg-[#faf8f7] min-h-[calc(100vh-80px)] text-[#283830] pb-12">
      
      {/* POS Top Bar */}
      <div className="bg-white border-b border-[#f0dee3] sticky top-20 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3f6351] text-white flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5 text-[#fcedf1]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg text-[#283830]">Kasir POS Rahma Florist</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f1ec] text-[#345744] border border-[#d2e3d8]">
                  Point of Sale Offline
                </span>
              </div>
              <p className="text-xs text-[#707e76]">
                Kelola penjualan langsung di kasir toko dengan auto-stok & kalkulasi profit real-time
              </p>
            </div>
          </div>

          {/* Quick Staff & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* Cashier input */}
            <div className="flex items-center gap-1.5 bg-[#fbf5f7] border border-[#f0d8df] rounded-xl px-3 py-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-[#b55e71]" />
              <span className="text-[#87938b] hidden sm:inline">Kasir:</span>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="font-medium text-[#283830] bg-transparent focus:outline-hidden w-28 sm:w-36"
                placeholder="Nama Kasir"
              />
            </div>

            {/* Riwayat Struk Kasir */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3f6351] bg-[#f4f7f5] hover:bg-[#e9f0ec] border border-[#dce8e1] rounded-xl transition-colors"
            >
              <History className="w-3.5 h-3.5 text-[#4f7863]" />
              <span>Riwayat Transaksi</span>
              {posTransactions.length > 0 && (
                <span className="bg-[#cc6379] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {posTransactions.length}
                </span>
              )}
            </button>

            {/* Shortcut to Inventory */}
            {onOpenInventory && (
              <button
                onClick={onOpenInventory}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#684750] bg-[#fbf2f4] hover:bg-[#fae4e9] border border-[#f4d3dc] rounded-xl transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-[#c26274]" />
                <span>Kartu Stok & Mutasi</span>
              </button>
            )}

            {/* Shortcut to Pricing */}
            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3f6351] bg-[#eef5f1] hover:bg-[#e3eee7] border border-[#d4e4db] rounded-xl transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#426a54]" />
                <span>Auto Ratio Profit</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* POS Two-Column Workspace */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Product Catalog & Search (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search & Categories Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#f0dee3] shadow-xs space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ea8a2]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama bunga, SKU (cth: PROD-1), atau scan barcode..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#faf5f6]/70 border border-[#edd5dc] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#c26274] focus:ring-2 focus:ring-[#fcebef] transition-all text-[#283830]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9a9a9a] hover:text-[#b55e71]"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['Semua', 'Buket Bunga', 'Standing Flower', 'Bunga Meja'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#3f6351] text-white shadow-2xs'
                        : 'bg-[#f7f5f4] text-[#55635c] hover:bg-[#fae7eb] hover:text-[#b55e71]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= (product.minStockAlert || 3);
                const cost = product.costPrice || Math.round(product.price * 0.6);
                const itemMargin = Math.round(((product.price - cost) / product.price) * 100);

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    className={`group bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all select-none text-left relative overflow-hidden ${
                      isOutOfStock
                        ? 'border-gray-200 opacity-60 cursor-not-allowed bg-gray-50/70'
                        : 'border-[#f2dee3] hover:border-[#c97486] hover:shadow-md cursor-pointer hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Image & Badges */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#f7f3f4] mb-2.5">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* SKU Tag */}
                      <span className="absolute top-2 left-2 text-[9px] font-mono bg-black/60 text-white px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        {product.sku || product.id}
                      </span>

                      {/* Stock Badge */}
                      <span
                        className={`absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-xs ${
                          isOutOfStock
                            ? 'bg-rose-600 text-white'
                            : isLowStock
                            ? 'bg-amber-500 text-white'
                            : 'bg-[#3f6351] text-white'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#b55e71] font-semibold block truncate">
                        {product.category}
                      </span>
                      <h3 className="font-medium text-xs sm:text-sm text-[#283830] line-clamp-1 group-hover:text-[#3f6351] transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="mt-1 flex items-baseline justify-between gap-1">
                        <span className="font-serif font-bold text-sm text-[#3f6351]">
                          {formatIDR(product.price)}
                        </span>
                        <span className="text-[10px] text-[#86968d] hidden sm:inline" title="Estimasi margin profit">
                          Margin: {itemMargin}%
                        </span>
                      </div>
                    </div>

                    {/* Quick tap icon */}
                    <div className="mt-2 pt-2 border-t border-[#f7eaee] flex items-center justify-between text-[11px] text-[#63726a]">
                      <span className="text-[10px] text-[#87938b]">HPP: {formatIDR(cost)}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#b55e71] group-hover:underline">
                        <Plus className="w-3 h-3" /> Tambah
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-[#ecd3db] p-8">
                  <AlertCircle className="w-10 h-10 mx-auto text-[#cca0ac] mb-2" />
                  <p className="font-medium text-sm text-[#3f4b44]">Tidak ada bunga yang cocok dengan kata kunci</p>
                  <p className="text-xs text-[#8c9890] mt-1">Coba cari dengan kata kunci lain atau pilih Semua kategori</p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: POS Cashier Cart & Payment Terminal (5 Cols) */}
          <div className="lg:col-span-5 sticky top-36 space-y-4">
            
            <div className="bg-white rounded-2xl border border-[#edd7dd] shadow-sm overflow-hidden flex flex-col">
              
              {/* Header Cart */}
              <div className="bg-gradient-to-r from-[#fbf2f4] via-[#f7edf0] to-[#f4f7f5] px-4 py-3.5 border-b border-[#ebd3da] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3f6351] text-white flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-[#fcedf1]" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-sm text-[#283830]">Keranjang Kasir</h2>
                    <span className="text-[11px] text-[#718077]">{totalItemsCount} item dipilih</span>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-xs text-[#b55e71] hover:text-[#914051] flex items-center gap-1 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Kosongkan
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div className="p-3.5 bg-[#fefcfc] border-b border-[#f2e1e5] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#4b5851] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#b55e71]" /> Pembeli:
                  </span>
                  <button
                    onClick={() => setIsCustomCustomer(!isCustomCustomer)}
                    className="text-[11px] text-[#3f6351] hover:underline font-semibold"
                  >
                    {isCustomCustomer ? 'Gunakan Walk-in' : '+ Pilih / Ketik Pelanggan'}
                  </button>
                </div>

                {isCustomCustomer ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nama Pembeli"
                        className="px-2.5 py-1.5 bg-white border border-[#edd4db] rounded-lg text-xs focus:outline-hidden focus:border-[#c26274]"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="No. WhatsApp / HP"
                        className="px-2.5 py-1.5 bg-white border border-[#edd4db] rounded-lg text-xs focus:outline-hidden focus:border-[#c26274]"
                      />
                    </div>
                    {/* Quick pick from registered customers */}
                    {customers.length > 0 && (
                      <select
                        onChange={(e) => {
                          const c = customers.find((cust) => cust.id === e.target.value);
                          if (c) {
                            setCustomerName(c.name);
                            setCustomerPhone(c.phone);
                          }
                        }}
                        className="w-full px-2.5 py-1 bg-[#f7f5f5] border border-[#e5d0d6] rounded-lg text-[11px] text-[#55635b]"
                      >
                        <option value="">-- Atau Pilih dari Pelanggan Terdaftar --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone || c.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[#38463f] bg-white px-2.5 py-1.5 rounded-lg border border-[#f0dee3]">
                    <span className="font-semibold">{customerName}</span>
                    <span className="text-[10px] text-[#8e9c94]">Transaksi Kasir Toko</span>
                  </div>
                )}
              </div>

              {/* Items List in Cart */}
              <div className="p-3.5 divide-y divide-[#f5e6ea] max-h-72 overflow-y-auto space-y-3">
                {cartItems.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  const maxStock = product ? product.stock : 999;
                  const itemProfit = item.profitSubtotal;

                  return (
                    <div key={item.productId} className="pt-2.5 first:pt-0 flex items-start gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-12 h-12 rounded-xl object-cover border border-[#edd6dc] shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="font-semibold text-xs text-[#283830] truncate">{item.productName}</h4>
                            <span className="text-[10px] text-[#8f9b94] font-mono">{item.sku}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-[#cca0ac] hover:text-[#b55e71] p-0.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-semibold text-[#3f6351]">
                            {formatIDR(item.sellingPrice)}
                          </span>

                          {/* Stepper with stock boundary */}
                          <div className="flex items-center gap-1.5 bg-[#f7f5f4] border border-[#e8d7dc] rounded-lg p-0.5">
                            <button
                              onClick={() => handleUpdateQty(item.productId, -1)}
                              className="w-5 h-5 flex items-center justify-center text-[#58645d] hover:bg-white rounded transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-[#283830]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(item.productId, 1)}
                              disabled={item.quantity >= maxStock}
                              className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                                item.quantity >= maxStock
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-[#58645d] hover:bg-white'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Line subtotal & profit preview */}
                        <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-[#fcecee] text-[#718077]">
                          <span>Subtotal: <strong className="text-[#283830]">{formatIDR(item.subtotal)}</strong></span>
                          <span className="text-[#3f6351] font-medium" title="Keuntungan margin item">
                            Profit: +{formatIDR(itemProfit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {cartItems.length === 0 && (
                  <div className="py-10 text-center space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto text-[#d4b4be]" />
                    <p className="text-xs text-[#718077]">Keranjang kasir masih kosong</p>
                    <p className="text-[11px] text-[#97a39b]">Klik produk bunga di sebelah kiri untuk menambah pesanan</p>
                  </div>
                )}
              </div>

              {/* Discount & Order Adjustments */}
              {cartItems.length > 0 && (
                <div className="p-3.5 bg-[#fbf5f7] border-t border-[#ebd5dc] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#495750] flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-[#b55e71]" /> Potongan Diskon:
                    </span>
                    <div className="flex items-center gap-1">
                      {[5, 10, 15].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleApplyDiscountPercent(pct)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            discountPercentInput === pct.toString()
                              ? 'bg-[#b55e71] text-white'
                              : 'bg-white border border-[#eccfd7] text-[#718077] hover:border-[#b55e71]'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                      {orderDiscount > 0 && (
                        <button
                          onClick={() => {
                            setOrderDiscount(0);
                            setDiscountPercentInput('');
                          }}
                          className="text-[10px] text-[#b55e71] underline ml-1"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Manual Nominal Discount */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#85928a]">Nominal:</span>
                    <input
                      type="number"
                      value={orderDiscount || ''}
                      onChange={(e) => {
                        setOrderDiscount(Math.max(0, Number(e.target.value) || 0));
                        setDiscountPercentInput('');
                      }}
                      placeholder="0"
                      className="w-full px-2.5 py-1 bg-white border border-[#edd7dd] rounded-lg text-xs font-semibold text-[#283830] focus:outline-hidden focus:border-[#c26274]"
                    />
                  </div>
                </div>
              )}

              {/* Real-time Profit Calculation Desk */}
              {cartItems.length > 0 && (
                <div className="p-3.5 bg-gradient-to-br from-[#f2f7f4] to-[#fceef2] border-t border-[#e2e8e4] text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[#44524b]">
                    <span className="flex items-center gap-1 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#426a54]" /> Auto Margin Ratio:
                    </span>
                    <span className="font-bold text-[#3f6351] bg-white px-2 py-0.5 rounded-full border border-[#d6e5dc] text-[11px]">
                      +{profitRatioPercent}% Markup
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="bg-white/80 p-2 rounded-xl border border-[#dfe8e2]">
                      <span className="text-[#84928a] block">Total Modal (HPP):</span>
                      <strong className="text-[#495750]">{formatIDR(totalCost)}</strong>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-[#fadce3]">
                      <span className="text-[#b55e71] block font-medium">Est. Keuntungan:</span>
                      <strong className="text-[#3f6351] font-bold">+{formatIDR(netProfit)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Total & Checkout Button */}
              <div className="p-4 bg-white border-t border-[#edd7dd] space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#718077]">
                    <span>Subtotal Produk</span>
                    <span>{formatIDR(cartSubtotal)}</span>
                  </div>
                  {orderDiscount > 0 && (
                    <div className="flex justify-between text-[#b55e71] font-medium">
                      <span>Diskon Pesanan</span>
                      <span>-{formatIDR(orderDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-[#f2e1e5]">
                    <span className="font-serif font-bold text-base text-[#283830]">Total Tagihan</span>
                    <span className="font-serif font-bold text-xl text-[#3f6351]">
                      {formatIDR(finalTotalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleOpenPayment}
                  disabled={cartItems.length === 0}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                    cartItems.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#3f6351] via-[#4d735e] to-[#c76e80] text-white hover:opacity-95 hover:shadow-md'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-[#fcedf1]" />
                  <span>Bayar Sekarang (F10)</span>
                  <ArrowRight className="w-4 h-4 text-[#fcedf1]" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* PAYMENT MODAL (TUNAI / QRIS / DEBIT / TRANSFER) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#f0dee3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3f6351] to-[#c76e80] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">Proses Pembayaran Kasir</h3>
                <p className="text-xs text-[#faedf0]">Pilih metode bayar & cetak nota belanja</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Total Display */}
              <div className="bg-[#fbf5f7] p-4 rounded-2xl border border-[#edd7dd] text-center">
                <span className="text-xs text-[#8c9890] block">Total Yang Harus Dibayar</span>
                <span className="font-serif font-bold text-3xl text-[#3f6351] mt-1 block">
                  {formatIDR(finalTotalAmount)}
                </span>
                <div className="text-[11px] text-[#718077] mt-1">
                  Pelanggan: <strong className="text-[#283830]">{customerName}</strong>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-[#48564f] block mb-2">Metode Pembayaran:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Tunai', 'QRIS', 'Debit/Kartu', 'Transfer'] as PosPaymentMethod[]).map((method) => {
                    const isSelected = selectedPaymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(method)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-[#3f6351] text-white border-[#3f6351] shadow-2xs font-bold'
                            : 'bg-[#faf8f7] border-[#eedbe0] text-[#55635c] hover:bg-[#faedf0]'
                        }`}
                      >
                        <div className="text-xs">{method}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Inputs Based on Method */}
              {selectedPaymentMethod === 'Tunai' ? (
                <div className="space-y-3 bg-[#f8faf9] p-4 rounded-2xl border border-[#dce8e0]">
                  <div>
                    <label className="text-xs font-semibold text-[#38463f] block mb-1">
                      Uang Diterima dari Pembeli (Rp):
                    </label>
                    <input
                      type="number"
                      value={amountTendered || ''}
                      onChange={(e) => setAmountTendered(Number(e.target.value) || 0)}
                      className="w-full text-lg font-bold px-3.5 py-2.5 bg-white border border-[#c8d9ce] rounded-xl focus:outline-hidden focus:border-[#3f6351] text-[#283830]"
                    />
                  </div>

                  {/* Quick Tender Options */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-[#78887f] w-full block">Pilihan Cepat:</span>
                    {quickTenderOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAmountTendered(opt)}
                        className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-[#eaf1ec] border border-[#d2e2d7] rounded-lg text-[#3f6351] transition-colors"
                      >
                        {opt === finalTotalAmount ? 'Uang Pas' : formatIDR(opt)}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="pt-2 border-t border-[#dce8e0] flex justify-between items-center">
                    <span className="text-xs text-[#55635c]">Kembalian:</span>
                    <span className={`font-serif font-bold text-lg ${
                      amountTendered >= finalTotalAmount ? 'text-[#3f6351]' : 'text-rose-600'
                    }`}>
                      {amountTendered >= finalTotalAmount
                        ? formatIDR(amountTendered - finalTotalAmount)
                        : `Kurang ${formatIDR(finalTotalAmount - amountTendered)}`}
                    </span>
                  </div>
                </div>
              ) : selectedPaymentMethod === 'QRIS' ? (
                <div className="text-center p-4 bg-[#fbf5f7] rounded-2xl border border-[#edd7dd] space-y-2">
                  <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl border border-[#ecd2d9] flex items-center justify-center shadow-2xs">
                    <QrCode className="w-24 h-24 text-[#283830]" />
                  </div>
                  <p className="text-xs font-semibold text-[#283830]">QRIS Dinamis Rahma Florist</p>
                  <p className="text-[11px] text-[#718077]">
                    Arahkan kamera HP pelanggan ke QRIS untuk pembayaran Rp {finalTotalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-[#f4f7f5] rounded-2xl border border-[#dce8e1] space-y-2 text-xs">
                  <label className="font-semibold text-[#38463f] block">
                    No. Referensi / Batch EDC / Bank Penerima:
                  </label>
                  <input
                    type="text"
                    value={transactionNotes}
                    onChange={(e) => setTransactionNotes(e.target.value)}
                    placeholder="Contoh: EDC BCA #89281 atau Ref TRF-MANDIRI"
                    className="w-full px-3 py-2 bg-white border border-[#d0e0d6] rounded-xl focus:outline-hidden focus:border-[#3f6351]"
                  />
                </div>
              )}

              {/* Catatan Tambahan */}
              <div>
                <label className="text-xs text-[#718077] block mb-1">Catatan Struk (Opsional):</label>
                <input
                  type="text"
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  placeholder="Contoh: Tambah pita peach & kartu ucapan"
                  className="w-full px-3 py-2 text-xs bg-[#faf8f7] border border-[#eedbe0] rounded-xl focus:outline-hidden focus:border-[#c26274]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-3 text-xs font-medium text-[#718077] hover:bg-[#f7f5f4] rounded-xl border border-[#ecd5dc] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing || (selectedPaymentMethod === 'Tunai' && amountTendered < finalTotalAmount)}
                  className="flex-2 py-3 bg-gradient-to-r from-[#3f6351] to-[#c76e80] text-white rounded-xl font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>Memproses Transaksi...</>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4 text-[#fcedf1]" />
                      <span>Selesaikan & Cetak Struk</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* THERMAL RECEIPT SUCCESS MODAL (STRUK BELANJA) */}
      {(completedTransaction || selectedHistoryTx) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Action Bar */}
            <div className="bg-[#283830] text-white px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#8bd3ad]" /> Transaksi Berhasil Disimpan
              </span>
              <button
                onClick={() => {
                  setCompletedTransaction(null);
                  setSelectedHistoryTx(null);
                }}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Receipt Container */}
            <div id="printable-receipt" className="p-6 font-mono text-[11px] text-gray-800 space-y-4 bg-white">
              
              {/* Store Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                <h2 className="font-serif font-bold text-base tracking-wider text-black">RAHMA FLORIST</h2>
                <p className="text-[10px] text-gray-600">Atelier de Fleurs & Boutique</p>
                <p className="text-[9px] text-gray-500">Jl. Senopati No. 88, Kebayoran Baru, Jakarta</p>
                <p className="text-[9px] text-gray-500">WhatsApp: 0812-8888-9999</p>
              </div>

              {/* Receipt Info */}
              {(() => {
                const tx = completedTransaction || selectedHistoryTx!;
                return (
                  <>
                    <div className="space-y-0.5 text-[10px] pb-2 border-b border-dashed border-gray-300">
                      <div className="flex justify-between">
                        <span>No. Struk:</span>
                        <strong className="text-black">{tx.receiptNumber}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Waktu:</span>
                        <span>{formatDate(tx.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kasir:</span>
                        <span>{tx.cashierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pelanggan:</span>
                        <span>{tx.customerName}</span>
                      </div>
                    </div>

                    {/* Items Breakdown */}
                    <div className="space-y-1.5 py-1 border-b border-dashed border-gray-300">
                      {tx.items.map((it, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="font-semibold text-black truncate">{it.productName}</div>
                          <div className="flex justify-between text-gray-600 text-[10px]">
                            <span>{it.quantity} x {it.sellingPrice.toLocaleString('id-ID')}</span>
                            <span className="font-medium text-black">
                              {it.subtotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 pt-1 border-b border-dashed border-gray-300 pb-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Rp {tx.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {tx.discount > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>Diskon:</span>
                          <span>-Rp {tx.discount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-bold text-black pt-1">
                        <span>TOTAL BAYAR:</span>
                        <span>Rp {tx.totalAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between pt-0.5">
                        <span>Metode:</span>
                        <span>{tx.paymentMethod}</span>
                      </div>
                      {tx.paymentMethod === 'Tunai' && (
                        <>
                          <div className="flex justify-between">
                            <span>Tunai Diterima:</span>
                            <span>Rp {tx.amountTendered.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Kembalian:</span>
                            <span>Rp {tx.changeAmount.toLocaleString('id-ID')}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer barcode & gratitude */}
                    <div className="text-center pt-2 space-y-1 text-[9px] text-gray-500">
                      <p className="font-semibold text-gray-700">*** TERIMA KASIH ***</p>
                      <p>Bunga segar garansi 24 jam</p>
                      <p>www.rahmaflorist.id</p>
                    </div>
                  </>
                );
              })()}

            </div>

            {/* Print & Close Buttons */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-[#3f6351] hover:bg-[#324f40] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <Printer className="w-4 h-4" /> Cetak Struk
              </button>
              <button
                onClick={() => {
                  setCompletedTransaction(null);
                  setSelectedHistoryTx(null);
                }}
                className="py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-xl border border-gray-300 transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RIWAYAT TRANSAKSI POS MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#edd7dd] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            
            <div className="p-5 bg-gradient-to-r from-[#3f6351] to-[#c76e80] text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">Riwayat Transaksi Kasir POS</h3>
                <p className="text-xs text-[#faedf0]">Daftar transaksi penjualan langsung di toko</p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {posTransactions.length === 0 ? (
                <div className="py-12 text-center text-[#86968d]">
                  <History className="w-10 h-10 mx-auto text-[#d4b4be] mb-2" />
                  <p>Belum ada transaksi POS kasir yang tercatat.</p>
                </div>
              ) : (
                posTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-white rounded-xl border border-[#edd7dd] hover:border-[#c26274] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-xs text-[#283830]">{tx.receiptNumber}</strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eef5f1] text-[#345744] font-medium border border-[#d6e5dc]">
                          {tx.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-[#627068] mt-1">
                        {tx.customerName} • {formatDate(tx.createdAt)} • Kasir: {tx.cashierName}
                      </p>
                      <p className="text-[11px] text-[#85928a] mt-0.5">
                        {tx.items.length} item: {tx.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <div>
                        <span className="font-serif font-bold text-sm text-[#3f6351] block">
                          {formatIDR(tx.totalAmount)}
                        </span>
                        <span className="text-[10px] text-[#3f6351] font-medium">
                          Profit: +{formatIDR(tx.profitAmount)} ({tx.profitRatio}%)
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedHistoryTx(tx);
                          setIsHistoryModalOpen(false);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#b55e71] hover:bg-[#fae7eb] rounded-lg border border-[#f2d8df] transition-colors"
                      >
                        <Printer className="w-3 h-3" /> Cetak Nota
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-white text-xs font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

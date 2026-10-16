import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  RotateCcw, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  Clock, 
  Building, 
  FileText, 
  User, 
  X, 
  Tag, 
  TrendingUp, 
  Check, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Product, InventoryLog, InventoryMutationType } from '../../types';
import { recordRestock, recordStockOpname } from '../../services/posService';
import { updateProduct } from '../../services/productService';
import { formatIDR, formatDate } from '../../utils/formatters';

interface InventoryManagementProps {
  products: Product[];
  inventoryLogs: InventoryLog[];
  onOpenPos?: () => void;
  onOpenPricing?: () => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  products,
  inventoryLogs,
  onOpenPos,
  onOpenPricing,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'mutation_logs'>('stock');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'low' | 'out'>('all');
  const [mutationTypeFilter, setMutationTypeFilter] = useState<string>('all');

  // Modals
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isOpnameOpen, setIsOpnameOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  
  // Selected product for action
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states for Restock
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockCostPrice, setRestockCostPrice] = useState<number>(0);
  const [restockNotes, setRestockNotes] = useState('');
  const [restockStaff, setRestockStaff] = useState('Staff Gudang Bunga');

  // Form states for Opname
  const [opnameActualStock, setOpnameActualStock] = useState<number>(0);
  const [opnameReason, setOpnameReason] = useState('Sortasi rutin bunga layu');
  const [opnameStaff, setOpnameStaff] = useState('Supervisor Toko');

  // Form states for Threshold
  const [minAlertVal, setMinAlertVal] = useState<number>(3);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Inventory KPI calculations
  const totalPhysicalStock = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock, 0);
  }, [products]);

  const totalAssetCost = useMemo(() => {
    return products.reduce((sum, p) => {
      const cost = p.costPrice || Math.round(p.price * 0.6);
      return sum + cost * p.stock;
    }, 0);
  }, [products]);

  const totalSellingVal = useMemo(() => {
    return products.reduce((sum, p) => sum + p.price * p.stock, 0);
  }, [products]);

  const totalPotentialProfit = useMemo(() => {
    return Math.max(0, totalSellingVal - totalAssetCost);
  }, [totalSellingVal, totalAssetCost]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= (p.minStockAlert || 3)).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= 0).length;
  }, [products]);

  // Filtered Products for Table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === 'Semua' || p.category === categoryFilter;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStatus = true;
      const threshold = p.minStockAlert || 3;
      if (statusFilter === 'safe') matchStatus = p.stock > threshold;
      else if (statusFilter === 'low') matchStatus = p.stock > 0 && p.stock <= threshold;
      else if (statusFilter === 'out') matchStatus = p.stock <= 0;

      return matchCat && matchSearch && matchStatus;
    });
  }, [products, categoryFilter, searchQuery, statusFilter]);

  // Filtered Inventory Mutation Logs
  const filteredLogs = useMemo(() => {
    return inventoryLogs.filter((log) => {
      const matchType = mutationTypeFilter === 'all' || log.type === mutationTypeFilter;
      const matchSearch =
        log.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.productSku && log.productSku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.staffName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [inventoryLogs, mutationTypeFilter, searchQuery]);

  // Handlers
  const handleOpenRestock = (product?: Product) => {
    const prod = product || products[0];
    setSelectedProduct(prod);
    setRestockQty(10);
    setRestockCostPrice(prod?.costPrice || Math.round((prod?.price || 100000) * 0.6));
    setRestockNotes('Restock pengadaan bunga segar');
    setIsRestockOpen(true);
  };

  const handleOpenOpname = (product?: Product) => {
    const prod = product || products[0];
    setSelectedProduct(prod);
    setOpnameActualStock(prod?.stock || 0);
    setOpnameReason('Penyesuaian fisik hasil cek berkala');
    setIsOpnameOpen(true);
  };

  const handleOpenThreshold = (product: Product) => {
    setSelectedProduct(product);
    setMinAlertVal(product.minStockAlert || 3);
    setIsThresholdModalOpen(true);
  };

  const handleSaveRestock = async () => {
    if (!selectedProduct) return;
    if (restockQty <= 0) {
      alert('Jumlah restock harus lebih dari 0');
      return;
    }

    try {
      setIsSubmitting(true);
      await recordRestock(
        selectedProduct.id,
        restockQty,
        restockCostPrice > 0 ? restockCostPrice : undefined,
        restockNotes,
        restockStaff
      );
      showFeedback(`Berhasil menambahkan ${restockQty} stok untuk ${selectedProduct.name}`);
      setIsRestockOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat restock. Pastikan koneksi Firestore aktif.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveOpname = async () => {
    if (!selectedProduct) return;
    try {
      setIsSubmitting(true);
      await recordStockOpname(
        selectedProduct.id,
        Math.max(0, opnameActualStock),
        opnameReason,
        opnameStaff
      );
      showFeedback(`Stock opname untuk ${selectedProduct.name} berhasil diperbarui menjadi ${opnameActualStock}`);
      setIsOpnameOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat stock opname.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveThreshold = async () => {
    if (!selectedProduct) return;
    try {
      setIsSubmitting(true);
      await updateProduct(selectedProduct.id, {
        minStockAlert: Math.max(1, minAlertVal),
      });
      showFeedback(`Batas peringatan stok ${selectedProduct.name} diubah menjadi ${minAlertVal}`);
      setIsThresholdModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah batas alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#3f6351] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#99e0b8]" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#f0dee3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#3f6351] text-white">
              <Package className="w-5 h-5 text-[#fdedf1]" />
            </span>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#283830]">Manajemen Inventory & Kartu Stok</h2>
              <p className="text-xs text-[#718077]">
                Kelola mutasi stok masuk (restock), keluar (kasir), opname fisik & histori audit secara terpusat
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenRestock()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#3f6351] hover:bg-[#324f40] text-white rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-[#fcedf1]" />
            <span>+ Restock Bunga</span>
          </button>

          <button
            onClick={() => handleOpenOpname()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#faf2f4] hover:bg-[#fae4e9] text-[#b55e71] border border-[#f2d8df] rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4 text-[#c26274]" />
            <span>Audit / Stock Opname</span>
          </button>

          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#f4f7f5] hover:bg-[#e9f0ec] text-[#3f6351] border border-[#dce8e1] rounded-xl transition-all"
            >
              <TrendingUp className="w-4 h-4 text-[#4f7863]" />
              <span>Atur Rasio Profit</span>
            </button>
          )}
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-[#ebd7dc] shadow-2xs">
          <span className="text-[11px] font-medium text-[#7a8880] block">Total Fisik Bunga</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif font-bold text-2xl text-[#283830]">{totalPhysicalStock}</span>
            <span className="text-xs text-[#718077]">tangkai / pcs</span>
          </div>
          <span className="text-[10px] text-[#426a54] font-medium mt-1 block">Dari {products.length} varian produk</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#ebd7dc] shadow-2xs">
          <span className="text-[11px] font-medium text-[#7a8880] block">Nilai Aset Modal (HPP)</span>
          <div className="mt-1">
            <span className="font-serif font-bold text-lg sm:text-xl text-[#3f6351]">{formatIDR(totalAssetCost)}</span>
          </div>
          <span className="text-[10px] text-[#818e86] mt-1 block">Total biaya modal stok saat ini</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#ebd7dc] shadow-2xs">
          <span className="text-[11px] font-medium text-[#7a8880] block">Potensi Nilai Jual & Profit</span>
          <div className="mt-1">
            <span className="font-serif font-bold text-lg sm:text-xl text-[#b55e71]">{formatIDR(totalSellingVal)}</span>
          </div>
          <span className="text-[10px] text-[#3f6351] font-semibold mt-1 block">
            Potensi Untung: +{formatIDR(totalPotentialProfit)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#ebd7dc] shadow-2xs">
          <span className="text-[11px] font-medium text-[#7a8880] block">Status Peringatan Stok</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {lowStockCount} Menipis
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              {outOfStockCount} Habis
            </span>
          </div>
          <span className="text-[10px] text-[#718077] mt-1 block">Perlu restock segera</span>
        </div>

      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-[#ebd7dc] gap-4">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-[#3f6351] text-[#3f6351]'
              : 'border-transparent text-[#7a8880] hover:text-[#283830]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Daftar Stok Produk ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mutation_logs')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'mutation_logs'
              ? 'border-[#3f6351] text-[#3f6351]'
              : 'border-transparent text-[#7a8880] hover:text-[#283830]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Kartu Stok & Riwayat Mutasi ({inventoryLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: STOCK INVENTORY TABLE */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-3xl border border-[#f0dee3] shadow-xs overflow-hidden space-y-4 p-5">
          
          {/* Controls & Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ea8a2]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama bunga atau SKU..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#faf5f6] border border-[#edd7dd] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#c26274]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[#84928a] font-medium">Status:</span>
              {(['all', 'safe', 'low', 'out'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-[#3f6351] text-white'
                      : 'bg-[#faf8f7] text-[#55635c] border border-[#edd7dd] hover:bg-[#faedf0]'
                  }`}
                >
                  {st === 'all' ? 'Semua' : st === 'safe' ? 'Stok Aman' : st === 'low' ? 'Menipis' : 'Habis'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fbf5f7] border-y border-[#edd7dd] text-[#55635c] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-3">Bunga & SKU</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Harga Beli (HPP)</th>
                  <th className="py-3 px-3">Harga Jual</th>
                  <th className="py-3 px-3 text-center">Stok Fisik</th>
                  <th className="py-3 px-3 text-center">Batas Min.</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5e6ea]">
                {filteredProducts.map((p) => {
                  const threshold = p.minStockAlert || 3;
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= threshold;
                  const cost = p.costPrice || Math.round(p.price * 0.6);

                  return (
                    <tr key={p.id} className="hover:bg-[#faf5f6] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#ebd7dc]"
                          />
                          <div>
                            <span className="font-semibold text-[#283830] block">{p.name}</span>
                            <span className="font-mono text-[10px] text-[#8e9a92]">{p.sku || p.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#55635c]">{p.category}</td>

                      <td className="py-3 px-3 font-medium text-[#48564f]">
                        {formatIDR(cost)}
                      </td>

                      <td className="py-3 px-3 font-serif font-bold text-[#3f6351]">
                        {formatIDR(p.price)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-sm text-[#283830]">{p.stock}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenThreshold(p)}
                          className="hover:underline text-[#718077] font-semibold"
                          title="Klik untuk ubah batas alert"
                        >
                          {threshold} pcs
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Menipis ({p.stock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eef5f1] text-[#345744] border border-[#d6e5dc]">
                            Aman
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRestock(p)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-[#3f6351] text-white hover:bg-[#324f40] rounded-lg transition-colors"
                          >
                            + Restock
                          </button>
                          <button
                            onClick={() => handleOpenOpname(p)}
                            className="px-2 py-1 text-[11px] font-medium bg-[#fcf2f4] text-[#b55e71] hover:bg-[#fae4e9] border border-[#edd7dd] rounded-lg transition-colors"
                          >
                            Opname
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8e9c94]">
                      Tidak ada produk yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: INVENTORY MUTATION LOGS (KARTU STOK) */}
      {activeTab === 'mutation_logs' && (
        <div className="bg-white rounded-3xl border border-[#f0dee3] shadow-xs overflow-hidden space-y-4 p-5">
          
          {/* Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ea8a2]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama bunga, petugas, atau no. transaksi..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#faf5f6] border border-[#edd7dd] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#c26274]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[#84928a] font-medium">Tipe Mutasi:</span>
              {(['all', 'in', 'out', 'opname'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMutationTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    mutationTypeFilter === t
                      ? 'bg-[#3f6351] text-white'
                      : 'bg-[#faf8f7] text-[#55635c] border border-[#edd7dd] hover:bg-[#faedf0]'
                  }`}
                >
                  {t === 'all' ? 'Semua' : t === 'in' ? 'Masuk (Restock)' : t === 'out' ? 'Keluar (Penjualan)' : 'Stock Opname'}
                </button>
              ))}
            </div>
          </div>

          {/* Mutation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fbf5f7] border-y border-[#edd7dd] text-[#55635c] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Produk & SKU</th>
                  <th className="py-3 px-3">Jenis Mutasi</th>
                  <th className="py-3 px-3 text-center">Perubahan</th>
                  <th className="py-3 px-3 text-center">Stok Awal &rarr; Akhir</th>
                  <th className="py-3 px-3">Petugas</th>
                  <th className="py-3 px-3">Catatan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5e6ea]">
                {filteredLogs.map((log) => {
                  const isIn = log.type === 'in';
                  const isOut = log.type === 'out';
                  const isOpname = log.type === 'opname';

                  return (
                    <tr key={log.id} className="hover:bg-[#faf5f6] transition-colors">
                      <td className="py-3 px-3 text-[#718077] font-mono text-[11px] whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#283830] block">{log.productName}</span>
                        <span className="font-mono text-[10px] text-[#8e9a92]">{log.productSku}</span>
                      </td>

                      <td className="py-3 px-3">
                        {isIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eef5f1] text-[#345744] border border-[#d6e5dc]">
                            <ArrowDownRight className="w-3 h-3 text-[#3f6351]" /> Barang Masuk
                          </span>
                        ) : isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" /> Barang Keluar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <RotateCcw className="w-3 h-3 text-purple-600" /> Stock Opname
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-xs">
                        <span className={log.quantityChange > 0 ? 'text-[#3f6351]' : 'text-rose-600'}>
                          {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-xs text-[#55635c]">
                        {log.previousStock} &rarr; <strong className="text-[#283830]">{log.newStock}</strong>
                      </td>

                      <td className="py-3 px-3 text-[#495750]">{log.staffName}</td>

                      <td className="py-3 px-3 text-[#718077] max-w-xs truncate" title={log.notes}>
                        {log.notes}
                      </td>
                    </tr>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#8e9c94]">
                      Belum ada catatan mutasi inventaris.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* RESTOCK MODAL */}
      {isRestockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#f0dee3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-gradient-to-r from-[#3f6351] to-[#c76e80] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base">Restock Bunga Masuk</h3>
                <p className="text-xs text-[#faedf0]">Tambahkan stok fisik ke dalam database</p>
              </div>
              <button onClick={() => setIsRestockOpen(false)} className="text-white hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Product Info */}
              <div className="flex items-center gap-3 p-3 bg-[#fbf5f7] rounded-2xl border border-[#ebd7dc]">
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="font-semibold text-sm text-[#283830]">{selectedProduct.name}</h4>
                  <p className="text-[11px] text-[#718077]">Stok Saat Ini: <strong>{selectedProduct.stock} pcs</strong></p>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="font-semibold text-[#38463f] block mb-1">Jumlah Masuk (Pcs):</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-base font-bold px-3 py-2 bg-white border border-[#c8d9ce] rounded-xl focus:outline-hidden focus:border-[#3f6351]"
                />
                <span className="text-[10px] text-[#78887f] mt-1 block">
                  Stok baru akan menjadi: <strong>{selectedProduct.stock + restockQty} pcs</strong>
                </span>
              </div>

              {/* Cost Price */}
              <div>
                <label className="font-semibold text-[#38463f] block mb-1">Harga Beli / HPP Terkini (Rp/unit):</label>
                <input
                  type="number"
                  value={restockCostPrice || ''}
                  onChange={(e) => setRestockCostPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Contoh: 250000"
                  className="w-full px-3 py-2 bg-white border border-[#c8d9ce] rounded-xl focus:outline-hidden focus:border-[#3f6351]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-[#38463f] block mb-1">Catatan / Supplier / No. DO:</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Contoh: Petani Bunga Lembang PO-889"
                  className="w-full px-3 py-2 bg-white border border-[#edd7dd] rounded-xl focus:outline-hidden focus:border-[#c26274]"
                />
              </div>

              {/* Staff */}
              <div>
                <label className="font-semibold text-[#38463f] block mb-1">Nama Petugas Penerima:</label>
                <input
                  type="text"
                  value={restockStaff}
                  onChange={(e) => setRestockStaff(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#edd7dd] rounded-xl focus:outline-hidden focus:border-[#c26274]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveRestock}
                  className="flex-2 py-2.5 rounded-xl bg-[#3f6351] text-white font-bold hover:bg-[#324f40] disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Restock'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* STOCK OPNAME MODAL */}
      {isOpnameOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#f0dee3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-[#283830] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base">Audit Fisik (Stock Opname)</h3>
                <p className="text-xs text-gray-300">Sesuaikan stok sistem dengan fisik di toko</p>
              </div>
              <button onClick={() => setIsOpnameOpen(false)} className="text-white hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              <div className="p-3 bg-[#fbf5f7] rounded-2xl border border-[#ebd7dc]">
                <h4 className="font-semibold text-sm text-[#283830]">{selectedProduct.name}</h4>
                <div className="mt-1 flex justify-between text-[#718077]">
                  <span>Stok di Sistem:</span>
                  <strong className="text-black">{selectedProduct.stock} pcs</strong>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#38463f] block mb-1">Stok Fisik Riil Terhitung (Pcs):</label>
                <input
                  type="number"
                  min="0"
                  value={opnameActualStock}
                  onChange={(e) => setOpnameActualStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-base font-bold px-3 py-2 bg-white border border-[#c8d9ce] rounded-xl focus:outline-hidden focus:border-[#3f6351]"
                />
                
                {/* Selisih */}
                <div className="mt-2 p-2 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center text-xs">
                  <span>Selisih Hitung:</span>
                  <strong className={`text-sm ${
                    opnameActualStock - selectedProduct.stock < 0
                      ? 'text-rose-600'
                      : opnameActualStock - selectedProduct.stock > 0
                      ? 'text-[#3f6351]'
                      : 'text-gray-600'
                  }`}>
                    {opnameActualStock - selectedProduct.stock > 0 ? '+' : ''}
                    {opnameActualStock - selectedProduct.stock} pcs
                  </strong>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#38463f] block mb-1">Alasan Penyesuaian:</label>
                <select
                  value={opnameReason}
                  onChange={(e) => setOpnameReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#edd7dd] rounded-xl focus:outline-hidden"
                >
                  <option value="Sortasi rutin bunga layu">Sortasi rutin bunga layu</option>
                  <option value="Kerusakan kelopak / patah tangkai">Kerusakan kelopak / patah tangkai</option>
                  <option value="Koreksi salah input transaksi awal">Koreksi salah input transaksi awal</option>
                  <option value="Bonus / display etalase toko">Bonus / display etalase toko</option>
                  <option value="Hasil audit fisik bulanan">Hasil audit fisik bulanan</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#38463f] block mb-1">Nama Petugas Auditor:</label>
                <input
                  type="text"
                  value={opnameStaff}
                  onChange={(e) => setOpnameStaff(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#edd7dd] rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpnameOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveOpname}
                  className="flex-2 py-2.5 rounded-xl bg-[#283830] text-white font-bold hover:bg-black disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Stok Opname'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MIN STOCK ALERT THRESHOLD MODAL */}
      {isThresholdModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#f0dee3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#3f6351] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">Batas Peringatan Stok</h3>
              <button onClick={() => setIsThresholdModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-[#55635c]">
                Atur batas minimum stok untuk <strong>{selectedProduct.name}</strong>. Jika stok mencapai atau di bawah angka ini, status akan menjadi &ldquo;Menipis&rdquo;.
              </p>

              <div>
                <label className="font-semibold block mb-1">Batas Minimum (Pcs):</label>
                <input
                  type="number"
                  min="1"
                  value={minAlertVal}
                  onChange={(e) => setMinAlertVal(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-base font-bold px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsThresholdModalOpen(false)}
                  className="flex-1 py-2 border rounded-xl text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveThreshold}
                  className="flex-1 py-2 bg-[#3f6351] text-white font-bold rounded-xl"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

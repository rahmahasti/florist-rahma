import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Sparkles, 
  Sliders, 
  Save, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  X, 
  Edit3, 
  Tag, 
  RefreshCw,
  Layers,
  Calculator
} from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import { updateProductPricing, bulkApplyMarkupRatio } from '../../services/productService';
import { formatIDR } from '../../utils/formatters';

interface PriceProfitSettingsProps {
  products: Product[];
  onOpenInventory?: () => void;
  onOpenPos?: () => void;
}

export const PriceProfitSettings: React.FC<PriceProfitSettingsProps> = ({
  products,
  onOpenInventory,
  onOpenPos,
}) => {
  // Playground Simulator State
  const [simCostPrice, setSimCostPrice] = useState<number>(250000);
  const [simMarkupRatio, setSimMarkupRatio] = useState<number>(50); // in percent
  const [simAutoRound, setSimAutoRound] = useState<boolean>(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Single Product Edit Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalCostPrice, setModalCostPrice] = useState<number>(0);
  const [modalMarkupRatio, setModalMarkupRatio] = useState<number>(50);
  const [modalSellingPrice, setModalSellingPrice] = useState<number>(0);

  // Batch Update Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchCategory, setBatchCategory] = useState<string>('Semua');
  const [batchMarkupPercent, setBatchMarkupPercent] = useState<number>(50);
  const [isApplyingBatch, setIsApplyingBatch] = useState(false);

  // Status & Feedback
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Simulator Calculation
  const simResults = useMemo(() => {
    const rawSelling = simCostPrice * (1 + simMarkupRatio / 100);
    const finalSelling = simAutoRound ? Math.round(rawSelling / 1000) * 1000 : Math.round(rawSelling);
    const profitNominal = Math.max(0, finalSelling - simCostPrice);
    const marginPercent = finalSelling > 0 ? Math.round((profitNominal / finalSelling) * 100) : 0;

    return {
      suggestedPrice: finalSelling,
      profitNominal,
      marginPercent,
    };
  }, [simCostPrice, simMarkupRatio, simAutoRound]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === 'Semua' || p.category === categoryFilter;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, categoryFilter, searchQuery]);

  // Overall Catalog Averages
  const catalogStats = useMemo(() => {
    if (products.length === 0) return { avgMarkup: 0, avgMargin: 0, totalPotentialCatalogProfit: 0 };
    let totalMarkup = 0;
    let totalMargin = 0;
    let totalProfit = 0;

    products.forEach((p) => {
      const cost = p.costPrice || Math.round(p.price * 0.6);
      const profit = Math.max(0, p.price - cost);
      const markup = cost > 0 ? ((p.price - cost) / cost) * 100 : 0;
      const margin = p.price > 0 ? (profit / p.price) * 100 : 0;

      totalMarkup += markup;
      totalMargin += margin;
      totalProfit += profit * p.stock;
    });

    return {
      avgMarkup: Math.round(totalMarkup / products.length),
      avgMargin: Math.round(totalMargin / products.length),
      totalPotentialCatalogProfit: totalProfit,
    };
  }, [products]);

  // Open Edit Modal for Single Product
  const handleOpenEdit = (product: Product) => {
    const cost = product.costPrice || Math.round(product.price * 0.6);
    const markup = cost > 0 ? Math.round(((product.price - cost) / cost) * 100) : 50;

    setEditingProduct(product);
    setModalCostPrice(cost);
    setModalMarkupRatio(markup);
    setModalSellingPrice(product.price);
  };

  // Recalculate Selling Price in Modal when Cost or Markup changes
  const handleModalCostOrMarkupChange = (newCost: number, newMarkup: number) => {
    setModalCostPrice(newCost);
    setModalMarkupRatio(newMarkup);
    const rawPrice = newCost * (1 + newMarkup / 100);
    const rounded = Math.round(rawPrice / 1000) * 1000;
    setModalSellingPrice(rounded);
  };

  // Recalculate Markup in Modal when Selling Price is directly changed
  const handleModalSellingPriceChange = (newPrice: number) => {
    setModalSellingPrice(newPrice);
    if (modalCostPrice > 0) {
      const calculatedMarkup = Math.round(((newPrice - modalCostPrice) / modalCostPrice) * 100);
      setModalMarkupRatio(calculatedMarkup);
    }
  };

  // Save Single Product Pricing
  const handleSaveSinglePricing = async () => {
    if (!editingProduct) return;
    try {
      setIsSaving(true);
      await updateProductPricing(editingProduct.id, modalCostPrice, modalSellingPrice);
      showFeedback(`Harga untuk ${editingProduct.name} berhasil diperbarui!`);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan harga ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Batch Preview Items
  const batchPreviewItems = useMemo(() => {
    return products
      .filter((p) => batchCategory === 'Semua' || p.category === batchCategory)
      .map((p) => {
        const cost = p.costPrice || Math.round(p.price * 0.6);
        const newPrice = Math.round((cost * (1 + batchMarkupPercent / 100)) / 1000) * 1000;
        const diff = newPrice - p.price;
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          costPrice: cost,
          oldPrice: p.price,
          newPrice,
          diff,
          markupPercent: batchMarkupPercent,
        };
      });
  }, [products, batchCategory, batchMarkupPercent]);

  // Execute Batch Update to Firestore
  const handleExecuteBatchUpdate = async () => {
    if (batchPreviewItems.length === 0) return;

    try {
      setIsApplyingBatch(true);
      const itemsToUpdate = batchPreviewItems.map((item) => ({
        id: item.id,
        costPrice: item.costPrice,
        markupPercent: item.markupPercent,
      }));

      await bulkApplyMarkupRatio(itemsToUpdate);
      showFeedback(`Berhasil menerapkan Auto Ratio ${batchMarkupPercent}% ke ${batchPreviewItems.length} produk!`);
      setIsBatchModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menerapkan update massal.');
    } finally {
      setIsApplyingBatch(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed top-24 right-6 z-50 bg-[#3f6351] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#99e0b8]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#f0dee3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#3f6351] text-white">
              <TrendingUp className="w-5 h-5 text-[#fdedf1]" />
            </span>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#283830]">Pengaturan Harga & Auto Ratio Profit</h2>
              <p className="text-xs text-[#718077]">
                Kalkulator otomatis harga jual berbasis Harga Beli (HPP) + target rasio profit (markup & margin)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#3f6351] hover:bg-[#324f40] text-white rounded-xl shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#fcedf1]" />
            <span>Terapkan Auto Ratio Massal</span>
          </button>

          {onOpenInventory && (
            <button
              onClick={onOpenInventory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#faf2f4] hover:bg-[#fae4e9] text-[#b55e71] border border-[#f2d8df] rounded-xl transition-all"
            >
              <Tag className="w-4 h-4 text-[#c26274]" />
              <span>Cek Stok & HPP</span>
            </button>
          )}

          {onOpenPos && (
            <button
              onClick={onOpenPos}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#f4f7f5] hover:bg-[#e9f0ec] text-[#3f6351] border border-[#dce8e1] rounded-xl transition-all"
            >
              <DollarSign className="w-4 h-4 text-[#4f7863]" />
              <span>Buka Kasir POS</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#ebd7dc] shadow-2xs">
          <span className="text-[11px] font-medium text-[#7a8880] block">Rata-Rata Rasio Markup Toko</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif font-bold text-2xl text-[#3f6351]">+{catalogStats.avgMarkup}%</span>
            <span className="text-xs text-[#718077]">dari Harga Beli</span>
          </div>
          <span className="text-[10px] text-[#426a54] mt-1 block">Margin bersih rata-rata: {catalogStats.avgMargin}%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#ebd7dc] shadow-2xs">
          <span className="text-[11px] font-medium text-[#7a8880] block">Rumus Penentuan Harga</span>
          <p className="mt-1 text-xs font-mono font-medium text-[#283830]">
            Harga Jual = HPP + (HPP &times; % Markup)
          </p>
          <span className="text-[10px] text-[#718077] mt-1 block">Auto pembulatan ke ribuan terdekat</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#ebd7dc] shadow-2xs">
          <span className="text-[11px] font-medium text-[#7a8880] block">Potensi Untung Seluruh Stok</span>
          <div className="mt-1">
            <span className="font-serif font-bold text-xl text-[#b55e71]">
              +{formatIDR(catalogStats.totalPotentialCatalogProfit)}
            </span>
          </div>
          <span className="text-[10px] text-[#3f6351] mt-1 block font-medium">Bila seluruh stok habis terjual</span>
        </div>
      </div>

      {/* INTERACTIVE SIMULATOR PLAYGROUND */}
      <div className="bg-gradient-to-br from-[#f2f7f4] via-[#fdf7f8] to-[#fbf2f4] p-5 sm:p-6 rounded-3xl border border-[#edd7dd] shadow-xs space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#3f6351] text-white flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[#fdedf1]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#283830]">
                Simulator Auto Ratio Profit Harga Jual
              </h3>
              <p className="text-xs text-[#718077]">
                Uji coba perbandingan Harga Beli vs Harga Jual & estimasi nominal keuntungan secara instan
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-white p-4 sm:p-5 rounded-2xl border border-[#ebd7dc]">
          
          {/* Inputs (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Cost Price Input */}
            <div>
              <label className="text-xs font-semibold text-[#38463f] flex items-center justify-between mb-1.5">
                <span>Harga Beli Modal / HPP:</span>
                <span className="text-[11px] font-mono text-[#3f6351] font-bold">{formatIDR(simCostPrice)}</span>
              </label>
              <input
                type="number"
                step="5000"
                value={simCostPrice || ''}
                onChange={(e) => setSimCostPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-base font-bold px-3.5 py-2 bg-[#faf8f7] border border-[#edd7dd] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#3f6351] text-[#283830]"
              />
            </div>

            {/* Markup Ratio Preset & Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#38463f]">
                  Target Auto Ratio Markup Profit:
                </label>
                <span className="font-bold text-sm text-[#b55e71] bg-[#fbf2f4] px-2.5 py-0.5 rounded-lg border border-[#f5d7df]">
                  +{simMarkupRatio}%
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {[20, 30, 40, 50, 60, 75, 100, 150].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setSimMarkupRatio(pct)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      simMarkupRatio === pct
                        ? 'bg-[#3f6351] text-white shadow-2xs font-bold'
                        : 'bg-[#faf8f7] hover:bg-[#fae7eb] text-[#55635c] border border-[#edd7dd]'
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={simMarkupRatio}
                onChange={(e) => setSimMarkupRatio(parseInt(e.target.value))}
                className="w-full accent-[#3f6351] cursor-pointer"
              />
            </div>

            {/* Auto round checkbox */}
            <label className="flex items-center gap-2 text-xs text-[#55635c] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={simAutoRound}
                onChange={(e) => setSimAutoRound(e.target.checked)}
                className="rounded accent-[#3f6351]"
              />
              <span>Bulatkan hasil usulan harga ke ribuan terdekat (cth: Rp 374.800 &rarr; Rp 375.000)</span>
            </label>

          </div>

          {/* Results Box (5 cols) */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#f4f7f5] to-[#fbf2f4] p-4 rounded-2xl border border-[#dce8e1] space-y-3">
            <span className="text-[11px] font-semibold text-[#426a54] uppercase tracking-wider block">
              Hasil Usulan Harga Jual:
            </span>

            <div className="bg-white p-3.5 rounded-xl border border-[#d6e5dc] text-center shadow-2xs">
              <span className="text-[11px] text-[#718077] block">Rekomendasi Harga Jual Konsumen:</span>
              <span className="font-serif font-bold text-2xl sm:text-3xl text-[#3f6351] mt-0.5 block">
                {formatIDR(simResults.suggestedPrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-[#ebd7dc]">
                <span className="text-[10px] text-[#718077] block">Keuntungan / Unit:</span>
                <strong className="text-sm font-bold text-[#b55e71]">
                  +{formatIDR(simResults.profitNominal)}
                </strong>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-[#d6e5dc]">
                <span className="text-[10px] text-[#718077] block">Margin Keuntungan:</span>
                <strong className="text-sm font-bold text-[#3f6351]">
                  {simResults.marginPercent}%
                </strong>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* PRODUCTS PRICING TABLE */}
      <div className="bg-white rounded-3xl border border-[#f0dee3] shadow-xs overflow-hidden space-y-4 p-5">
        
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            {['Semua', 'Buket Bunga', 'Standing Flower', 'Bunga Meja'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#3f6351] text-white'
                    : 'bg-[#faf8f7] text-[#55635c] border border-[#edd7dd] hover:bg-[#faedf0]'
                }`}
              >
                {cat}
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
                <th className="py-3 px-3 text-center">Ratio Markup %</th>
                <th className="py-3 px-3">Harga Jual</th>
                <th className="py-3 px-3">Untung / Unit</th>
                <th className="py-3 px-3 text-center">Margin %</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5e6ea]">
              {filteredProducts.map((p) => {
                const cost = p.costPrice || Math.round(p.price * 0.6);
                const profit = Math.max(0, p.price - cost);
                const markup = cost > 0 ? Math.round(((p.price - cost) / cost) * 100) : 0;
                const margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;

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

                    <td className="py-3 px-3 font-semibold text-[#48564f]">
                      {formatIDR(cost)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eef5f1] text-[#345744] border border-[#d6e5dc]">
                        +{markup}%
                      </span>
                    </td>

                    <td className="py-3 px-3 font-serif font-bold text-sm text-[#3f6351]">
                      {formatIDR(p.price)}
                    </td>

                    <td className="py-3 px-3 font-semibold text-[#b55e71]">
                      +{formatIDR(profit)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-xs text-[#283830]">{margin}%</span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#faf2f4] hover:bg-[#fae4e9] text-[#b55e71] border border-[#f2d8df] rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Atur Harga</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#8e9c94]">
                    Tidak ada produk yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* SINGLE PRODUCT PRICING MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#f0dee3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-gradient-to-r from-[#3f6351] to-[#c76e80] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base">Atur Harga & Auto Ratio Profit</h3>
                <p className="text-xs text-[#faedf0]">{editingProduct.name}</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-white hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Product Card Info */}
              <div className="flex items-center gap-3 p-3 bg-[#fbf5f7] rounded-2xl border border-[#ebd7dc]">
                <img src={editingProduct.imageUrl} alt={editingProduct.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="font-semibold text-sm text-[#283830]">{editingProduct.name}</h4>
                  <p className="text-[11px] text-[#718077]">{editingProduct.category} • Stok: {editingProduct.stock} pcs</p>
                </div>
              </div>

              {/* Input HPP (Harga Beli) */}
              <div>
                <label className="font-semibold text-[#38463f] block mb-1">
                  1. Harga Beli Modal / HPP (Rp):
                </label>
                <input
                  type="number"
                  step="5000"
                  value={modalCostPrice || ''}
                  onChange={(e) => handleModalCostOrMarkupChange(Math.max(0, parseInt(e.target.value) || 0), modalMarkupRatio)}
                  className="w-full text-base font-bold px-3 py-2 bg-white border border-[#c8d9ce] rounded-xl focus:outline-hidden focus:border-[#3f6351]"
                />
              </div>

              {/* Auto Ratio Markup Buttons */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-[#38463f]">2. Target Auto Ratio Markup (%):</label>
                  <span className="font-bold text-[#b55e71]">+{modalMarkupRatio}%</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[25, 35, 50, 60, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleModalCostOrMarkupChange(modalCostPrice, pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        modalMarkupRatio === pct
                          ? 'bg-[#3f6351] text-white font-bold'
                          : 'bg-[#faf8f7] border border-[#edd7dd] text-[#55635c] hover:bg-[#faedf0]'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={modalMarkupRatio}
                  onChange={(e) => handleModalCostOrMarkupChange(modalCostPrice, parseInt(e.target.value))}
                  className="w-full accent-[#3f6351]"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="font-semibold text-[#38463f] block mb-1">
                  3. Harga Jual Akhir Konsumen (Rp):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={modalSellingPrice || ''}
                  onChange={(e) => handleModalSellingPriceChange(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-lg font-serif font-bold px-3 py-2 bg-[#f4f7f5] border border-[#3f6351] text-[#3f6351] rounded-xl focus:outline-hidden"
                />
                <span className="text-[10px] text-[#718077] mt-1 block">
                  Anda juga bisa mengedit harga jual ini langsung, dan ratio markup akan dihitung otomatis.
                </span>
              </div>

              {/* Profit preview */}
              <div className="p-3 bg-[#fbf5f7] rounded-xl border border-[#ebd7dc] flex justify-between items-center">
                <span>Keuntungan Bersih / Unit:</span>
                <strong className="text-sm font-bold text-[#b55e71]">
                  +{formatIDR(Math.max(0, modalSellingPrice - modalCostPrice))}
                </strong>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveSinglePricing}
                  className="flex-2 py-2.5 rounded-xl bg-[#3f6351] text-white font-bold hover:bg-[#324f40] disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Harga Baru'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* BATCH / MASS UPDATE AUTO RATIO MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#f0dee3] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-gradient-to-r from-[#3f6351] to-[#c76e80] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base">Terapkan Auto Ratio Markup Massal</h3>
                <p className="text-xs text-[#faedf0]">Hitung ulang harga jual berdasarkan % keuntungan</p>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-white hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs flex-1 overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#38463f] block mb-1">Target Kategori:</label>
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf8f7] border border-[#edd7dd] rounded-xl text-xs"
                  >
                    <option value="Semua">Semua Kategori (12 Produk)</option>
                    <option value="Buket Bunga">Khusus Buket Bunga</option>
                    <option value="Standing Flower">Khusus Standing Flower</option>
                    <option value="Bunga Meja">Khusus Bunga Meja</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#38463f] block mb-1">Target Auto Ratio Markup:</label>
                  <select
                    value={batchMarkupPercent}
                    onChange={(e) => setBatchMarkupPercent(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-[#faf8f7] border border-[#edd7dd] rounded-xl text-xs font-bold text-[#3f6351]"
                  >
                    <option value={30}>+30% Markup</option>
                    <option value={40}>+40% Markup</option>
                    <option value={50}>+50% Markup (Rekomendasi Florist)</option>
                    <option value={60}>+60% Markup</option>
                    <option value={75}>+75% Markup</option>
                    <option value={100}>+100% (2x Lipat dari HPP)</option>
                  </select>
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-[#ebd7dc] rounded-2xl overflow-hidden">
                <div className="bg-[#fbf5f7] px-3 py-2 font-semibold text-[#38463f] border-b border-[#ebd7dc]">
                  Preview Perubahan Harga ({batchPreviewItems.length} Produk Terpilih):
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-[#f7eaee]">
                  {batchPreviewItems.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#283830] block truncate max-w-xs">{item.name}</span>
                        <span className="text-[10px] text-[#718077]">HPP: {formatIDR(item.costPrice)}</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-[#84928a] line-through text-[11px]">{formatIDR(item.oldPrice)}</span>
                          <span className="font-serif font-bold text-[#3f6351] text-xs">&rarr; {formatIDR(item.newPrice)}</span>
                        </div>
                        <span className={`text-[10px] font-semibold ${item.diff >= 0 ? 'text-[#3f6351]' : 'text-rose-600'}`}>
                          {item.diff >= 0 ? `+${formatIDR(item.diff)}` : formatIDR(item.diff)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isApplyingBatch || batchPreviewItems.length === 0}
                onClick={handleExecuteBatchUpdate}
                className="flex-2 py-2.5 rounded-xl bg-[#3f6351] text-white font-bold text-xs hover:bg-[#324f40] disabled:opacity-50"
              >
                {isApplyingBatch ? 'Menerapkan ke Database...' : `Terapkan ke ${batchPreviewItems.length} Produk`}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

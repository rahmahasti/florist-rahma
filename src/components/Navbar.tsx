import React from 'react';
import { 
  ShoppingBag, 
  Search, 
  ShieldCheck, 
  Clock, 
  Flower2, 
  CheckCircle2, 
  Sparkles,
  LayoutDashboard,
  Store
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Order } from '../types';

interface NavbarProps {
  onOpenOrderTracker: () => void;
  currentView: 'store' | 'admin';
  setCurrentView: (view: 'store' | 'admin') => void;
  orders: Order[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenOrderTracker,
  currentView,
  setCurrentView,
  orders,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const { totalItems, setIsCartOpen } = useCart();

  // Count orders pending payment approval for admin notification badge
  const pendingApprovalCount = orders.filter(
    (o) => o.paymentStatus === 'paid_waiting_approval'
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#f4e2e6] transition-all shadow-xs">
      {/* Top Announcement Bar: Soft muted sage green with soft blush pink text */}
      <div className="bg-[#3e5b4e] text-[#faedf0] text-xs py-1.5 px-4 font-normal tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#fcd3dd]" />
            <span>Gratis Pengiriman & Kartu Ucapan Kaligrafi Khusus Wilayah Jabodetabek</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[#f5dce2]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#fcd3dd]" /> Same Day Delivery Buka Setiap Hari
            </span>
            <span className="border-l border-[#557767] pl-3 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#d2e8dc]" /> 100% Garansi Bunga Segar Pilihan
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand with Soft Sage & Blush Pink Harmony */}
          <button 
            onClick={() => setCurrentView('store')}
            className="flex items-center gap-3 text-left group focus:outline-hidden"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3f6351] via-[#567c69] to-[#d68b9a] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Flower2 className="w-6 h-6 text-[#fdf0f3]" />
            </div>
            <div>
              <span className="text-2xl font-serif font-bold tracking-tight text-[#283830] group-hover:text-[#3f6351] transition-colors">
                Floristique
              </span>
              <p className="text-[10px] tracking-widest uppercase font-medium text-[#b55e71] flex items-center gap-1.5">
                <span>Atelier de Fleurs</span>
                <span className="w-1 h-1 rounded-full bg-[#527764] inline-block"></span>
                <span className="text-[#527764]">Boutique</span>
              </p>
            </div>
          </button>

          {/* Search Bar (Store view only) */}
          {currentView === 'store' && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ea8a2]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari buket mawar, standing flower, atau bunga meja..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-[#faf4f6]/60 border border-[#f2d8df] rounded-full focus:bg-white focus:outline-hidden focus:border-[#c26274] focus:ring-2 focus:ring-[#fcebef] transition-all text-[#333d37] placeholder:text-[#9ea8a2]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a3a3a3] hover:text-[#b55e71]"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Lacak Pesanan Button */}
            <button
              onClick={onOpenOrderTracker}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-[#46534c] hover:text-[#3f6351] hover:bg-[#f2f7f4] rounded-xl transition-colors"
              title="Lacak status pesanan Anda"
            >
              <CheckCircle2 className="w-4 h-4 text-[#4f7863]" />
              <span className="hidden sm:inline">Lacak Pesanan</span>
            </button>

            {/* Shopping Cart Button with Soft Blush & Sage Theme */}
            {currentView === 'store' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-[#fcf2f4] text-[#3f6351] hover:bg-[#fae7eb] rounded-xl transition-all border border-[#f5d7df] shadow-2xs"
                aria-label="Keranjang Belanja"
              >
                <ShoppingBag className="w-4 h-4 text-[#c26274]" />
                <span className="hidden sm:inline font-semibold">Keranjang</span>
                {totalItems > 0 && (
                  <span className="bg-[#cc6379] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-2xs">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {/* Seamless Mode Switcher: Toko vs Admin Panel (no login button) */}
            <div className="flex items-center border-l border-[#f0dce1] pl-2 sm:pl-3">
              <button
                onClick={() => setCurrentView(currentView === 'admin' ? 'store' : 'admin')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all ${
                  currentView === 'admin'
                    ? 'bg-[#3f6351] text-white shadow-xs'
                    : 'bg-[#f4f7f5] text-[#3f6351] hover:bg-[#e9f0ec] border border-[#dce8e1]'
                }`}
                title="Beralih antara Toko Bunga dan Panel Admin"
              >
                {currentView === 'admin' ? (
                  <>
                    <Store className="w-4 h-4 text-[#fae1e6]" />
                    <span>Kembali ke Toko</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-4 h-4 text-[#4f7863]" />
                    <span>Panel Admin</span>
                    {pendingApprovalCount > 0 && (
                      <span className="bg-[#cc6379] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                        {pendingApprovalCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Category Navigation Bar with Soft Sage & Blush active states */}
        {currentView === 'store' && (
          <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto py-2.5 border-t border-[#faedf0] scrollbar-none text-xs sm:text-sm">
            <span className="text-[#8c9690] font-medium px-2 hidden sm:inline">Koleksi:</span>
            {['Semua', 'Buket Bunga', 'Standing Flower', 'Bunga Meja'].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full font-medium transition-all ${
                    isActive
                      ? 'bg-[#3f6351] text-white shadow-2xs ring-1 ring-[#e2bac3]'
                      : 'text-[#58645d] hover:text-[#b55e71] hover:bg-[#fcf2f4]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

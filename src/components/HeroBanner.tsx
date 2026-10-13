import React from 'react';
import { Sparkles, Truck, ShieldCheck, HeartHandshake, ArrowRight, Flower } from 'lucide-react';

interface HeroBannerProps {
  onCategoryClick: (category: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onCategoryClick }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#fdf7f8] via-[#faf8f7] to-[#f4f7f5] pt-8 pb-12 sm:pb-16 border-b border-[#f2e1e5]">
      {/* Soft Ambient Background Orbs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#fce4e9]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#e3f0e8]/45 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fcedf0] text-[#9c4355] text-xs font-semibold tracking-wide uppercase border border-[#f5d5db] shadow-2xs">
              <Flower className="w-3.5 h-3.5 text-[#b5586b]" />
              <span>Koleksi Bunga Segar • Sentuhan Lembut Hijau & Merah Muda</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#273830] tracking-tight leading-[1.18]">
              Rangkaian Bunga Mewah untuk Momen Paling <span className="text-[#b5586b] italic font-normal">Istimewa</span> & <span className="text-[#3f6351] italic font-normal">Berkesan</span>
            </h1>

            <p className="text-base sm:text-lg text-[#55635b] max-w-2xl font-normal leading-relaxed mx-auto lg:mx-0">
              Perpaduan keanggunan buket mawar cinta beraroma lembut, standing flower ucapan megah, dan bloom box eksklusif. Dirangkai dengan bunga segar kualitas ekspor dan garansi keindahan 100%.
            </p>

            {/* Category Quick Pills */}
            <div className="pt-2 flex flex-wrap gap-2.5 justify-center lg:justify-start">
              <button
                onClick={() => onCategoryClick('Buket Bunga')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3f6351] text-white rounded-xl text-sm font-medium hover:bg-[#345343] transition-all shadow-xs group"
              >
                <span>Lihat Buket Bunga</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#fcdfe5]" />
              </button>
              <button
                onClick={() => onCategoryClick('Standing Flower')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#3f4a43] border border-[#e8d5da] rounded-xl text-sm font-medium hover:bg-[#fdf5f6] hover:text-[#9c4355] transition-all shadow-2xs"
              >
                <span>Standing Flower</span>
              </button>
              <button
                onClick={() => onCategoryClick('Bunga Meja')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#fcf0f3] text-[#9c4355] border border-[#f5d7de] rounded-xl text-sm font-medium hover:bg-[#fae3e8] transition-all shadow-2xs"
              >
                <span>Bunga Meja & Box</span>
              </button>
            </div>

            {/* Value Guarantees with Soft Pastel Badges */}
            <div className="pt-6 grid grid-cols-3 gap-3 border-t border-[#f0dee2] text-left">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#eaf2ee] text-[#3f6351] shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#273830]">Same-Day Delivery</h4>
                  <p className="text-[11px] text-[#6d7971]">Kirim di hari yang sama</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#fbf0f2] text-[#b5586b] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#273830]">Garansi Segar 100%</h4>
                  <p className="text-[11px] text-[#6d7971]">Tahan 3-5 hari ke depan</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#eaf2ee] text-[#3f6351] shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#273830]">Kartu Ucapan Gratis</h4>
                  <p className="text-[11px] text-[#6d7971]">Pita sutra & kaligrafi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Featured Visuals with Soft Styling */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-[#fcedf0]/40 aspect-4/5 ring-1 ring-[#f2d8de]">
                <img
                  src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=85"
                  alt="Floristique Signature Bouquet"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b2621]/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#fcd8e0]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Signature Bouquet</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white mt-1">Velvet Red Rose Romance</h3>
                  <p className="text-xs text-[#fae1e6] mt-1">
                    20 Tangkai Mawar Merah Ekuador berbalut eucalyptus hijau dan wrapping lembut.
                  </p>
                </div>
              </div>

              {/* Floating review card in Soft Pastel Theme */}
              <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-[#f0dce1] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#436955] to-[#c76e80] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  ★ 4.9
                </div>
                <div>
                  <p className="text-xs font-bold text-[#283830]">1,200+ Pelanggan Bahagia</p>
                  <p className="text-[11px] text-[#b5586b] font-medium">Boutique rating tertinggi</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

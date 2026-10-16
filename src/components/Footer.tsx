import React from 'react';
import { Flower2, Phone, Mail, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-[#2f453a] text-[#f7e6ea] pt-16 pb-12 border-t border-[#3e5b4d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#3e5b4d]/80">
          
          {/* Brand & Vision */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3f6351] to-[#c76e80] text-white flex items-center justify-center font-bold shadow-xs">
                <Flower2 className="w-6 h-6 text-[#fdf0f3]" />
              </div>
              <div>
                <span className="text-2xl font-serif font-bold text-white tracking-tight">
                  Rahma Florist
                </span>
                <p className="text-[10px] tracking-widest uppercase text-[#fcd3dd] font-medium">
                  Atelier de Fleurs & Boutique
                </p>
              </div>
            </div>

            <p className="text-xs text-[#fae1e7]/80 leading-relaxed max-w-sm">
              Rahma Florist menghadirkan mahakarya bunga segar bernuansa botanical hijau dan kelopak pink nan anggun. Setiap tangkai dirangkai dengan dedikasi tinggi untuk merayakan setiap rasa kasih dan momen bermakna.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#fcd3dd] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#8bd1ab]" />
              <span>Garansi 100% Bunga Segar & Pengiriman Tepat Waktu</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Koleksi Unggulan
            </h4>
            <ul className="space-y-2 text-xs text-[#fae1e7]/75">
              <li className="hover:text-white cursor-pointer transition-colors">
                • Buket Bunga Mawar Merah & Pastel Pink
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                • Standing Flower Grand Opening & Promosi
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                • Standing Flower Duka Cita & Belasungkawa
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                • Bloom Box & Bunga Meja Vas Kaca
              </li>
              <li className="hover:text-white cursor-pointer transition-colors">
                • Anggrek Bulan (Phalaenopsis Orchid)
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Layanan Pelanggan & Atelier
            </h4>
            <div className="space-y-2.5 text-xs text-[#fae1e7]/75">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#fcd3dd] shrink-0 mt-0.5" />
                <span>Rahma Florist Studio, Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#fcd3dd] shrink-0" />
                <span>Buka Setiap Hari: 07.00 - 21.00 WIB (Same Day Service)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#fcd3dd] shrink-0" />
                <span>WhatsApp Customer Support: +62 812-8899-7766</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#fcd3dd] shrink-0" />
                <span>Email: contact@rahmaflorist.id</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar - clean without login button */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#fae1e7]/60">
          <p className="flex items-center gap-1">
            © {new Date().getFullYear()} Rahma Florist Marketplace. Dibuat dengan harmoni hijau & pink <Heart className="w-3.5 h-3.5 text-[#f7aab9] fill-[#f7aab9] inline" /> untuk setiap momen bermakna.
          </p>

          <div className="flex items-center gap-4 text-[#8bd1ab]">
            <span>Database: Google Cloud Firestore Real-Time</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

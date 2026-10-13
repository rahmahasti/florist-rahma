import React, { useState } from 'react';
import { ShoppingBag, Star, Eye, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatIDR } from '../utils/formatters';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { addToCart } = useCart();
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = addToCart(product, 1);
    if (result.success) {
      setIsAddedFeedback(true);
      setTimeout(() => setIsAddedFeedback(false), 1500);
    }
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div 
      onClick={() => onViewDetails(product)}
      className="group relative bg-white rounded-2xl border border-[#f0dee2] overflow-hidden shadow-2xs hover:shadow-lg hover:shadow-[#fcebed]/80 hover:border-[#e2b8c2] transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Image Container with Soft Pastels */}
      <div className="relative aspect-4/3 bg-[#fbf4f6]/60 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Badges (Soft Rose & Sage) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.tag && (
            <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-[#be6477] text-white shadow-2xs">
              {product.tag}
            </span>
          )}
          <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-md bg-white/95 backdrop-blur-xs text-[#395746] shadow-2xs border border-[#deebd4]">
            {product.category}
          </span>
        </div>

        {/* Stock Status Badge (Top Right) */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-md bg-[#a84457] text-white flex items-center gap-1 shadow-2xs">
              <AlertCircle className="w-3 h-3" /> Habis
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#cf7083] text-white shadow-2xs animate-pulse">
              Sisa {product.stock}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#416653] text-[#f2faf5] shadow-2xs">
              Stok: {product.stock}
            </span>
          )}
        </div>

        {/* Quick View Button overlay on hover */}
        <div className="absolute inset-0 bg-stone-900/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#2c3831] text-xs font-semibold shadow-xs transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-[#b5586b]" /> Lihat Detail
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating and Sold count */}
          <div className="flex items-center justify-between text-xs text-[#707c74] mb-1.5">
            <div className="flex items-center gap-1 text-[#d98b48] font-semibold">
              <Star className="w-3.5 h-3.5 fill-[#e8a368] text-[#e8a368]" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-[#a85062] font-medium text-[11px]">{product.soldCount} terjual</span>
          </div>

          <h3 className="font-serif font-bold text-[#273830] text-base sm:text-lg line-clamp-1 group-hover:text-[#a85062] transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-[#637068] line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Add to Cart button */}
        <div className="pt-2 border-t border-[#f4e6e9] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#8a968f] tracking-wider block">Harga</span>
            <span className="text-base sm:text-lg font-bold text-[#324f40] font-serif">
              {formatIDR(product.price)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isOutOfStock
                ? 'bg-[#f0ebeb] text-[#9c9a9a] cursor-not-allowed'
                : isAddedFeedback
                ? 'bg-[#b85468] text-white'
                : 'bg-[#3f6351] text-white hover:bg-[#335242] active:scale-95 shadow-2xs'
            }`}
            title={isOutOfStock ? 'Stok habis' : 'Tambah ke keranjang belanja'}
          >
            {isAddedFeedback ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Ditambah</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-[#fae1e6]" />
                <span>{isOutOfStock ? 'Habis' : '+ Keranjang'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, ShoppingBag, Star, Check, ShieldCheck, Truck, Sparkles, Layers, Ruler } from 'lucide-react';
import { Product } from '../types';
import { formatIDR } from '../utils/formatters';
import { useCart } from '../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    const result = addToCart(product, quantity);
    if (result.success) {
      setIsAddedFeedback(true);
      setTimeout(() => {
        setIsAddedFeedback(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden border border-[#eed0d7] flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-[#fcf0f2] text-[#4d5c53] hover:text-[#b5586b] transition-colors shadow-2xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Image Section */}
        <div className="md:w-1/2 relative bg-[#faf2f4]/60 min-h-[280px] md:min-h-full">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-[#385947]/90 text-[#fae6ea] backdrop-blur-xs">
              {product.category}
            </span>
            {product.tag && (
              <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-md bg-[#be6477] text-white shadow-2xs">
                {product.tag}
              </span>
            )}
          </div>
        </div>

        {/* Right Details Section */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#6e7a72] mb-2">
                <div className="flex items-center gap-1 text-[#d98b48] font-bold">
                  <Star className="w-4 h-4 fill-[#e8a368] text-[#e8a368]" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span className="text-[#a85062] font-medium">{product.soldCount} pesanan terkirim</span>
              </div>

              <h2 className="text-2xl font-serif font-bold text-[#273830] leading-snug">
                {product.name}
              </h2>

              <div className="mt-2 text-2xl font-serif font-bold text-[#324f40]">
                {formatIDR(product.price)}
              </div>
            </div>

            <p className="text-sm text-[#55635b] leading-relaxed">
              {product.description}
            </p>

            {/* Specifications */}
            <div className="space-y-2 pt-2 border-t border-[#f2e1e5] text-xs text-[#5f6d65]">
              {product.flowerTypes && product.flowerTypes.length > 0 && (
                <div className="flex items-start gap-2">
                  <Layers className="w-4 h-4 text-[#436b55] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#273830]">Komposisi Bunga: </span>
                    <span>{product.flowerTypes.join(', ')}</span>
                  </div>
                </div>
              )}
              {product.dimensions && (
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#436b55] shrink-0" />
                  <div>
                    <span className="font-semibold text-[#273830]">Dimensi Rangkaian: </span>
                    <span>{product.dimensions}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#a85062]">
                <Sparkles className="w-4 h-4 text-[#be6477] shrink-0" />
                <span className="font-medium">Termasuk Pita Sutra Satin & Kartu Ucapan Custom</span>
              </div>
            </div>

            {/* Stock status indicator */}
            <div className="p-3 rounded-xl bg-[#fcf2f4]/60 border border-[#f2d8df] flex items-center justify-between text-xs">
              <span className="text-[#55635b] font-medium">Ketersediaan Stok Real-Time:</span>
              <span className={`font-bold ${
                isOutOfStock ? 'text-[#a84457]' : product.stock <= 5 ? 'text-[#b5586b]' : 'text-[#395c47]'
              }`}>
                {isOutOfStock ? 'Habis di Database' : `${product.stock} Tersedia`}
              </span>
            </div>
          </div>

          {/* Action bottom */}
          <div className="pt-6 border-t border-[#f2e1e5] space-y-4">
            {!isOutOfStock && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#3d4b43]">Jumlah Pesanan:</span>
                <div className="flex items-center border border-[#e8d2d7] rounded-xl overflow-hidden bg-[#faf4f6]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-sm text-[#4d5c53] hover:bg-[#fae7eb] transition-colors disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-[#273830] bg-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1.5 text-sm text-[#4d5c53] hover:bg-[#fae7eb] transition-colors disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : isAddedFeedback
                  ? 'bg-[#be6477] text-white'
                  : 'bg-[#3f6351] hover:bg-[#345343] text-white active:scale-98'
              }`}
            >
              {isAddedFeedback ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Berhasil Ditambahkan!</span>
                </>
              ) : isOutOfStock ? (
                <span>Maaf, Stok Produk Ini Habis</span>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 text-[#fcdfe5]" />
                  <span>Tambahkan ke Keranjang ({formatIDR(product.price * quantity)})</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatIDR } from '../utils/formatters';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const { 
    items, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    totalItems 
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col border-l border-[#ebd0d6]">
          
          {/* Drawer Header with Soft Sage & Blush Pink */}
          <div className="p-5 border-b border-[#f2dee3] flex items-center justify-between bg-gradient-to-r from-[#fdf4f6] to-[#f4f8f5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fce4ea] flex items-center justify-center text-[#b5586b]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#273830] text-lg">Keranjang Belanja</h3>
                <p className="text-xs text-[#a85062] font-medium">{totalItems} tangkai / rangkaian bunga pilihan</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#7f8c84] hover:text-[#b5586b] rounded-full hover:bg-[#fcedf0] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#fdf2f4] text-[#b5586b] flex items-center justify-center border border-[#f5d7de]">
                  <ShoppingBag className="w-8 h-8 opacity-70" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#283830] text-base">Keranjang Anda Kosong</h4>
                  <p className="text-xs text-[#6a7770] mt-1 max-w-xs">
                    Pilih buket mawar, standing flower, atau bloom box favorit Anda untuk mulai berbelanja.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#3f6351] text-white text-xs font-semibold hover:bg-[#345343] transition-all shadow-2xs"
                >
                  Jelajahi Bunga
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const isMax = quantity >= product.stock;
                return (
                  <div 
                    key={product.id}
                    className="flex gap-3.5 p-3.5 rounded-2xl border border-[#f2dee3] bg-white hover:border-[#dfb5be] transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#faf2f4] shrink-0 border border-[#f0dce1]">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif font-bold text-[#283830] text-sm line-clamp-1">
                            {product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-[#9ea8a2] hover:text-[#b5586b] p-1 transition-colors"
                            title="Hapus dari keranjang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-[#a85062] font-semibold block">
                          {product.category}
                        </span>
                        <div className="text-xs font-bold text-[#324f40] mt-0.5">
                          {formatIDR(product.price)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-[#e8d2d7] rounded-lg overflow-hidden bg-[#faf4f6]">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1, product.stock)}
                            className="px-2.5 py-0.5 text-xs text-[#526157] hover:bg-[#fae6ea] transition-colors"
                          >
                            -
                          </button>
                          <span className="px-3 py-0.5 text-xs font-semibold text-[#283830] bg-white">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1, product.stock)}
                            disabled={isMax}
                            className="px-2.5 py-0.5 text-xs text-[#526157] hover:bg-[#fae6ea] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-bold text-[#283830]">
                          {formatIDR(product.price * quantity)}
                        </span>
                      </div>
                      
                      {isMax && (
                        <span className="text-[10px] text-[#b5586b] font-medium mt-1">
                          Mencapai batas stok ({product.stock})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#f2dee3] bg-[#fbf5f7] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#68756d]">
                  <span>Subtotal ({totalItems} item)</span>
                  <span className="font-semibold text-[#283830]">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#68756d] items-center">
                  <span className="flex items-center gap-1 text-[#395c47] font-medium">
                    <Truck className="w-3.5 h-3.5" />
                    Biaya Pengiriman
                  </span>
                  <span className="text-[#395c47] font-bold">GRATIS (Promo)</span>
                </div>
                <div className="flex justify-between text-base font-serif font-bold text-[#283830] pt-2 border-t border-[#ebd0d6]">
                  <span>Total Tagihan</span>
                  <span className="text-[#324f40]">{formatIDR(subtotal)}</span>
                </div>
              </div>

              <div className="bg-[#faebef] rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-[#873647] border border-[#f5d7de]">
                <ShieldCheck className="w-4 h-4 text-[#3f6351] shrink-0" />
                <span>Termasuk Kartu Ucapan Kaligrafi & Rangkaian Segar.</span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#3f6351] hover:bg-[#345343] text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>Lanjut ke Formulir Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#fcdfe5]" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

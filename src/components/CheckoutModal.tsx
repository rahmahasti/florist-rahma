import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  User, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Building,
  Flower
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Order, PaymentMethodType, OrderItem } from '../types';
import { createOrder, generateOrderNumber } from '../services/orderService';
import { formatIDR } from '../utils/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, subtotal, clearCart } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sameAsRecipient, setSameAsRecipient] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [cardMessage, setCardMessage] = useState('Semoga hari ini penuh dengan kebahagiaan & cinta.');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('BCA');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Auto-fill recipient if toggle checked
  const handleToggleSameRecipient = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsRecipient(checked);
    if (checked) {
      setRecipientName(customerName);
      setRecipientPhone(customerPhone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Keranjang belanja Anda kosong.');
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setErrorMessage('Mohon lengkapi informasi identitas dan kontak pemesan.');
      return;
    }

    const finalRecipient = sameAsRecipient ? customerName : recipientName;
    const finalRecipientPhone = sameAsRecipient ? customerPhone : recipientPhone;

    if (!finalRecipient.trim() || !shippingAddress.trim()) {
      setErrorMessage('Mohon lengkapi nama penerima dan alamat tujuan pengiriman bunga.');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderNumber = generateOrderNumber();
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl,
      }));

      const newOrderData: Omit<Order, 'id'> = {
        orderNumber,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        recipientName: finalRecipient.trim(),
        recipientPhone: finalRecipientPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        deliveryDate,
        cardMessage: cardMessage.trim(),
        items: orderItems,
        subtotal,
        shippingCost: 0, // Promo gratis ongkir
        totalAmount: subtotal,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docId = await createOrder(newOrderData);

      const createdOrder: Order = {
        id: docId,
        ...newOrderData,
      };

      clearCart();
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      console.error('Error saat membuat pesanan:', err);
      setErrorMessage('Terjadi kendala saat menyimpan pesanan ke database. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-[#ebd0d6] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Soft Muted Sage & Rose Gradient */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#3e5f4d] via-[#4e745f] to-[#995867] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 text-[#fce4ea] flex items-center justify-center font-bold">
              <Flower className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-xl">Checkout Pesanan Bunga</h3>
              <p className="text-xs text-[#fae1e6]">Lengkapi detail pengiriman dan metode pembayaran Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#fae1e6] hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Data Pemesan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9e4659] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#3f6351]" />
              1. Informasi Pemesan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-[#3b4740] mb-1">Nama Lengkap Pemesan *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Rahma Hasti"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b] focus:ring-1 focus:ring-[#fcebef] text-[#283830]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3b4740] mb-1">Email Pemesan *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="rahmahasti30@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b] focus:ring-1 focus:ring-[#fcebef] text-[#283830]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3b4740] mb-1">Nomor WhatsApp / Telp *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b] focus:ring-1 focus:ring-[#fcebef] text-[#283830]"
                />
              </div>
            </div>
          </div>

          {/* 2. Data Penerima & Pengiriman */}
          <div className="space-y-3 pt-3 border-t border-[#f2dee3]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9e4659] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#3f6351]" />
                2. Data Penerima & Lokasi Antar
              </h4>
              <label className="flex items-center gap-2 text-xs text-[#526157] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsRecipient}
                  onChange={handleToggleSameRecipient}
                  className="rounded text-[#b5586b] focus:ring-[#b5586b]"
                />
                <span>Penerima sama dengan pemesan</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-[#3b4740] mb-1">Nama Penerima Bunga *</label>
                <input
                  type="text"
                  required
                  value={sameAsRecipient ? customerName : recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={sameAsRecipient}
                  placeholder="Nama orang terkasih / kolega"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b] disabled:bg-[#f7f2f3] text-[#283830]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#3b4740] mb-1">No. Kontak Penerima *</label>
                <input
                  type="tel"
                  required
                  value={sameAsRecipient ? customerPhone : recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  disabled={sameAsRecipient}
                  placeholder="Untuk koordinasi kurir bunga"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b] disabled:bg-[#f7f2f3] text-[#283830]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#3b4740] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#3f6351]" />
                  Tanggal Pengiriman yang Diinginkan *
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b] text-[#283830]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-[#3b4740] mb-1">Alamat Lengkap Pengiriman *</label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan (Patokan: Sebelah Kafe Aroma)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b] text-[#283830]"
                />
              </div>
            </div>
          </div>

          {/* 3. Kartu Ucapan Eksklusif */}
          <div className="space-y-3 pt-3 border-t border-[#f2dee3]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9e4659] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#3f6351]" />
              3. Pesan Kartu Ucapan (Gratis Kaligrafi Cetak)
            </h4>
            <div className="text-xs">
              <textarea
                rows={2}
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                placeholder="Tulis pesan indah untuk kartu ucapan yang disisipkan di rangkaian bunga..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebd0d6] focus:outline-hidden focus:border-[#b5586b] text-[#283830]"
              />
              <span className="text-[11px] text-[#9c4355] font-medium">
                Pesan akan dicetak pada kartu eksklusif berstempel lilin segel Floristique.
              </span>
            </div>
          </div>

          {/* 4. Metode Pembayaran */}
          <div className="space-y-3 pt-3 border-t border-[#f2dee3]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9e4659] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#3f6351]" />
              4. Pilih Metode Pembayaran
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {[
                { id: 'BCA', label: 'Bank BCA', icon: Building, desc: 'Transfer Bank' },
                { id: 'Mandiri', label: 'Bank Mandiri', icon: Building, desc: 'Transfer Bank' },
                { id: 'BRI', label: 'Bank BRI', icon: Building, desc: 'Transfer Bank' },
                { id: 'QRIS', label: 'QRIS Instan', icon: QrCode, desc: 'Semua E-Wallet' },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as PaymentMethodType)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#b5586b] bg-[#fdf2f4] text-[#283830] ring-1 ring-[#b5586b]'
                        : 'border-[#ebd0d6] bg-white hover:border-[#dfb5be] text-[#4f5c54]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#b5586b]' : 'text-[#7e8c83]'}`} />
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#b5586b]" />}
                    </div>
                    <div>
                      <span className="font-bold block text-xs">{method.label}</span>
                      <span className="text-[10px] text-[#7e8c83] block">{method.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="p-4 rounded-2xl bg-[#faf4f6] border border-[#ebd0d6] space-y-2 text-xs">
            <div className="flex justify-between text-[#5c6861]">
              <span>Item Bunga ({items.reduce((s, i) => s + i.quantity, 0)} item)</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#5c6861]">
              <span>Ongkos Kirim Khusus Bunga</span>
              <span className="text-[#395c47] font-bold">GRATIS</span>
            </div>
            <div className="flex justify-between text-[#5c6861]">
              <span>Kartu Ucapan & Pita Sutra</span>
              <span className="text-[#a84457] font-bold">GRATIS</span>
            </div>
            <div className="flex justify-between text-sm font-serif font-bold text-[#283830] pt-2 border-t border-[#ebd0d6]">
              <span>Total yang Harus Dibayar</span>
              <span className="text-[#324f40] text-base">{formatIDR(subtotal)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#3f6351] hover:bg-[#345343] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Pesanan ke Database...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#fcdfe5]" />
                  <span>Buat Pesanan & Lanjut Pembayaran ({formatIDR(subtotal)})</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

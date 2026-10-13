import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  Upload, 
  Calendar, 
  MapPin, 
  MessageSquare, 
  Flower 
} from 'lucide-react';
import { Order } from '../types';
import { submitPaymentProof } from '../services/orderService';
import { formatIDR, formatDate, getPaymentBadgeConfig, getOrderBadgeConfig } from '../utils/formatters';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  initialSearchNumber?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialSearchNumber = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchNumber);
  const [reuploadingOrderId, setReuploadingOrderId] = useState<string | null>(null);
  const [newProofPreview, setNewProofPreview] = useState<string>('');
  const [isSubmittingNewProof, setIsSubmittingNewProof] = useState(false);

  if (!isOpen) return null;

  const displayedOrders = searchTerm.trim()
    ? orders.filter((o) =>
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone.includes(searchTerm)
      )
    : orders.slice(0, 5);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReuploadProof = async (orderId: string) => {
    if (!newProofPreview) return;
    try {
      setIsSubmittingNewProof(true);
      await submitPaymentProof(orderId, newProofPreview, 'Bukti_Revisi.jpg');
      setReuploadingOrderId(null);
      setNewProofPreview('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingNewProof(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-[#ebd0d6] overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#3e5f4d] via-[#4d725d] to-[#995867] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-[#fce4ea]">
              <Flower className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-white">Lacak Status Pesanan Bunga</h3>
              <p className="text-xs text-[#fae1e6]">Pantau status pembayaran & kurir Floristique secara real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#fae1e6] hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 bg-[#fbf5f7] border-b border-[#f2dee3]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5586b]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Masukkan Nomor Invoice (misal: INV-FLR-...) atau No WhatsApp..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ebd0d6] rounded-xl text-xs sm:text-sm text-[#283830] placeholder:text-[#9aa7a0] focus:outline-hidden focus:border-[#b5586b] focus:ring-2 focus:ring-[#faebef]"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {displayedOrders.length === 0 ? (
            <div className="text-center py-12 text-[#9ba8a1] space-y-2">
              <Package className="w-12 h-12 mx-auto opacity-40 text-[#b5586b]" />
              <p className="text-sm font-medium">Tidak ada pesanan yang sesuai dengan kata kunci.</p>
              <p className="text-xs text-[#738279]">Pastikan nomor invoice Anda sudah benar.</p>
            </div>
          ) : (
            displayedOrders.map((order) => {
              const paymentBadge = getPaymentBadgeConfig(order.paymentStatus);
              const orderBadge = getOrderBadgeConfig(order.orderStatus);

              const isPaymentApproved = order.paymentStatus === 'approved';
              const isProcessing = order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'completed';
              const isShipped = order.orderStatus === 'shipped' || order.orderStatus === 'completed';
              const isCompleted = order.orderStatus === 'completed';

              return (
                <div 
                  key={order.id}
                  className="rounded-2xl border border-[#ebd0d6] p-5 bg-white space-y-4 shadow-2xs hover:border-[#dfb5be] transition-colors"
                >
                  {/* Top order info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2dee3]">
                    <div>
                      <span className="font-mono text-sm font-bold text-[#283830] block">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[11px] text-[#7d8c83]">
                        Dibuat pada {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${paymentBadge.bg} ${paymentBadge.text} ${paymentBadge.border}`}>
                        {paymentBadge.label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${orderBadge.bg} ${orderBadge.text} ${orderBadge.border}`}>
                        {orderBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Visual Status Progress Tracker with Soft Sage & Rose */}
                  <div className="pt-2 pb-3">
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
                      {/* Step 1: Pesanan Dibuat */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-[#3f6351] text-white flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <span className="font-semibold text-[#283830]">Dipesan</span>
                      </div>

                      {/* Step 2: Verifikasi Pembayaran */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                          isPaymentApproved
                            ? 'bg-[#3f6351] text-white'
                            : order.paymentStatus === 'paid_waiting_approval'
                            ? 'bg-[#b5586b] text-white animate-pulse'
                            : order.paymentStatus === 'rejected'
                            ? 'bg-[#a84457] text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {isPaymentApproved ? '✓' : '2'}
                        </div>
                        <span className="font-semibold text-[#283830]">
                          {order.paymentStatus === 'rejected' ? 'Bukti Ditolak' : 'Verifikasi'}
                        </span>
                      </div>

                      {/* Step 3: Dirangkai */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                          isProcessing ? 'bg-[#3f6351] text-white' : 'bg-stone-200 text-stone-500'
                        }`}>
                          {isProcessing ? '✓' : '3'}
                        </div>
                        <span className="font-semibold text-[#283830]">Dirangkai</span>
                      </div>

                      {/* Step 4: Dikirim / Selesai */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                          isCompleted
                            ? 'bg-[#3f6351] text-white'
                            : isShipped
                            ? 'bg-[#b5586b] text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}>
                          {isCompleted ? '✓' : '4'}
                        </div>
                        <span className="font-semibold text-[#283830]">
                          {isCompleted ? 'Diterima' : 'Pengiriman'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Alert */}
                  {order.paymentStatus === 'rejected' && (
                    <div className="p-4 rounded-xl bg-[#fdf2f4] border border-[#f5d7de] text-[#873647] text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[#b5586b] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Pembayaran Belum Disetujui Admin</p>
                          <p className="text-[11px] text-[#9c4355] mt-0.5">
                            Alasan: "{order.rejectionReason || 'Bukti transfer tidak terbaca atau nominal kurang'}"
                          </p>
                        </div>
                      </div>

                      {reuploadingOrderId === order.id ? (
                        <div className="pt-2 border-t border-[#f5d7de] space-y-2">
                          <label className="block font-semibold text-[#873647]">
                            Unggah Ulang Bukti Transfer yang Jelas:
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-xs text-stone-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#b5586b] file:text-white"
                          />
                          {newProofPreview && (
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleReuploadProof(order.id)}
                                disabled={isSubmittingNewProof}
                                className="px-3 py-1.5 rounded-lg bg-[#b5586b] text-white font-semibold text-xs disabled:opacity-50"
                              >
                                {isSubmittingNewProof ? 'Mengirim...' : 'Kirim Ulang Bukti'}
                              </button>
                              <button
                                onClick={() => {
                                  setReuploadingOrderId(null);
                                  setNewProofPreview('');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-xs"
                              >
                                Batal
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setReuploadingOrderId(order.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#b5586b] hover:bg-[#a34a5d] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah Ulang Bukti Pembayaran</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Order Details & Floral Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#faf4f6] p-3.5 rounded-xl border border-[#ebd0d6]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[#6a7770]">
                        <MapPin className="w-3.5 h-3.5 text-[#b5586b]" />
                        <span>Penerima: <strong className="text-[#283830]">{order.recipientName}</strong> ({order.recipientPhone})</span>
                      </div>
                      <p className="text-[#55635b] pl-4">{order.shippingAddress}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[#6a7770]">
                        <Calendar className="w-3.5 h-3.5 text-[#3f6351]" />
                        <span>Tanggal Kirim: <strong className="text-[#324f40]">{order.deliveryDate}</strong></span>
                      </div>
                      {order.cardMessage && (
                        <div className="flex items-start gap-1 text-[#6a7770]">
                          <MessageSquare className="w-3.5 h-3.5 text-[#b5586b] shrink-0 mt-0.5" />
                          <span className="italic text-[11px] text-[#873647]">"{order.cardMessage}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-2 pt-1 text-xs">
                    <span className="font-semibold text-[#873647] block text-[11px] uppercase tracking-wider">
                      Rincian Bunga:
                    </span>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-8 h-8 rounded-lg object-cover border border-[#ebd0d6]"
                            />
                            <span className="font-medium text-[#283830]">
                              {item.productName} × {item.quantity}
                            </span>
                          </div>
                          <span className="font-semibold text-[#283830]">
                            {formatIDR(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#f2dee3] flex justify-between items-center text-sm font-serif font-bold text-[#283830]">
                      <span>Total Tagihan:</span>
                      <span className="text-[#324f40]">{formatIDR(order.totalAmount)}</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

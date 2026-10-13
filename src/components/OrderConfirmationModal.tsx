import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Copy, 
  Upload, 
  Clock, 
  AlertCircle, 
  QrCode, 
  CreditCard, 
  FileCheck, 
  Check, 
  ArrowRight, 
  Flower 
} from 'lucide-react';
import { Order } from '../types';
import { submitPaymentProof } from '../services/orderService';
import { formatIDR, formatDate } from '../utils/formatters';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrderTracker?: (orderNumber: string) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewOrderTracker,
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>(order?.paymentProofUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(Boolean(order?.paymentProofUrl));
  const [errorMessage, setErrorMessage] = useState('');

  if (!order) return null;

  const getPaymentDetails = () => {
    switch (order.paymentMethod) {
      case 'BCA':
        return {
          bank: 'BCA (Bank Central Asia)',
          accountNumber: '8830192888',
          accountName: 'PT FLORISTIQUE INDONESIA',
        };
      case 'Mandiri':
        return {
          bank: 'Bank Mandiri',
          accountNumber: '137009821221',
          accountName: 'PT FLORISTIQUE INDONESIA',
        };
      case 'BRI':
        return {
          bank: 'Bank BRI',
          accountNumber: '020601002931508',
          accountName: 'PT FLORISTIQUE INDONESIA',
        };
      case 'QRIS':
        return {
          bank: 'QRIS Bersama (Semua Bank & E-Wallet)',
          accountNumber: 'NMID: ID1020304050607',
          accountName: 'FLORISTIQUE BOTANI INDONESIA',
        };
    }
  };

  const paymentDetails = getPaymentDetails();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 5MB');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrorMessage('');
    }
  };

  const handleUseDemoProof = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff7f8';
      ctx.fillRect(0, 0, 400, 550);
      
      ctx.fillStyle = '#3e5b4e';
      ctx.fillRect(0, 0, 400, 100);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('BUKTI TRANSFER BERHASIL', 60, 45);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#fce4ea';
      ctx.fillText(`Floristique • ${order.paymentMethod} Mobile`, 110, 75);
      
      ctx.fillStyle = '#2c3831';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`No. Referensi: ${order.orderNumber}`, 40, 140);
      
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Waktu Transaksi:', 40, 180);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(new Date().toLocaleString('id-ID'), 40, 205);
      
      ctx.fillStyle = '#64748b';
      ctx.fillText('Penerima:', 40, 245);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(paymentDetails.accountName, 40, 270);
      ctx.fillText(paymentDetails.accountNumber, 40, 290);

      ctx.fillStyle = '#64748b';
      ctx.fillText('Pengirim:', 40, 330);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(order.customerName, 40, 355);

      ctx.strokeStyle = '#e8b8c2';
      ctx.beginPath();
      ctx.moveTo(40, 390);
      ctx.lineTo(360, 390);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.fillText('Jumlah Transfer:', 40, 430);
      ctx.fillStyle = '#3e5b4e';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(formatIDR(order.totalAmount), 40, 465);

      ctx.font = 'italic 12px sans-serif';
      ctx.fillStyle = '#9e4659';
      ctx.fillText('Status: Lunas Terverifikasi Floristique Atelier', 80, 520);
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setProofPreview(dataUrl);
    setErrorMessage('');
  };

  const handleSubmitProof = async () => {
    if (!proofPreview) {
      setErrorMessage('Pilih file gambar bukti transfer terlebih dahulu.');
      return;
    }

    try {
      setIsUploading(true);
      await submitPaymentProof(
        order.id, 
        proofPreview, 
        proofFile ? proofFile.name : `Struk_${order.orderNumber}.jpg`
      );
      setUploadSuccess(true);
    } catch (err: any) {
      console.error('Error saat submit bukti:', err);
      setErrorMessage('Gagal mengunggah bukti pembayaran. Silakan coba kembali.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-[#ebd0d6] overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#3e5f4d] via-[#4d725d] to-[#995867] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center">
              <Flower className="w-6 h-6 text-[#fce4ea]" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-[#fae1e6] font-medium">
                Pesanan Berhasil Dibuat
              </span>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white">
                Invoice #{order.orderNumber}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#fae1e6] hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Order Snapshot Card */}
          <div className="p-4 rounded-2xl bg-[#faf4f6] border border-[#ebd0d6] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[#849189] block">Pemesan</span>
              <span className="font-bold text-[#283830] line-clamp-1">{order.customerName}</span>
            </div>
            <div>
              <span className="text-[#849189] block">Penerima Bunga</span>
              <span className="font-bold text-[#283830] line-clamp-1">{order.recipientName}</span>
            </div>
            <div>
              <span className="text-[#849189] block">Tanggal Antar</span>
              <span className="font-bold text-[#395c47]">{order.deliveryDate}</span>
            </div>
            <div>
              <span className="text-[#849189] block">Total Pembayaran</span>
              <span className="font-bold text-[#324f40] text-sm">{formatIDR(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Instructions Section */}
          <div className="p-5 rounded-2xl border border-[#d6e5dc] bg-[#f5f9f6] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#283830] font-bold text-sm">
                <CreditCard className="w-4 h-4 text-[#b5586b]" />
                <span>Instruksi Transfer: {paymentDetails.bank}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fdf2f4] text-[#9c4355] font-semibold text-[11px] flex items-center gap-1 border border-[#f5d7de]">
                <Clock className="w-3 h-3 text-[#b5586b]" /> Menunggu Pembayaran
              </span>
            </div>

            {order.paymentMethod === 'QRIS' ? (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#ebd0d6] text-center space-y-3">
                <div className="w-44 h-44 bg-[#faf4f6] p-2 rounded-xl border border-[#ebd0d6] flex items-center justify-center">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=FLORISTIQUE-QRIS-PAYMENT-ID1020304050607"
                    alt="QRIS Floristique"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs text-[#526157]">
                  <p className="font-bold text-[#283830]">{paymentDetails.accountName}</p>
                  <p className="text-[11px] text-[#78857d]">{paymentDetails.accountNumber}</p>
                  <p className="text-[11px] text-[#9c4355] font-medium mt-1">
                    Scan menggunakan BCA Mobile, GoPay, OVO, ShopeePay, atau DANA.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-[#ebd0d6] space-y-3 text-xs">
                <div>
                  <span className="text-[#849189] block">Nomor Rekening Tujuan:</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-[#283830]">
                      {paymentDetails.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentDetails.accountNumber)}
                      className="px-3 py-1.5 rounded-lg bg-[#fdf2f4] hover:bg-[#fae6ea] text-[#9c4355] font-semibold text-xs flex items-center gap-1.5 transition-colors border border-[#f5d7de]"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-[#395c47]" /> : <Copy className="w-3.5 h-3.5 text-[#b5586b]" />}
                      <span>{copiedAccount ? 'Tersalin' : 'Salin No. Rek'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f4e6e9] flex justify-between text-[#5c6861]">
                  <span>Atas Nama:</span>
                  <span className="font-semibold text-[#283830]">{paymentDetails.accountName}</span>
                </div>

                <div className="flex justify-between text-[#5c6861]">
                  <span>Nominal Transfer Tepat:</span>
                  <span className="font-bold text-[#324f40] text-sm">{formatIDR(order.totalAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Proof Section */}
          <div className="space-y-4 pt-2 border-t border-[#f2dee3]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-[#283830] text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#b5586b]" />
                  Unggah Bukti Pembayaran
                </h4>
                <p className="text-xs text-[#6e7b73]">
                  Upload screenshot atau foto struk transfer Anda agar admin segera memproses pesanan
                </p>
              </div>

              {uploadSuccess && (
                <span className="px-3 py-1 rounded-full bg-[#eef5f1] text-[#395c47] font-semibold text-xs flex items-center gap-1 border border-[#d6e5dc]">
                  <FileCheck className="w-3.5 h-3.5 text-[#395c47]" /> Terkirim ke Admin
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {proofPreview ? (
              <div className="relative rounded-2xl border border-[#ebd0d6] p-3 bg-[#faf4f6] flex items-center gap-4">
                <div className="w-20 h-24 rounded-xl overflow-hidden bg-white border border-[#ebd0d6] shrink-0">
                  <img
                    src={proofPreview}
                    alt="Bukti Transfer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-bold text-[#283830]">
                    {proofFile ? proofFile.name : `Struk_${order.orderNumber}.jpg`}
                  </p>
                  <p className="text-[#68756d] text-[11px] mt-0.5">
                    {uploadSuccess
                      ? 'Bukti pembayaran telah berhasil dikirim ke Admin. Sedang menunggu approval.'
                      : 'File siap dikirim untuk diverifikasi admin.'}
                  </p>
                  {!uploadSuccess && (
                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        setProofPreview('');
                      }}
                      className="text-[#b5586b] font-semibold hover:underline mt-2 inline-block text-[11px]"
                    >
                      Ganti Foto Bukti
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="border-2 border-dashed border-[#e6c9d0] hover:border-[#b5586b] rounded-2xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2 bg-[#fdf7f8] hover:bg-[#faeff1]">
                  <Upload className="w-6 h-6 text-[#b5586b]" />
                  <span className="text-xs font-semibold text-[#283830]">Pilih File dari Perangkat</span>
                  <span className="text-[10px] text-[#7d8b82]">JPG, PNG atau Screenshot (Maks 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleUseDemoProof}
                  className="border border-[#d6e5dc] bg-[#eef5f1] hover:bg-[#e4efe8] rounded-2xl p-4 text-center transition-colors flex flex-col items-center justify-center space-y-1.5 text-[#395c47]"
                >
                  <FileCheck className="w-6 h-6 text-[#3f6351]" />
                  <span className="text-xs font-bold">Gunakan Struk Demo Cepat</span>
                  <span className="text-[10px] text-[#4f6c5b]">
                    Auto-generate struk valid untuk simulasi approval
                  </span>
                </button>
              </div>
            )}

            {!uploadSuccess && proofPreview && (
              <button
                type="button"
                onClick={handleSubmitProof}
                disabled={isUploading}
                className="w-full py-3 px-4 rounded-xl bg-[#b5586b] hover:bg-[#a34a5d] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengunggah Bukti ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kirim Bukti Pembayaran Sekarang</span>
                  </>
                )}
              </button>
            )}

            {uploadSuccess && (
              <div className="p-3.5 rounded-xl bg-[#fdf2f4] border border-[#f5d7de] text-[#8a3648] text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b5586b] shrink-0" />
                <div>
                  <span className="font-bold">Status: Menunggu Approval Admin Floristique.</span>
                  <p className="text-[11px] text-[#9c4355] mt-0.5">
                    Admin akan mencocokkan mutasi rekening dan menyetujui pesanan Anda dalam waktu maksimal 15 menit.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-[#f2dee3] flex flex-col sm:flex-row gap-3">
            {onViewOrderTracker && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewOrderTracker(order.orderNumber);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#3f6351] hover:bg-[#345343] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Lacak Status Pesanan Ini</span>
                <ArrowRight className="w-4 h-4 text-[#fae1e6]" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl border border-[#ebd0d6] hover:bg-[#fbf4f6] text-[#3d4b43] font-semibold text-xs sm:text-sm transition-colors"
            >
              Tutup & Lanjut Belanja
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

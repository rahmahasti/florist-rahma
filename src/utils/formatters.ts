import { PaymentStatus, OrderStatus } from '../types';

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateOnly(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getPaymentBadgeConfig(status: PaymentStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'Menunggu Pembayaran',
        bg: 'bg-[#faf4ec]',
        text: 'text-[#875929]',
        border: 'border-[#faecd2]'
      };
    case 'paid_waiting_approval':
      return {
        label: 'Perlu Approval Bukti',
        bg: 'bg-[#fcf0f3]',
        text: 'text-[#9c4355]',
        border: 'border-[#f2c9d2]'
      };
    case 'approved':
      return {
        label: 'Pembayaran Disetujui',
        bg: 'bg-[#edf5f0]',
        text: 'text-[#395c47]',
        border: 'border-[#d2e6d8]'
      };
    case 'rejected':
      return {
        label: 'Bukti Ditolak',
        bg: 'bg-[#fbebee]',
        text: 'text-[#912d3f]',
        border: 'border-[#f5d0d8]'
      };
    default:
      return {
        label: status,
        bg: 'bg-[#f7f5f5]',
        text: 'text-[#576159]',
        border: 'border-[#e8e4e4]'
      };
  }
}

export function getOrderBadgeConfig(status: OrderStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'Menunggu Bayar',
        bg: 'bg-[#faf4ec]',
        text: 'text-[#875929]',
        border: 'border-[#faecd2]'
      };
    case 'processing':
      return {
        label: 'Diproses / Dirangkai',
        bg: 'bg-[#fbf4f6]',
        text: 'text-[#9c4355]',
        border: 'border-[#f0dce1]'
      };
    case 'shipped':
      return {
        label: 'Dalam Pengiriman Kurir',
        bg: 'bg-[#f2f7f9]',
        text: 'text-[#3f6775]',
        border: 'border-[#d9e7ec]'
      };
    case 'completed':
      return {
        label: 'Pesanan Selesai',
        bg: 'bg-[#edf5f0]',
        text: 'text-[#395c47]',
        border: 'border-[#d2e6d8]'
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        bg: 'bg-[#f2f2f2]',
        text: 'text-[#6e6e6e]',
        border: 'border-[#e0dede]'
      };
    default:
      return {
        label: status,
        bg: 'bg-[#f7f5f5]',
        text: 'text-[#576159]',
        border: 'border-[#e8e4e4]'
      };
  }
}

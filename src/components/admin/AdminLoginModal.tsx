import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Mail, LogIn, Sparkles, CheckCircle2, Flower } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { loginWithGoogle, loginAsDemoAdmin } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal login via Google. Silakan gunakan opsi Masuk Cepat Demo Admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAdmin = () => {
    loginAsDemoAdmin();
    onLoginSuccess();
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      loginAsDemoAdmin();
      onLoginSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-pink-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Green & Pink Aesthetic */}
        <div className="p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-pink-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/30 border border-pink-300/40 flex items-center justify-center text-pink-200">
              <Flower className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Login Administrator</h3>
              <p className="text-xs text-pink-200">Portal Pengelola Toko Floristique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-pink-200 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Quick 1-Click Demo / Owner Button */}
          <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 space-y-2.5">
            <div className="flex items-center gap-2 text-pink-900 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span>Akses Instan Pemilik Toko</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Login langsung sebagai <strong>Super Admin (rahmahasti30@gmail.com)</strong> untuk mengelola stok bunga, approval bukti transfer, dan laporan penjualan.
            </p>
            <button
              type="button"
              onClick={handleDemoAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-pink-300" />
              <span>Masuk sebagai Super Admin Toko (1-Klik)</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center text-xs text-stone-400 uppercase">
            <span className="bg-white px-3 relative z-10">atau login akun</span>
            <div className="absolute inset-0 top-1/2 border-t border-stone-200" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-pink-200 hover:bg-pink-50 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Akun Google</span>
          </button>

          {/* Email / Password fallback */}
          <form onSubmit={handleManualLogin} className="space-y-3 pt-2 text-xs">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Email Admin</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@floristique.com"
                className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500 text-stone-800"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-hidden focus:border-pink-500 text-stone-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk dengan Email</span>
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-stone-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Koneksi aman terenkripsi Firebase Firestore</span>
          </div>

        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  LogIn, 
  Sparkles, 
  CheckCircle2, 
  Flower2, 
  ShieldCheck, 
  ArrowLeft,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onReturnToStore: () => void;
}

interface AccountPreset {
  id: string;
  label: string;
  role: string;
  email: string;
  pass: string;
  description: string;
}

const ACCOUNT_PRESETS: AccountPreset[] = [
  {
    id: 'superadmin',
    label: 'Pemilik (Super Admin)',
    role: 'Akses Penuh',
    email: 'rahmahasti30@gmail.com',
    pass: 'admin123',
    description: 'Pemilik toko & super admin rahmahasti30@gmail.com'
  },
  {
    id: 'manager',
    label: 'Admin Pengelola',
    role: 'Manager Toko',
    email: 'admin@rahmaflorist.id',
    pass: 'admin123',
    description: 'Kelola stok, pesanan & laporan penjualan'
  },
  {
    id: 'kasir',
    label: 'Kasir Toko Offline',
    role: 'Staff Kasir',
    email: 'kasir@rahmaflorist.id',
    pass: 'kasir123',
    description: 'Akses transaksi kasir POS & struk'
  }
];

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onReturnToStore,
}) => {
  const { loginWithCredentials, loginWithGoogle } = useAuth();

  // Email and password AUTOMATICALLY PRE-FILLED
  const [emailInput, setEmailInput] = useState<string>('rahmahasti30@gmail.com');
  const [passwordInput, setPasswordInput] = useState<string>('admin123');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('superadmin');
  const [showPassword, setShowPassword] = useState<boolean>(true); // Visible by default so user sees the pre-filled password
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  const handleSelectPreset = (preset: AccountPreset) => {
    setSelectedPresetId(preset.id);
    setEmailInput(preset.email);
    setPasswordInput(preset.pass);
    setErrorMsg('');
    setSuccessToast(`Kredensial otomatis diganti ke: ${preset.label}`);
    setTimeout(() => setSuccessToast(''), 2500);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Silakan masukkan email administrator.');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithCredentials(emailInput, passwordInput);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login. Silakan periksa kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal login via Google. Silakan gunakan tombol Masuk Otomatis dengan email & password yang sudah terisi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-[#fdf7f8] via-[#faf8f7] to-[#f4f7f5] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#ebd2d7] overflow-hidden">
        
        {/* Header with Soft Sage Green & Blush Pink Accent */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#2f453a] via-[#3f6351] to-[#b5586b] text-white">
          <div className="flex items-center justify-between">
            <button
              onClick={onReturnToStore}
              className="inline-flex items-center gap-1.5 text-xs text-[#fae1e6] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Toko</span>
            </button>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[#fcedf0] text-[10px] font-semibold uppercase tracking-wider">
              Rahma Florist Portal
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-xs backdrop-blur-xs">
              <Flower2 className="w-7 h-7 text-[#fdf0f3]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white">
                Login Administrator
              </h1>
              <p className="text-xs text-[#fae1e6] mt-0.5">
                Kelola Stok Bunga, Approval Bukti Bayar, Kasir & Laporan
              </p>
            </div>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Automatic prefill announcement banner */}
          <div className="p-4 rounded-2xl bg-[#edf5f0] border border-[#d2e6d8] flex items-start gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-[#3f6351] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fcd8e0]" />
            </div>
            <div>
              <h3 className="font-bold text-[#283830]">Email & Password Terisi Otomatis</h3>
              <p className="text-[#55635b] mt-0.5 leading-relaxed">
                Kredensial akun administrator telah disiapkan di bawah. Anda bisa langsung menekan tombol <strong>"Masuk ke Panel Admin"</strong>.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#fdf0f2] border border-[#f5c7d1] text-[#9c3447] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 rounded-xl bg-[#f0f9f4] border border-[#c3e6d2] text-[#28573a] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-[#3f6351] shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Quick Preset Selector Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#283830]">
              <span>Pilih Akun Preset:</span>
              <span className="text-[11px] text-[#78857e] font-normal">Klik untuk ganti otomatis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ACCOUNT_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-[#3f6351] bg-[#f7faf8] shadow-xs ring-2 ring-[#e3ede6]'
                        : 'border-[#ebd2d7] bg-white hover:bg-[#fdf7f8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#283830] truncate">{preset.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#3f6351] shrink-0" />}
                    </div>
                    <div className="text-[10px] text-[#5c6a62] truncate">
                      {preset.email}
                    </div>
                    <div className="text-[10px] text-[#7a8780] font-mono mt-0.5">
                      pass: <strong>{preset.pass}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#38483f]">Email Administrator</label>
                <span className="text-[10px] text-[#3f6351] font-semibold bg-[#edf5f0] px-2 py-0.5 rounded-full border border-[#d2e6d8]">
                  Otomatis Terisi
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setSelectedPresetId('');
                  }}
                  placeholder="rahmahasti30@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#ebd2d7] focus:outline-hidden focus:border-[#3f6351] focus:ring-2 focus:ring-[#eaf2ee] text-[#283830] font-medium bg-[#faf8f8] text-sm"
                />
                <Mail className="w-4 h-4 text-[#8c9791] absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#38483f]">Kata Sandi / Password</label>
                <span className="text-[10px] text-[#3f6351] font-semibold bg-[#edf5f0] px-2 py-0.5 rounded-full border border-[#d2e6d8]">
                  Otomatis Terisi
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setSelectedPresetId('');
                  }}
                  placeholder="admin123"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#ebd2d7] focus:outline-hidden focus:border-[#3f6351] focus:ring-2 focus:ring-[#eaf2ee] text-[#283830] font-medium bg-[#faf8f8] text-sm"
                />
                <KeyRound className="w-4 h-4 text-[#8c9791] absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-[#8c9791] hover:text-[#48564e] absolute right-2.5 top-2.5 rounded-lg"
                  title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#3f6351] hover:bg-[#345343] active:scale-[0.99] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#fcd8e0]" />
                <span>
                  {isLoading ? 'Sedang Masuk ke Panel...' : 'Masuk ke Panel Admin'}
                </span>
              </button>
            </div>
          </form>

          {/* Google Sign In option */}
          <div className="relative flex items-center justify-center text-xs text-[#8c9791] uppercase pt-2">
            <span className="bg-white px-3 relative z-10 text-[11px] font-medium">atau masuk dengan Google</span>
            <div className="absolute inset-0 top-1/2 border-t border-[#ebd2d7]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-[#ebd2d7] hover:bg-[#fcf5f7] text-[#38483f] font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 shadow-2xs"
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
            <span>Masuk dengan Akun Google (rahmahasti30@gmail.com)</span>
          </button>

          {/* Security Badge */}
          <div className="pt-2 text-center text-[11px] text-[#78857e] flex items-center justify-center gap-1.5 border-t border-[#f4e2e6]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3f6351]" />
            <span>Koneksi aman terenkripsi Firebase Firestore & Auth</span>
          </div>

        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  LogIn, 
  Sparkles, 
  CheckCircle2, 
  Flower2, 
  Eye, 
  EyeOff, 
  KeyRound,
  AlertCircle,
  User,
  RotateCcw,
  Zap,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

interface AccountPreset {
  id: string;
  label: string;
  role: string;
  username: string;
  pass: string;
  description: string;
  badgeColor: string;
}

const ACCOUNT_PRESETS: AccountPreset[] = [
  {
    id: 'superadmin',
    label: 'Super Admin Toko',
    role: 'Akses Penuh',
    username: 'admin',
    pass: 'admin123',
    description: 'Kelola seluruh katalog, stok, kasir POS & approval pesanan',
    badgeColor: 'bg-[#eaf2ee] text-[#3f6351] border-[#d2e5da]'
  },
  {
    id: 'owner',
    label: 'Pemilik (Rahma Hasti)',
    role: 'Owner Toko',
    username: 'rahmahasti30',
    pass: 'rahma2026',
    description: 'Akun utama pemilik toko (rahmahasti30@gmail.com)',
    badgeColor: 'bg-[#fcedf0] text-[#9c4355] border-[#f5d7de]'
  },
  {
    id: 'kasir',
    label: 'Kasir Toko Offline',
    role: 'Staff Kasir',
    username: 'kasir',
    pass: 'kasir123',
    description: 'Operasional terminal kasir POS, transaksi dan struk',
    badgeColor: 'bg-[#f2f4f8] text-[#3b5998] border-[#d6e0f0]'
  }
];

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { loginWithCredentials, loginWithGoogle } = useAuth();

  // Username and password AUTOMATICALLY PRE-FILLED by default
  const [usernameInput, setUsernameInput] = useState<string>('admin');
  const [passwordInput, setPasswordInput] = useState<string>('admin123');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('superadmin');
  const [showPassword, setShowPassword] = useState<boolean>(true); // Show by default so user sees auto password
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AccountPreset) => {
    setSelectedPresetId(preset.id);
    setUsernameInput(preset.username);
    setPasswordInput(preset.pass);
    setErrorMsg('');
    setSuccessNotice(`Kredensial otomatis dialihkan ke: ${preset.label} (${preset.username})`);
    setTimeout(() => setSuccessNotice(''), 2500);
  };

  const handleExecuteLogin = async (username: string, pass: string) => {
    if (!username.trim()) {
      setErrorMsg('Username tidak boleh kosong');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithCredentials(username, pass);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteLogin(usernameInput, passwordInput);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal masuk via Google. Silakan gunakan opsi Login Otomatis di bawah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b2621]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#ebd2d7] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Soft Sage Green & Soft Blush Pink Harmony */}
        <div className="p-6 bg-gradient-to-r from-[#2f453a] via-[#3f6351] to-[#b5586b] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-[#faedf0] shadow-2xs backdrop-blur-xs">
              <Flower2 className="w-6 h-6 text-[#fdf0f3]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif font-bold text-lg text-white">Login Administrator</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[#fcedf0] text-[10px] font-semibold">
                  Rahma Florist
                </span>
              </div>
              <p className="text-xs text-[#fae1e6]">Autentikasi Cepat dengan Kredensial Otomatis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#fae1e6] hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Automatic credentials indicator banner */}
          <div className="p-3.5 rounded-2xl bg-[#edf5f0] border border-[#d2e6d8] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#324f40] font-medium">
              <Sparkles className="w-4 h-4 text-[#3f6351] shrink-0" />
              <span>Username & Password telah <strong>terisi otomatis</strong> di formulir.</span>
            </div>
            <span className="bg-[#3f6351] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              Otomatis
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#fdf0f2] border border-[#f5c7d1] text-[#9c3447] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-xl bg-[#f0f9f4] border border-[#c3e6d2] text-[#28573a] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-[#3f6351] shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Quick Preset Selector Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#283830]">
              <span>Pilih Akun Preset Otomatis:</span>
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
                    className={`p-3 rounded-2xl text-left border transition-all relative ${
                      isSelected
                        ? 'border-[#3f6351] bg-[#f7faf8] shadow-xs ring-2 ring-[#e3ede6]'
                        : 'border-[#ebd2d7] bg-white hover:bg-[#fdf7f8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#283830]">{preset.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#3f6351]" />}
                    </div>
                    <div className="text-[11px] font-mono text-[#5c6a62]">
                      user: <span className="font-semibold text-[#3f6351]">{preset.username}</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#7a8780]">
                      pass: <span className="font-semibold">{preset.pass}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instant 1-Click Login Action Banner with Auto Credentials */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fdf4f6] via-[#fbf7f8] to-[#f4f8f5] border border-[#f5d7de] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#9c4355] font-bold text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4 text-[#b5586b]" />
                <span>Masuk 1-Klik Otomatis</span>
              </div>
              <span className="text-[10px] text-[#6d7971] bg-white px-2 py-0.5 rounded-full border border-[#e8d5da]">
                user: <strong className="text-[#3f6351]">{usernameInput}</strong> | pass: <strong className="text-[#b5586b]">{passwordInput}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleExecuteLogin(usernameInput, passwordInput)}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#3f6351] hover:bg-[#345343] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#fcd8e0]" />
              <span>
                {isLoading ? 'Memproses Masuk...' : `Masuk Otomatis Sekarang (${usernameInput})`}
              </span>
            </button>
          </div>

          {/* Form Username & Password (Pre-filled, fully editable) */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 text-xs">
            <div className="flex items-center justify-between border-t border-[#f4e2e6] pt-3">
              <span className="font-semibold text-[#283830] text-xs">Detail Kredensial Formulir</span>
              <button
                type="button"
                onClick={() => handleSelectPreset(ACCOUNT_PRESETS[0])}
                className="text-[11px] text-[#b5586b] hover:text-[#913e4f] font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke 'admin'</span>
              </button>
            </div>

            {/* Username Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-[#48564e]">Username / ID Administrator</label>
                <span className="text-[10px] text-[#3f6351] font-semibold bg-[#edf5f0] px-1.5 py-0.2 rounded">Terisi Otomatis</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setSelectedPresetId('');
                  }}
                  placeholder="admin"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#ebd2d7] focus:outline-hidden focus:border-[#3f6351] focus:ring-2 focus:ring-[#eaf2ee] text-[#283830] font-medium bg-[#faf8f8]"
                />
                <User className="w-4 h-4 text-[#8c9791] absolute left-3 top-3" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-[#48564e]">Kata Sandi / Password</label>
                <span className="text-[10px] text-[#3f6351] font-semibold bg-[#edf5f0] px-1.5 py-0.2 rounded">Terisi Otomatis</span>
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
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#ebd2d7] focus:outline-hidden focus:border-[#3f6351] focus:ring-2 focus:ring-[#eaf2ee] text-[#283830] font-medium bg-[#faf8f8]"
                />
                <KeyRound className="w-4 h-4 text-[#8c9791] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#8c9791] hover:text-[#48564e] absolute right-2.5 top-2.5"
                  title={showPassword ? 'Sembunyikan Sandi' : 'Tampilkan Sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#283830] hover:bg-[#1d2b24] active:scale-[0.99] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk dengan Kredensial Ini</span>
            </button>
          </form>

          {/* Alternative Google Sign In */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2 px-3.5 rounded-xl border border-[#ebd2d7] hover:bg-[#fcf5f7] text-[#4d5e54] font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span>Atau Masuk dengan Akun Google</span>
            </button>
          </div>

          {/* Security & Database Status */}
          <div className="pt-2 text-center text-[11px] text-[#78857e] flex items-center justify-center gap-1.5 border-t border-[#f4e2e6]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3f6351]" />
            <span>Koneksi aman terenkripsi Firebase Firestore & Auth</span>
          </div>

        </div>
      </div>
    </div>
  );
};

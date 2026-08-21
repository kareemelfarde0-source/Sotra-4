import React, { useState } from "react";
import { Lock, KeyRound, ShieldAlert, X, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: "ar" | "en";
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === "admin") {
      setError(false);
      setPassword("");
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 text-center animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 start-4 p-1.5 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shield Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-lg">
          <KeyRound className="w-7 h-7 text-red-500" />
        </div>

        <h3 className="font-brand font-black text-lg sm:text-xl text-neutral-950 uppercase">
          {lang === "ar" ? "لوحة تحكم إدارة المتجر" : "Admin Panel Access"}
        </h3>
        <p className="text-xs text-neutral-500 mt-1 mb-5">
          {lang === "ar"
            ? "يرجى إدخال كلمة سر الإدارة للمتابعة"
            : "Enter administrator password to unlock dashboard"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder={lang === "ar" ? "أدخل كلمة المرور" : "Enter Password"}
              autoFocus
              className={`w-full px-4 py-3 text-sm rounded-xl border text-center font-mono tracking-widest outline-none transition-all ${
                error
                  ? "border-red-500 ring-2 ring-red-200 bg-red-50 text-red-900"
                  : "border-neutral-300 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-200 bg-neutral-50"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 font-bold animate-shake">
              <ShieldAlert className="w-4 h-4" />
              <span>{lang === "ar" ? "كلمة السر غير صحيحة" : "Incorrect password"}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-black uppercase rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer font-brand active:scale-98"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{lang === "ar" ? "دخول لوحة التحكم" : "Unlock Admin Dashboard"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Sparkles, Save, RotateCcw, CheckCircle2, Eye, Sun, Moon } from "lucide-react";
import { SplashScreenConfig } from "../types";
import { DEFAULT_SPLASH_CONFIG } from "../utils/storage";

interface AdminSplashSettingsProps {
  splashConfig?: SplashScreenConfig;
  onSave: (config: SplashScreenConfig) => void;
  showToast: (msg: string) => void;
  lang: "ar" | "en";
}

export const AdminSplashSettings: React.FC<AdminSplashSettingsProps> = ({
  splashConfig,
  onSave,
  showToast,
  lang,
}) => {
  const [config, setConfig] = useState<SplashScreenConfig>(() => ({
    ...DEFAULT_SPLASH_CONFIG,
    ...(splashConfig || {}),
  }));

  // Sync state if remote/props update from Firestore
  React.useEffect(() => {
    if (splashConfig) {
      setConfig((prev) => ({
        ...DEFAULT_SPLASH_CONFIG,
        ...prev,
        ...splashConfig,
      }));
    }
  }, [splashConfig]);

  const handleReset = () => {
    if (confirm("هل تريد استعادة الإعدادات الافتراضية لشاشة البداية؟")) {
      setConfig({ ...DEFAULT_SPLASH_CONFIG });
      onSave({ ...DEFAULT_SPLASH_CONFIG });
      showToast("تمت استعادة الإعدادات الافتراضية لشاشة البداية بنجاح");
    }
  };

  const handleSave = () => {
    onSave(config);
    showToast("تم حفظ إعدادات شاشة البداية بنجاح في قاعدة البيانات");
  };

  const isWhite = config.theme !== "dark";

  return (
    <div className="space-y-6 text-start">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-neutral-900 flex items-center gap-2">
            <span>✨ تخصيص وتعديل شاشة البداية (Splash Screen)</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            التحكم في الثيم (أبيض فخم / أسود فاخر)، النصوص، الشعار، وميض الإبهار، ومدة الظهور أثناء تحميل المنتجات.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-neutral-950 hover:bg-red-600 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ إعدادات شاشة البداية</span>
          </button>
        </div>
      </div>

      {/* Main Settings & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Controls Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-neutral-900 border-b pb-2 flex items-center justify-between">
              <span>خيارات ومظهر شاشة البداية</span>
              <span className="text-[11px] font-normal text-neutral-500">مباشر على المتجر</span>
            </h3>

            {/* Toggle Enabled */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <div>
                <h4 className="text-xs font-black text-neutral-900">تفعيل شاشة البداية</h4>
                <p className="text-[11px] text-neutral-500">إظهار الشاشة الفاخرة للعملاء عند فتح المتجر لأول مرة</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* Toggle Pure Logo Mode (Only Logo / No Text) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200/80">
              <div>
                <h4 className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                  <span>👑 إظهار اللوجو فقط بدون نصوص وكلام</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-200 text-amber-900 font-bold rounded">موصى به</span>
                </h4>
                <p className="text-[11px] text-neutral-600">
                  عرض شعار وأيقونة سترة الفاخرة فقط بحجم كبير وراقي مع شريط التحميل، وإخفاء كل النصوص الأخرى
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showOnlyLogo !== false}
                  onChange={(e) => setConfig({ ...config, showOnlyLogo: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>

            {/* Custom Logo Image URL (Optional) */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                رابط صورة لوجو مخصص لشاشة البداية (اختياري - يحل محل الشعار الدائري)
              </label>
              <input
                type="text"
                value={config.customLogoUrl || ""}
                onChange={(e) => setConfig({ ...config, customLogoUrl: e.target.value })}
                placeholder="https://... أدخل رابط صورة الشعار PNG شفاف"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-mono"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                عند ترك هذا الحقل فارغاً، سيتم عرض الشعار الذهبي الملكي الدائري الفاخر بحرف (S).
              </p>
            </div>

            {/* Theme Selector: White Luxury vs Dark Luxury */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">ثيم شاشة البداية</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, theme: "white" })}
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    isWhite
                      ? "border-neutral-950 bg-white text-neutral-950 shadow-md ring-2 ring-neutral-950/10 font-black"
                      : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <Sun className={`w-4 h-4 ${isWhite ? "text-amber-500" : "text-neutral-400"}`} />
                  <span className="text-xs font-bold">أبيض فخم (White Luxury)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, theme: "dark" })}
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    !isWhite
                      ? "border-neutral-950 bg-neutral-900 text-white shadow-md ring-2 ring-neutral-950/10 font-black"
                      : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <Moon className={`w-4 h-4 ${!isWhite ? "text-amber-400" : "text-neutral-400"}`} />
                  <span className="text-xs font-bold">أسود فاخر (Dark Luxury)</span>
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">حرف الشعار الدائري</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={config.logoLetter || "S"}
                    onChange={(e) => setConfig({ ...config, logoLetter: e.target.value })}
                    placeholder="S"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand font-black text-center text-base"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1">اسم المتجر الرئيسي</label>
                  <input
                    type="text"
                    value={config.brandName || "SOTRA FASHION"}
                    onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                    placeholder="SOTRA FASHION"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand font-black tracking-wider uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">النص الفرعي (عربي)</label>
                <input
                  type="text"
                  value={config.subtitleAr}
                  onChange={(e) => setConfig({ ...config, subtitleAr: e.target.value })}
                  placeholder="أجود أنواع الأقمشة التركية والعالمية"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-arabic font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">النص الفرعي (English)</label>
                <input
                  type="text"
                  value={config.subtitleEn || ""}
                  onChange={(e) => setConfig({ ...config, subtitleEn: e.target.value })}
                  placeholder="PREMIUM LUXURY TURKISH & WORLD APPAREL"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">نص مؤشر التحميل</label>
                <input
                  type="text"
                  value={config.loadingTextAr || ""}
                  onChange={(e) => setConfig({ ...config, loadingTextAr: e.target.value })}
                  placeholder="جاري تحضير أحدث التشكيلات الفاخرة..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-arabic text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">مدة الظهور التقديرية (مللي ثانية)</label>
                  <input
                    type="number"
                    min="500"
                    max="5000"
                    step="100"
                    value={config.minDurationMs}
                    onChange={(e) => setConfig({ ...config, minDurationMs: Number(e.target.value) || 1000 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-mono"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">1000 مللي ثانية = 1 ثانية</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">شريط السنة والتوثيق</label>
                  <input
                    type="text"
                    value={config.establishedText || ""}
                    onChange={(e) => setConfig({ ...config, establishedText: e.target.value })}
                    placeholder="SOTRA EGYPT • EST. 2026"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-brand text-xs"
                  />
                </div>
              </div>

              {/* Glow Shimmer Effect */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-splash-glow"
                  checked={config.glowEffect}
                  onChange={(e) => setConfig({ ...config, glowEffect: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 cursor-pointer"
                />
                <label htmlFor="chk-splash-glow" className="text-xs font-bold text-neutral-800 cursor-pointer flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>تفعيل تأثير الوميض والنبض الذهبي الفاخر</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-neutral-600" />
              <span>معاينة حية لشاشة البداية</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 font-mono text-neutral-600">
              {isWhite ? "White Luxury" : "Dark Luxury"}
            </span>
          </div>

          <div
            className={`relative rounded-3xl overflow-hidden shadow-xl border-2 p-6 flex flex-col items-center justify-center text-center min-h-[460px] select-none ${
              isWhite
                ? "bg-[#ffffff] text-neutral-950 border-neutral-300"
                : "bg-[#070707] text-white border-neutral-800"
            }`}
          >
            {/* Background ambient light */}
            {isWhite ? (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.14)_0%,rgba(250,250,250,0.9)_65%,rgba(255,255,255,1)_100%)] pointer-events-none" />
                <div className="absolute inset-4 border border-[#d4af37]/35 rounded-2xl pointer-events-none" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18)_0%,rgba(10,10,10,0.95)_70%,rgba(5,5,5,1)_100%)] pointer-events-none" />
                <div className="absolute inset-4 border border-[#d4af37]/20 rounded-2xl pointer-events-none" />
              </>
            )}

            <div className="relative z-10 space-y-4 max-w-xs">
              {/* Custom Logo Image OR Luxury Emblem */}
              {config.customLogoUrl ? (
                <div className="relative flex items-center justify-center p-2 rounded-xl max-w-[160px] mx-auto">
                  <img
                    src={config.customLogoUrl}
                    alt={config.brandName || "Brand Logo"}
                    className="max-h-20 w-auto object-contain drop-shadow-md"
                  />
                </div>
              ) : (
                /* Luxury SOTRA Emblem */
                <div
                  className={`relative mx-auto flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#d4af37] shadow-lg ${
                    isWhite ? "bg-white" : "bg-neutral-900"
                  } ${config.glowEffect ? "animate-pulse" : ""}`}
                >
                  <div className="absolute inset-1 rounded-full border border-[#d4af37]/40 border-dashed animate-spin-slow" />
                  <span
                    className={`text-3xl font-black font-brand ${
                      isWhite ? "text-neutral-950" : "text-[#d4af37]"
                    }`}
                  >
                    {config.logoLetter || "S"}
                  </span>
                </div>
              )}

              {/* Title & Texts (Only shown if showOnlyLogo is false) */}
              {config.showOnlyLogo === false && (
                <>
                  <div className="space-y-1">
                    <h4
                      className={`text-xl font-black font-brand tracking-widest uppercase ${
                        isWhite
                          ? "text-neutral-950"
                          : "text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f7e7c4] to-white"
                      } ${config.glowEffect ? "animate-pulse" : ""}`}
                    >
                      {config.brandName || "SOTRA FASHION"}
                    </h4>
                    <div className="h-[2px] w-24 mx-auto bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-full" />
                  </div>

                  <div className="space-y-0.5">
                    {config.subtitleAr && (
                      <p className={`text-xs font-black font-arabic ${isWhite ? "text-[#8a6414]" : "text-[#f5e6be]"}`}>
                        {config.subtitleAr}
                      </p>
                    )}
                    {config.subtitleEn && (
                      <p className={`text-[9px] font-bold font-brand tracking-widest uppercase ${isWhite ? "text-neutral-500" : "text-neutral-400"}`}>
                        {config.subtitleEn}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Progress bar */}
              <div className="pt-2 w-36 mx-auto space-y-1.5">
                <div className={`w-full h-1 rounded-full overflow-hidden ${isWhite ? "bg-neutral-200" : "bg-neutral-800"}`}>
                  <div className="h-full bg-gradient-to-r from-[#aa8010] via-[#f5e6be] to-[#aa8010] w-full animate-sotra-shimmer" />
                </div>
                {config.showOnlyLogo === false && config.loadingTextAr && (
                  <p className={`text-[9px] font-bold ${isWhite ? "text-neutral-600" : "text-neutral-400"}`}>
                    {config.loadingTextAr}
                  </p>
                )}
              </div>

              {config.showOnlyLogo === false && config.establishedText && (
                <div className={`pt-2 text-[8px] font-brand uppercase tracking-wider ${isWhite ? "text-neutral-400" : "text-neutral-500"}`}>
                  {config.establishedText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save bar at bottom */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 bg-neutral-950 hover:bg-red-600 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ إعدادات شاشة البداية السحابية</span>
        </button>
      </div>
    </div>
  );
};

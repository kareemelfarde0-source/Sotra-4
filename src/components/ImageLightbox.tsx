import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { SOTRA_PRODUCT_PLACEHOLDER, sanitizeImageUrl } from "../utils/storage";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  startIndex?: number;
  lang?: "ar" | "en";
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  images,
  startIndex = 0,
  lang = "ar",
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = normal, 2 = 2x, 3.5 = fabric texture lens
  const [lensPosition, setLensPosition] = useState({ x: 50, y: 50 }); // percentage
  const [isHovering, setIsHovering] = useState(false);
  const [isLensActive, setIsLensActive] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
      setZoomLevel(1);
      setIsLensActive(false);
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleResetZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length, zoomLevel]);

  if (!isOpen || images.length === 0) return null;

  const handlePrev = () => {
    setZoomLevel(1);
    setIsLensActive(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setZoomLevel(1);
    setIsLensActive(false);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.75, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.75, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setIsLensActive(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !e.touches[0]) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setLensPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const toggleTextureLens = () => {
    if (isLensActive) {
      setIsLensActive(false);
      setZoomLevel(1);
    } else {
      setIsLensActive(true);
      setZoomLevel(2.5);
    }
  };

  const currentImageSrc = sanitizeImageUrl(images[currentIndex], SOTRA_PRODUCT_PLACEHOLDER);

  return (
    <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fade-in select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between text-white z-20 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-mono font-bold tracking-widest bg-white/10 px-3 py-1.5 rounded-none font-brand border border-white/10">
            {currentIndex + 1} / {images.length}
          </span>

          {/* Product Details Lens Toggle */}
          <button
            onClick={toggleTextureLens}
            className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isLensActive
                ? "bg-[#d4af37] text-neutral-950 border-[#d4af37] shadow-lg scale-105 font-black"
                : "bg-white/10 hover:bg-white/20 text-white border-white/20"
            }`}
            title={lang === "ar" ? "عدسة معاينة تفاصيل المنتج بدقة عالية" : "Product details zoom lens"}
          >
            <ZoomIn className={`w-3.5 h-3.5 ${isLensActive ? "text-neutral-950" : "text-amber-300"}`} />
            <span className="hidden sm:inline">
              {isLensActive
                ? lang === "ar"
                  ? "معاينة التفاصيل مفعلة (2.5x)"
                  : "Details Zoom ON"
                : lang === "ar"
                ? "معاينة تفاصيل المنتج"
                : "Inspect Details"}
            </span>
            <span className="sm:hidden">{lang === "ar" ? "التفاصيل" : "Details"}</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            aria-label="Zoom out"
            className="p-2 rounded-none bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-white/10"
            title={lang === "ar" ? "تصغير (-)" : "Zoom Out"}
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={handleResetZoom}
            disabled={zoomLevel === 1}
            aria-label="Reset zoom"
            className="px-2.5 py-1.5 rounded-none bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono font-bold transition-colors cursor-pointer border border-white/10"
            title={lang === "ar" ? "إعادة للوضع الطبيعي (1x)" : "Reset 1x"}
          >
            {zoomLevel.toFixed(1)}x
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 4}
            aria-label="Zoom in"
            className="p-2 rounded-none bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-white/10"
            title={lang === "ar" ? "تكبير (+)" : "Zoom In"}
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="w-[1px] h-6 bg-white/20 mx-1" />

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-none bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer border border-red-500/50"
            title={lang === "ar" ? "إغلاق (Esc)" : "Close"}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={imageContainerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchMove={handleTouchMove}
        onTouchStart={() => setIsHovering(true)}
        className="relative flex-1 flex items-center justify-center max-h-[75vh] sm:max-h-[78vh] overflow-hidden my-auto cursor-crosshair group touch-none"
      >
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            aria-label="Previous"
            className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3.5 rounded-none bg-black/70 hover:bg-black/95 text-white border border-white/30 transition-all cursor-pointer shadow-2xl active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Display Image with transform or Lens background */}
        <div
          className="relative max-h-full max-w-full overflow-hidden flex items-center justify-center transition-all duration-200"
          style={{
            cursor: isLensActive || zoomLevel > 1 ? "grab" : "zoom-in",
          }}
          onClick={() => {
            if (zoomLevel === 1) {
              setZoomLevel(2.2);
            } else {
              setZoomLevel(1);
              setIsLensActive(false);
            }
          }}
        >
          <img
            src={currentImageSrc}
            alt={`Preview ${currentIndex + 1}`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
            }}
            style={{
              transform:
                zoomLevel > 1
                  ? `scale(${zoomLevel})`
                  : "scale(1)",
              transformOrigin: `${lensPosition.x}% ${lensPosition.y}%`,
              transition: isHovering ? "none" : "transform 0.3s ease",
            }}
            className="max-h-[72vh] sm:max-h-[76vh] max-w-full object-contain rounded-none shadow-2xl pointer-events-none select-none"
          />

          {/* Floating Texture Lens Indicator */}
          {isLensActive && isHovering && (
            <div
              className="absolute pointer-events-none border-2 border-[#d4af37] bg-amber-400/10 shadow-[0_0_25px_rgba(212,175,55,0.4)] rounded-full w-28 h-28 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center backdrop-contrast-125"
              style={{
                left: `${lensPosition.x}%`,
                top: `${lensPosition.y}%`,
              }}
            >
              <span className="text-[10px] font-black text-neutral-950 bg-[#d4af37] px-1.5 py-0.5 rounded-none font-brand shadow-xs uppercase">
                {lang === "ar" ? "تفاصيل القطعة" : "Details"}
              </span>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <button
            onClick={handleNext}
            aria-label="Next"
            className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3.5 rounded-none bg-black/70 hover:bg-black/95 text-white border border-white/30 transition-all cursor-pointer shadow-2xl active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Floating Hint Overlay */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-10">
          <span className="text-[11px] text-white/80 bg-black/70 px-3 py-1 rounded-none border border-white/10 backdrop-blur-xs font-arabic">
            {lang === "ar"
              ? "حرك الفأرة أو اسحب بإصبعك لمعاينة وتكبير تفاصيل المنتج بدقة عالية • انقر مرتين للتكبير"
              : "Move mouse or drag to inspect product details • Click to zoom"}
          </span>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-2 z-20 border-t border-white/10 max-w-xl mx-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setZoomLevel(1);
              }}
              className={`w-14 h-16 rounded-none overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                currentIndex === idx
                  ? "border-[#d4af37] scale-105 opacity-100 shadow-lg ring-2 ring-[#d4af37]/30"
                  : "border-white/20 opacity-50 hover:opacity-90"
              }`}
            >
              <img
                src={sanitizeImageUrl(img, SOTRA_PRODUCT_PLACEHOLDER)}
                alt="Thumb"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

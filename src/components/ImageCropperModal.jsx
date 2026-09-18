import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  Sliders,
  Move
} from "lucide-react";

/**
 * Utility function to generate a cropped image Blob and DataURL from canvas
 */
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas 2D context");
  }

  const rotRad = (rotation * Math.PI) / 180;

  // Calculate bounding box of rotated image
  const { width: bBoxWidth, height: bBoxHeight } = {
    width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
    height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height)
  };

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  // Extract the cropped portion into a new canvas
  const cropCanvas = document.createElement("canvas");
  const cropCtx = cropCanvas.getContext("2d");

  cropCanvas.width = pixelCrop.width;
  cropCanvas.height = pixelCrop.height;

  // Fill warm ivory background in case of transparent padding
  cropCtx.fillStyle = "#FAF8F5";
  cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);

  cropCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    cropCanvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve({ blob: null, dataUrl: imageSrc });
          return;
        }
        const dataUrl = cropCanvas.toDataURL("image/jpeg", 0.92);
        const croppedFile = new File([blob], "suko-editorial-4-5.jpg", {
          type: "image/jpeg",
          lastModified: Date.now()
        });
        resolve({
          file: croppedFile,
          blob,
          dataUrl,
          width: pixelCrop.width,
          height: pixelCrop.height
        });
      },
      "image/jpeg",
      0.92
    );
  });
}

const ImageCropperModal = ({
  imageSrc,
  initialCrop = { x: 0, y: 0 },
  initialZoom = 1,
  aspectRatio = 4 / 5,
  imageRole = "model_front",
  onSave,
  onCancel
}) => {
  const [crop, setCrop] = useState(initialCrop);
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(aspectRatio || 4 / 5);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState(null);
  const [activeTab, setActiveTab] = useState("crop"); // 'crop' | 'preview' (for mobile sheet)
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
    setCroppedAreaPercent(croppedArea);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(4 / 5);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const croppedResult = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (onSave) {
        onSave({
          ...croppedResult,
          cropArea: croppedAreaPercent,
          cropAreaPixels: croppedAreaPixels,
          zoom,
          rotation,
          aspect
        });
      }
    } catch (err) {
      console.error("Error cropping image:", err);
    } finally {
      setSaving(false);
    }
  };

  const roleLabels = {
    model_front: "Front / Main Look",
    model_three_quarter: "3/4 Profile Angle",
    model_back: "Back Silhouette",
    model_side: "Side Profile",
    garment_front: "Garment Flat / Front",
    detail: "Bespoke Detail / Fabric"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-[#EAE6DF] max-w-4xl w-full h-[95vh] sm:h-auto max-h-[92vh] rounded-[2px] shadow-2xl flex flex-col text-[#111113] overflow-hidden">
        {/* TOP BAR */}
        <div className="px-5 py-3.5 border-b border-[#EAE6DF] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
            <div>
              <h2 className="text-xs uppercase tracking-[0.16em] font-mono font-semibold text-[#111113]">
                4:5 Product Crop
              </h2>
              <p className="text-[10px] text-[#746F68] font-mono mt-0.5">
                Drag to reposition &middot; Scroll/pinch to zoom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab Toggle */}
            <div className="md:hidden flex border border-[#EAE6DF] rounded-[2px] overflow-hidden p-0.5 bg-[#FAF8F5]">
              <button
                type="button"
                onClick={() => setActiveTab("crop")}
                className={`px-2.5 py-1 text-[9.5px] font-mono uppercase tracking-wider rounded-[1px] ${
                  activeTab === "crop" ? "bg-[#111113] text-white" : "text-[#746F68]"
                }`}
              >
                Crop
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-2.5 py-1 text-[9.5px] font-mono uppercase tracking-wider rounded-[1px] ${
                  activeTab === "preview" ? "bg-[#111113] text-white" : "text-[#746F68]"
                }`}
              >
                Storefront
              </button>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-[#746F68] hover:text-[#111113] hover:bg-[#FAF8F5] border border-transparent hover:border-[#EAE6DF] rounded-[2px] transition-colors cursor-pointer"
              title="Close editor"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#FAF8F5]">
          {/* CROP VIEWPORT AREA */}
          <div
            className={`flex-1 relative flex flex-col items-center justify-center p-4 bg-[#111113] overflow-hidden ${
              activeTab === "preview" ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Cropper Container */}
            <div className="relative w-full h-[52vh] sm:h-[55vh] md:h-[60vh] max-w-md mx-auto rounded-[2px] overflow-hidden border border-[#C2922E]/40 shadow-2xl">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
                classes={{
                  containerClassName: "bg-[#09090b]",
                  cropAreaClassName: "border-2 border-[#C2922E] shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
                }}
              />
              <div className="absolute top-2 left-2 z-10 bg-black/75 backdrop-blur-xs text-[#C2922E] text-[8.5px] font-mono px-2 py-0.5 rounded-[1px] border border-[#C2922E]/30 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={10} /> 4:5 Portrait Frame
              </div>
              <div className="absolute bottom-2 right-2 z-10 bg-black/75 backdrop-blur-xs text-white/80 text-[8.5px] font-mono px-2 py-0.5 rounded-[1px] border border-white/10 uppercase tracking-widest flex items-center gap-1 pointer-events-none">
                <Move size={10} className="text-[#C2922E]" /> Drag &amp; Pinch to Pan
              </div>
            </div>

            {/* Quick helper tip */}
            <p className="text-[10px] text-white/60 font-mono mt-3 text-center">
              Drag to reposition &middot; Scroll or pinch to zoom
            </p>
          </div>

          {/* SIDEBAR: CONTROLS & STOREFRONT PREVIEW */}
          <div
            className={`w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-[#EAE6DF] bg-white flex flex-col justify-between overflow-y-auto ${
              activeTab === "crop" ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-5 space-y-5">
              {/* Aspect Ratio Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#746F68] font-medium flex items-center gap-1.5">
                    <Sliders size={12} className="text-[#C2922E]" /> Aspect Ratio
                  </label>
                  <span className="text-[9px] font-mono text-[#C2922E] font-bold uppercase">
                    {aspect === 4 / 5 ? "4:5 (Standard)" : aspect === 1 ? "1:1 (Square)" : "Free"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAspect(4 / 5)}
                    className={`py-2 px-2 text-[10px] font-mono uppercase tracking-wider rounded-[2px] border transition-all text-center ${
                      aspect === 4 / 5
                        ? "bg-[#111113] text-white border-[#111113] font-semibold shadow-xs"
                        : "bg-[#FAF8F5] text-[#746F68] border-[#EAE6DF] hover:border-[#111113]"
                    }`}
                  >
                    4:5 Editorial
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspect(1)}
                    className={`py-2 px-2 text-[10px] font-mono uppercase tracking-wider rounded-[2px] border transition-all text-center ${
                      aspect === 1
                        ? "bg-[#111113] text-white border-[#111113] font-semibold shadow-xs"
                        : "bg-[#FAF8F5] text-[#746F68] border-[#EAE6DF] hover:border-[#111113]"
                    }`}
                  >
                    1:1 Square
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspect(undefined)}
                    className={`py-2 px-2 text-[10px] font-mono uppercase tracking-wider rounded-[2px] border transition-all text-center ${
                      aspect === undefined
                        ? "bg-[#111113] text-white border-[#111113] font-semibold shadow-xs"
                        : "bg-[#FAF8F5] text-[#746F68] border-[#EAE6DF] hover:border-[#111113]"
                    }`}
                  >
                    Free Crop
                  </button>
                </div>
              </div>

              {/* Zoom & Alignment Controls */}
              <div className="space-y-3 pt-3 border-t border-[#EAE6DF]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#746F68] font-medium">
                    Zoom ({zoom.toFixed(2)}x)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                      className="p-1 rounded-[2px] border border-[#EAE6DF] hover:border-[#111113] text-[#746F68] hover:text-[#111113] bg-[#FAF8F5]"
                      title="Zoom out"
                    >
                      <ZoomOut size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                      className="p-1 rounded-[2px] border border-[#EAE6DF] hover:border-[#111113] text-[#746F68] hover:text-[#111113] bg-[#FAF8F5]"
                      title="Zoom in"
                    >
                      <ZoomIn size={12} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#EAE6DF] rounded-lg appearance-none cursor-pointer accent-[#C2922E]"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="flex-1 py-2 px-3 border border-[#EAE6DF] hover:border-[#111113] rounded-[2px] text-[10px] font-mono uppercase tracking-wider text-[#111113] bg-[#FAF8F5] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCw size={12} className="text-[#C2922E]" /> Rotate 90&deg;
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-2 px-3 border border-[#EAE6DF] hover:border-rose-400 rounded-[2px] text-[10px] font-mono uppercase tracking-wider text-[#746F68] hover:text-rose-700 bg-[#FAF8F5] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Reset to default alignment"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              </div>

              {/* LIVE STOREFRONT CARD PREVIEW */}
              <div className="space-y-2 pt-3 border-t border-[#EAE6DF]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#746F68] font-medium flex items-center gap-1">
                    <Eye size={12} className="text-[#C2922E]" /> Storefront Preview
                  </span>
                  <span className="text-[9px] font-mono text-[#746F68]">Collections Card</span>
                </div>

                {/* Card Mockup */}
                <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-3 rounded-[2px] shadow-xs">
                  <div className="relative aspect-[4/5] bg-[#111113] rounded-[1px] overflow-hidden border border-[#EAE6DF]/60">
                    <div
                      className="w-full h-full bg-cover bg-no-repeat transition-all"
                      style={{
                        backgroundImage: `url(${imageSrc})`,
                        backgroundPosition: `${50 - (crop.x / 4)}% ${50 - (crop.y / 4)}%`,
                        backgroundSize: `${zoom * 100}%`
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-[#111113]/85 backdrop-blur-xs text-[#C2922E] text-[7.5px] font-mono uppercase px-1.5 py-0.5 rounded-[1px] tracking-widest font-bold">
                      SUKO ATELIER
                    </div>
                  </div>
                  <div className="pt-2 space-y-0.5">
                    <p className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#111113] truncate">
                      Atelier Bespoke Silhouette
                    </p>
                    <p className="text-[9px] text-[#746F68] font-mono flex items-center justify-between">
                      <span>4:5 Aspect Ratio</span>
                      <span className="text-[#C2922E] font-medium">&bull; Live Ready</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS (STICKY BOTTOM) */}
            <div className="p-4 border-t border-[#EAE6DF] bg-white flex items-center gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="flex-1 py-2.5 px-4 border border-[#EAE6DF] hover:border-[#111113] text-[#746F68] hover:text-[#111113] rounded-[2px] text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium transition-colors cursor-pointer bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={saving}
                className="flex-1 py-2.5 px-4 bg-[#111113] hover:bg-[#C2922E] text-white rounded-[2px] text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} className="text-[#C2922E]" />
                    <span>Apply Crop</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;

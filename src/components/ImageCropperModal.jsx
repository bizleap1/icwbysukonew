import React, { useState, useRef, useEffect } from "react";
import { X, RotateCw, ZoomIn, ZoomOut, Check, Crop, Move, Maximize2 } from "lucide-react";

const ImageCropperModal = ({ imageSrc, onSave, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropPreset, setCropPreset] = useState("3:4"); // '3:4', '1:1', 'free'
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      setPan({ x: 0, y: 0 });
      drawCanvas();
    };
  }, [imageSrc]);

  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [zoom, rotation, cropPreset, pan]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");

    let targetW = 400;
    let targetH = 533; // 3:4 default

    if (cropPreset === "1:1") {
      targetW = 400;
      targetH = 400;
    } else if (cropPreset === "free") {
      targetW = 440;
      targetH = Math.round(440 * (img.height / img.width));
    }

    canvas.width = targetW;
    canvas.height = targetH;

    // Luxury Warm canvas background
    ctx.fillStyle = "#FAF8F5";
    ctx.fillRect(0, 0, targetW, targetH);

    ctx.save();
    ctx.translate(targetW / 2 + pan.x, targetH / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const scale = Math.max(targetW / img.width, targetH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw Crop Selection Grid Box Overlay in luxury gold
    ctx.save();
    ctx.strokeStyle = "#C2922E"; // Suko Gold crop box
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(2, 2, targetW - 4, targetH - 4);

    // Rule of thirds grid lines
    ctx.strokeStyle = "rgba(194, 146, 46, 0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    // Vertical grid
    ctx.moveTo(targetW / 3, 0); ctx.lineTo(targetW / 3, targetH);
    ctx.moveTo((targetW * 2) / 3, 0); ctx.lineTo((targetW * 2) / 3, targetH);
    // Horizontal grid
    ctx.moveTo(0, targetH / 3); ctx.lineTo(targetW, targetH / 3);
    ctx.moveTo(0, (targetH * 2) / 3); ctx.lineTo(targetW, (targetH * 2) / 3);
    ctx.stroke();

    ctx.restore();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export cropped canvas to JPEG blob / dataURL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    
    // Convert to File
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const croppedFile = new File([u8arr], "cropped-product.jpg", { type: mime });

    onSave({
      file: croppedFile,
      preview: dataUrl,
      width: canvas.width,
      height: canvas.height
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-[#E8E4DC] max-w-lg w-full p-6 sm:p-7 rounded-2xl relative shadow-2xl space-y-5 text-[#121215]">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 text-[#888890] hover:text-[#121215] p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-all"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="border-b border-[#E8E4DC] pb-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C2922E] font-mono block mb-1">
            — EDITORIAL RATIO ALIGNMENT
          </span>
          <h2 className="font-quiche text-2xl font-light text-[#121215]">
            Precision Image Cropper
          </h2>
          <p className="text-xs text-[#555560] font-body mt-1">
            Drag to pan & reposition the garment. Fits luxury high-res catalog displays.
          </p>
        </div>

        {/* Canvas Display Viewport */}
        <div 
          className="flex items-center justify-center bg-[#FAF8F5] p-3 border border-[#E8E4DC] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing relative select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            className="max-h-[380px] w-auto shadow-md rounded-lg"
          />
          <div className="absolute bottom-3 right-3 bg-[#121215]/80 backdrop-blur-md text-white text-[9px] font-mono px-2 py-1 rounded-md border border-white/15 flex items-center gap-1.5">
            <Move size={10} className="text-[#C2922E]" /> Click & Drag to Align
          </div>
        </div>

        {/* Crop Frame Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono">Crop Frame Preset</label>
            <span className="text-[10px] font-mono text-[#888890]">
              {cropPreset === "3:4" ? "400 x 533 px" : cropPreset === "1:1" ? "400 x 400 px" : "Free Custom"}
            </span>
          </div>

          <div className="flex gap-2">
            {[
              { id: "3:4", label: "3:4 Luxury Portrait" },
              { id: "1:1", label: "1:1 Square" },
              { id: "free", label: "Free Custom" }
            ].map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCropPreset(preset.id)}
                className={`flex-1 py-2 text-[10px] uppercase tracking-wider font-body rounded-xl border transition-all ${
                  cropPreset === preset.id 
                    ? "bg-[#121215] text-[#C2922E] font-bold border-[#C2922E]/40 shadow-sm" 
                    : "text-[#555560] border-[#E8E4DC] hover:border-[#C2922E] hover:text-[#121215] bg-[#FAF8F5]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E8E4DC]">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono">Zoom ({zoom.toFixed(1)}x)</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 rounded border border-[#E8E4DC] text-[#555560] hover:text-[#121215] hover:border-[#C2922E]">
                  <ZoomOut size={12} />
                </button>
                <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1 rounded border border-[#E8E4DC] text-[#555560] hover:text-[#121215] hover:border-[#C2922E]">
                  <ZoomIn size={12} />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-[#C2922E] cursor-pointer"
            />
          </div>

          <div className="space-y-1 flex flex-col justify-between">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono">Rotate</label>
            <button
              type="button"
              onClick={handleRotate}
              className="w-full py-2 border border-[#E8E4DC] rounded-xl text-xs font-body flex items-center justify-center gap-2 hover:bg-[#FAF8F5] hover:border-[#C2922E] transition-all text-[#121215]"
            >
              <RotateCw size={14} className="text-[#C2922E]" /> Rotate 90° ({rotation}°)
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-[#E8E4DC]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-[#E8E4DC] rounded-xl text-[10px] uppercase tracking-[0.2em] font-body text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-[#121215] hover:bg-[#C2922E] text-white font-bold text-[10px] uppercase tracking-[0.2em] font-body rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Check size={14} className="text-[#C2922E]" /> Apply Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;

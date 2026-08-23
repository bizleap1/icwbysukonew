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

    // Dark canvas background
    ctx.fillStyle = "#0c0c0e";
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

    // Draw Crop Selection Grid Box Overlay
    ctx.save();
    ctx.strokeStyle = "#10b981"; // Emerald green crop box
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(2, 2, targetW - 4, targetH - 4);

    // Rule of thirds grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
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
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <div className="max-w-[560px] w-full border border-white/20 p-6 bg-[#121214] text-foreground shadow-2xl relative rounded-sm space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Crop size={18} className="text-emerald-400" />
            <h3 className="font-display text-xl">Image Cropper & Frame Adjuster</h3>
          </div>
          <button onClick={onCancel} className="text-foreground/50 hover:text-foreground p-1">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-foreground/60 font-body -mt-2">
          Click & Drag image inside the frame to adjust crop position. Use zoom & rotation for exact framing.
        </p>

        {/* Interactive Canvas Box */}
        <div 
          className="flex flex-col items-center justify-center bg-black/80 border border-white/15 p-4 rounded relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas ref={canvasRef} className="max-h-[360px] max-w-full object-contain shadow-2xl border border-emerald-500/40" />
          
          <div className="absolute top-3 right-3 bg-black/80 px-2 py-1 border border-white/10 text-[9px] font-mono text-emerald-400 flex items-center gap-1">
            <Move size={10} /> Drag to Pan Frame
          </div>
        </div>

        {/* Crop Frame Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Crop Frame Preset</label>
            <span className="text-[10px] font-mono text-foreground/40">
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
                className={`flex-1 py-2 text-[10px] uppercase tracking-wider font-body border transition-all ${
                  cropPreset === preset.id 
                    ? "bg-emerald-500 text-black font-bold border-emerald-400 shadow-md" 
                    : "text-foreground/70 border-white/15 hover:border-white/40 bg-white/5"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Zoom ({zoom.toFixed(1)}x)</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 border border-white/15 text-foreground/60 hover:text-foreground">
                  <ZoomOut size={12} />
                </button>
                <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1 border border-white/15 text-foreground/60 hover:text-foreground">
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
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1 flex flex-col justify-between">
            <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Rotate</label>
            <button
              type="button"
              onClick={handleRotate}
              className="w-full py-2 border border-white/20 text-xs font-body flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-foreground"
            >
              <RotateCw size={14} /> Rotate 90° ({rotation}°)
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-white/20 text-[10px] uppercase tracking-[0.2em] font-body hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-emerald-500 text-black font-bold text-[10px] uppercase tracking-[0.2em] font-body hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
          >
            <Check size={14} /> Apply Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;

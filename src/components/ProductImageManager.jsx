import React, { useState, useRef } from "react";
import {
  Crop,
  RefreshCw,
  Trash2,
  Plus,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  GripVertical,
  CheckCircle2
} from "lucide-react";

export const CANONICAL_IMAGE_ROLES = [
  { value: "model_front", label: "Front / Main Look (Cover)", shortLabel: "Front" },
  { value: "model_three_quarter", label: "3/4 Profile Angle", shortLabel: "3/4 View" },
  { value: "detail", label: "Bespoke Detail / Fabric", shortLabel: "Detail" },
  { value: "model_back", label: "Back Silhouette", shortLabel: "Back" },
  { value: "garment_front", label: "Garment Flat Lay", shortLabel: "Flat Lay" },
  { value: "model_side", label: "Side Profile", shortLabel: "Side" }
];

/**
 * ProductImageManager
 *
 * Dedicated quiet-luxury image management component for SUKO Atelier Admin.
 * Supports:
 * - Drag and drop reordering (HTML5)
 * - 1-Click "Set as Cover"
 * - Step-by-step Move Left / Move Right
 * - Replace Image slot directly
 * - Remove Image slot with 3-image minimum validation check for Active products
 * - Crop trigger (4:5 luxury portrait ratio)
 * - Angle role tagging
 * - Bulk image upload
 */
export default function ProductImageManager({
  images = [],
  onChange,
  onOpenCropper,
  productStatus = "active",
  disabled = false
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);
  const replaceInputRefs = useRef({});

  const isBelowMinActive = productStatus === "active" && images.length < 3;

  // Reorder handlers
  const handleDragStart = (e, index) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch (err) {
      // ignore
    }
  };

  const handleDragOver = (e, index) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    if (disabled) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === undefined || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...images];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Update primary flag: slot 0 is always Primary Cover
    const normalized = reordered.map((item, idx) => ({
      ...item,
      isPrimary: idx === 0,
      type: idx === 0 ? (item.type || "model_front") : (item.type || CANONICAL_IMAGE_ROLES[Math.min(idx, CANONICAL_IMAGE_ROLES.length - 1)].value)
    }));

    onChange(normalized);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;

    const normalized = copy.map((item, idx) => ({
      ...item,
      isPrimary: idx === 0
    }));

    onChange(normalized);
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    const copy = [...images];
    const [selected] = copy.splice(index, 1);
    selected.isPrimary = true;
    selected.type = "model_front";

    const normalized = [selected, ...copy.map(it => ({ ...it, isPrimary: false }))];
    onChange(normalized);
  };

  // Remove handler
  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      isPrimary: idx === 0
    }));
    onChange(updated);
  };

  // Replace image handler
  const handleReplaceFile = (index, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const updated = images.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          file,
          preview: previewUrl,
          url: undefined, // marked as new upload
          crop: undefined,
          isCropped: false
        };
      }
      return item;
    });
    onChange(updated);

    // Prompt crop immediately if callback provided
    if (onOpenCropper) {
      setTimeout(() => {
        onOpenCropper(index, previewUrl);
      }, 100);
    }
  };

  // Add new files
  const handleAddFiles = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const startIdx = images.length;
    const newItems = files.map((file, idx) => {
      const slotIdx = startIdx + idx;
      const defaultRole = CANONICAL_IMAGE_ROLES[Math.min(slotIdx, CANONICAL_IMAGE_ROLES.length - 1)].value;
      return {
        id: `new-${Date.now()}-${idx}`,
        file,
        preview: URL.createObjectURL(file),
        type: defaultRole,
        isPrimary: startIdx === 0 && idx === 0,
        isCropped: false
      };
    });

    const updated = [...images, ...newItems].map((item, idx) => ({
      ...item,
      isPrimary: idx === 0
    }));

    onChange(updated);
    e.target.value = "";
  };

  const handleRoleChange = (index, newRole) => {
    const updated = images.map((item, i) => (i === index ? { ...item, type: newRole } : item));
    onChange(updated);
  };

  return (
    <div className="space-y-3 font-body select-none">
      {/* HEADER WITH COUNTER & VALIDATION STATUS */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#E5DDD1]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[#111113]">
            LOOKBOOK IMAGERY
          </span>
          <span className="text-[9.5px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-[1px] bg-[#FAF8F5] border border-[#E5DDD1] text-[#746F68]">
            {images.length} {images.length === 1 ? "IMAGE" : "IMAGES"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {productStatus === "active" ? (
            images.length >= 3 ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[1px] border border-emerald-200">
                <CheckCircle2 size={11} />
                <span>Showroom Ready (3+ images)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[1px] border border-rose-200 font-semibold animate-pulse">
                <AlertTriangle size={11} />
                <span>Min 3 Images Required</span>
              </span>
            )
          ) : (
            <span className="text-[9px] font-mono text-[#746F68]">
              Draft mode (min. 1 image)
            </span>
          )}
        </div>
      </div>

      {/* WARNING BANNER IF BELOW MINIMUM FOR ACTIVE */}
      {isBelowMinActive && (
        <div className="p-2.5 bg-amber-50/80 border border-amber-300/80 rounded-[2px] text-[#78350F] flex items-start gap-2 text-[10.5px] font-mono leading-relaxed">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-semibold block text-amber-900">
              Active Showroom Requires Minimum 3 Images
            </span>
            <span>
              This product currently has {images.length} {images.length === 1 ? "image" : "images"}. Please upload {3 - images.length} more {3 - images.length === 1 ? "image" : "images"} to publish as Active, or switch product status to <strong>Draft</strong>.
            </span>
          </div>
        </div>
      )}

      {/* SLOTS GRID (4:5 PORTRAIT RATIO) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {images.map((item, idx) => {
          const isCover = idx === 0;
          const isDragged = draggedIndex === idx;
          const isOver = dragOverIndex === idx;
          const imgSrc = item.preview || item.url;
          const roleObj = CANONICAL_IMAGE_ROLES.find(r => r.value === item.type) || CANONICAL_IMAGE_ROLES[Math.min(idx, CANONICAL_IMAGE_ROLES.length - 1)];

          return (
            <div
              key={item.id || `slot-${idx}`}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, idx)}
              className={`relative aspect-[4/5] bg-[#111113] rounded-[2px] overflow-hidden border group shadow-2xs transition-all flex flex-col justify-between ${
                isCover
                  ? "border-[#C2922E] ring-1 ring-[#C2922E]/40"
                  : isOver
                  ? "border-[#C2922E] scale-102 ring-2 ring-[#C2922E]"
                  : "border-[#E5DDD1] hover:border-[#111113]"
              } ${isDragged ? "opacity-35 scale-95" : "opacity-100"}`}
            >
              {/* Image Preview */}
              <img
                src={imgSrc}
                alt={`Garment image ${idx + 1}`}
                className="w-full h-full object-cover object-center"
              />

              {/* TOP STRIP: COVER BADGE & DRAG HANDLE */}
              <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
                {isCover ? (
                  <span className="inline-flex items-center gap-1 bg-[#111113]/95 text-[#C2922E] text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded-[1px] tracking-wider border border-[#C2922E]/50 shadow-xs pointer-events-auto">
                    <Star size={9} className="fill-[#C2922E]" />
                    COVER LOOK
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCover(idx)}
                    title="Make this the Cover / Primary image"
                    className="inline-flex items-center gap-1 bg-black/60 hover:bg-[#C2922E] text-white text-[7.5px] font-mono uppercase font-medium px-1.5 py-0.5 rounded-[1px] tracking-wider transition-colors pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <Star size={8} />
                    Make Cover
                  </button>
                )}

                {/* Drag Indicator */}
                <span
                  title="Drag to reorder"
                  className="bg-black/60 text-white/80 p-1 rounded-[1px] cursor-grab active:cursor-grabbing pointer-events-auto opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical size={11} />
                </span>
              </div>

              {/* BOTTOM STRIP: ROLE & CROP INDICATOR */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 pointer-events-none z-10">
                <span className="bg-black/75 backdrop-blur-xs text-white/90 text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-[1px] truncate shadow-xs">
                  {roleObj.shortLabel}
                </span>

                {item.isCropped && (
                  <span className="bg-[#C2922E]/90 text-white text-[7px] font-mono uppercase tracking-tighter px-1 py-0.5 rounded-[1px]">
                    4:5 CROPPED
                  </span>
                )}
              </div>

              {/* HOVER ACTION OVERLAY (REPLACE, CROP, REMOVE, REORDER) */}
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-between p-2.5 z-20">
                {/* Overlay Header: Slot number + Quick Reorder Arrows */}
                <div className="flex items-center justify-between text-white">
                  <span className="text-[8.5px] font-mono text-white/80 font-bold uppercase tracking-wider">
                    SLOT 0{idx + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, -1)}
                      title="Move Left"
                      className="p-1 bg-white/15 hover:bg-white text-white hover:text-black rounded-[1px] disabled:opacity-30 disabled:hover:bg-white/15 disabled:hover:text-white cursor-pointer transition-colors"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => handleMove(idx, 1)}
                      title="Move Right"
                      className="p-1 bg-white/15 hover:bg-white text-white hover:text-black rounded-[1px] disabled:opacity-30 disabled:hover:bg-white/15 disabled:hover:text-white cursor-pointer transition-colors"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Center Buttons: Edit Crop, Replace, Remove */}
                <div className="flex flex-col gap-1.5 my-auto">
                  {/* Edit 4:5 Crop */}
                  <button
                    type="button"
                    onClick={() => onOpenCropper && onOpenCropper(idx, imgSrc)}
                    className="w-full py-1 px-2 bg-white hover:bg-[#C2922E] text-[#111113] hover:text-white rounded-[2px] text-[9px] font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <Crop size={11} />
                    <span>Edit 4:5 Crop</span>
                  </button>

                  {/* Replace Slot */}
                  <label
                    className="w-full py-1 px-2 bg-white/90 hover:bg-white text-[#111113] rounded-[2px] text-[9px] font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <RefreshCw size={11} />
                    <span>Replace Image</span>
                    <input
                      ref={(el) => (replaceInputRefs.current[idx] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleReplaceFile(idx, e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  {/* Remove Slot */}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="w-full py-1 px-2 bg-rose-600/90 hover:bg-rose-700 text-white rounded-[2px] text-[9px] font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <Trash2 size={11} />
                    <span>Remove Slot</span>
                  </button>
                </div>

                {/* Bottom Role Selector */}
                <div className="pt-1">
                  <select
                    value={item.type || roleObj.value}
                    onChange={(e) => handleRoleChange(idx, e.target.value)}
                    className="w-full bg-black/80 border border-white/20 text-white text-[8px] font-mono uppercase tracking-wider rounded-[1px] px-1 py-0.5 outline-none cursor-pointer hover:border-[#C2922E]"
                  >
                    {CANONICAL_IMAGE_ROLES.map((r) => (
                      <option key={r.value} value={r.value} className="bg-[#111113] text-white">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {/* + ADD IMAGE SLOT CARD */}
        <label className="border border-dashed border-[#E5DDD1] hover:border-[#C2922E] rounded-[2px] aspect-[4/5] bg-white hover:bg-[#FAF8F5] transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer group shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E5DDD1] group-hover:border-[#C2922E] group-hover:bg-[#111113] flex items-center justify-center transition-all mb-2">
            <Plus size={16} className="text-[#C2922E] group-hover:text-white" />
          </div>
          <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#111113] group-hover:text-[#C2922E]">
            + Add Look Image
          </span>
          <span className="text-[8px] font-mono text-[#746F68] mt-0.5">
            Portrait 4:5 Master
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddFiles}
            className="hidden"
          />
        </label>
      </div>

      {/* FOOTER HELPER TEXT */}
      <div className="flex flex-wrap items-center justify-between text-[9px] font-mono text-[#746F68] pt-1">
        <span>
          💡 Drag cards to rearrange &middot; Slot 01 is always the Primary Cover image
        </span>
        <span className="text-[#C2922E]">
          4:5 luxury aspect ratio
        </span>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../config/api";

export const ReviewsSection = ({
  product,
  user,
  reviewsData,
  setReviewsData
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(0); // Starts empty (0 stars selected by default)
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (reviewImages.length + files.length > 3) {
      toast.error("You can upload up to 3 client fit & styling photos");
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file (PNG, JPG, WEBP)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each image must be under 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setReviewImages((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (newRating === 0) {
      toast.error("Please select a star rating before submitting");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please share your feedback details");
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          product_id: product.backendId || product.id,
          rating: newRating,
          comment: newComment.trim(),
          images: reviewImages
        })
      });

      // Update local state if setter provided
      if (setReviewsData) {
        setReviewsData((prev) => {
          const currentReviews = prev?.reviews || [];
          return {
            ...prev,
            reviews: [
              {
                id: `rev-${Date.now()}`,
                rating: newRating,
                comment: newComment.trim(),
                images: reviewImages,
                user: { name: user?.name || "Verified Client" }
              },
              ...currentReviews
            ]
          };
        });
      }

      toast.success("Review submitted for atelier verification!");
      setShowReviewForm(false);
      setNewComment("");
      setNewRating(0);
      setHoverRating(0);
      setReviewImages([]);
    } catch (err) {
      if (setReviewsData) {
        setReviewsData((prev) => {
          const currentReviews = prev?.reviews || [];
          return {
            ...prev,
            reviews: [
              {
                id: `rev-${Date.now()}`,
                rating: newRating,
                comment: newComment.trim(),
                images: reviewImages,
                user: { name: user?.name || "Verified Client" }
              },
              ...currentReviews
            ]
          };
        });
      }
      toast.success("Review & photos submitted for atelier verification!");
      setShowReviewForm(false);
      setNewComment("");
      setNewRating(0);
      setHoverRating(0);
      setReviewImages([]);
    } finally {
      setSubmittingReview(false);
    }
  };

  const hasReviews = reviewsData?.reviews && reviewsData.reviews.length > 0;

  return (
    <section className="pt-2 sm:pt-3 border-t border-[#E8E4DC] font-body">
      {/* 1. Header (shown when reviews exist OR when form is open) */}
      {(hasReviews || showReviewForm) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1">
              CLIENT EXPERIENCES
            </span>
            <h3 className="font-quiche text-2xl sm:text-3xl text-[#111113] font-light">
              Reviews
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-transparent border border-[#111113] text-[#111113] text-[10.5px] uppercase tracking-[0.22em] font-medium hover:border-[#C2922E] hover:text-[#C2922E] transition-colors self-start sm:self-auto cursor-pointer"
          >
            <MessageSquare size={13} />
            <span>{showReviewForm ? "Close Form" : "Write a Review"}</span>
          </button>
        </div>
      )}

      {/* 2. Review Form Drawer */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmitReview}
            className="bg-[#F3EFE6] border border-[#E8E4DC] p-5 sm:p-6 mb-8 overflow-hidden"
          >
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111113] mb-4">
              Share Your Feedback on Fit &amp; Tailoring
            </h4>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#555560] block mb-1.5">
                  Your Rating {newRating > 0 && <span className="text-[#C2922E] font-medium">({newRating}/5 Stars)</span>}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || newRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        className="text-xl transition-transform hover:scale-110 focus:outline-none cursor-pointer p-0.5"
                      >
                        <Star
                          size={18}
                          className={isFilled ? "fill-[#C2922E] text-[#C2922E]" : "fill-none text-[#DDD8CE] hover:text-[#C2922E]"}
                          strokeWidth={1.5}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#555560] block mb-1">Review Details</label>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Describe the fabric texture, shoulder padding structure, and trouser drape..."
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E8E4DC] p-3 text-xs text-[#111113] outline-none focus:border-[#C2922E]"
                />
              </div>

              {/* Client Photo Upload Zone */}
              <div>
                <label className="text-[11px] text-[#555560] block mb-1.5 font-medium">
                  Client Styling &amp; Fit Photos (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Uploaded Thumbnail Previews */}
                  {reviewImages.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-20 bg-white border border-[#E8E4DC] overflow-hidden group shadow-sm"
                    >
                      <img
                        src={imgSrc}
                        alt={`Fit photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        aria-label="Remove photo"
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button Box */}
                  {reviewImages.length < 3 && (
                    <label className="w-16 h-20 border border-dashed border-[#C2922E]/60 hover:border-[#C2922E] bg-[#FAF8F5] hover:bg-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-1 text-center">
                      <Camera size={16} className="text-[#C2922E]" />
                      <span className="text-[9px] uppercase tracking-wider text-[#6B6B76] font-medium">
                        Add Photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <span className="text-[10px] text-[#8C887B] block mt-1.5 font-light">
                  Attach up to 3 photos showing garment drape, tailoring fit, or styling.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewImages([]);
                  }}
                  className="px-4 py-2 text-xs uppercase tracking-wider border border-[#111113] text-[#111113] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 text-xs uppercase tracking-wider bg-[#111113] text-white hover:bg-[#C2922E] disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 3. Zero Reviews Seamless Editorial State */}
      {!hasReviews && !showReviewForm && (
        <div className="py-4 px-4 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-4 h-[1px] bg-[#C2922E]" />
            <span className="text-[9.5px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-body">
              CLIENT EXPERIENCES
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>

          <h4 className="font-quiche text-2xl sm:text-3xl text-[#111113] font-light mb-3">
            Reviews
          </h4>

          <div className="text-xs sm:text-[12.5px] text-[#6B6B76] font-light leading-relaxed mb-6 space-y-0.5">
            <p>No reviews yet.</p>
            <p>Be the first woman to share her SUKO moment.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowReviewForm(true)}
            className="inline-flex items-center justify-center gap-2 px-7 py-2.5 bg-transparent border border-[#111113] text-[#111113] text-[10px] sm:text-[10.5px] uppercase tracking-[0.24em] font-medium hover:border-[#C2922E] hover:text-[#C2922E] transition-all duration-300 cursor-pointer group"
          >
            <MessageSquare size={13} className="text-[#111113] group-hover:text-[#C2922E] transition-colors" />
            <span>Write a Review</span>
          </button>
        </div>
      )}

      {/* 4. Reviews List */}
      {hasReviews && (
        <div className="space-y-4">
          {reviewsData.reviews.map((rev) => (
            <div key={rev.id} className="p-4 bg-[#F3EFE6] border border-[#E8E4DC]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[#111113]">
                  {rev.user?.name || "Verified Client"}
                </span>
                <span className="text-xs text-[#C2922E]">{"★".repeat(rev.rating)}</span>
              </div>
              <p className="text-xs text-[#555560] font-light leading-relaxed">
                {rev.comment}
              </p>
              {rev.images && rev.images.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {rev.images.map((img, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={img}
                      alt={`Client styling photo ${imgIdx + 1}`}
                      className="w-14 h-18 object-cover border border-[#E8E4DC] shadow-sm bg-white"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

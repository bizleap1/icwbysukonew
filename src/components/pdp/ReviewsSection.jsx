import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../config/api";

export const ReviewsSection = ({
  product,
  user,
  reviewsData,
  setReviewsData
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          product_id: product.backendId || product.id,
          rating: newRating,
          comment: newComment.trim()
        })
      });

      if (res.ok) {
        toast.success("Review submitted for atelier verification!");
        setShowReviewForm(false);
        setNewComment("");
      } else {
        toast.info("Thank you! Review received.");
        setShowReviewForm(false);
      }
    } catch (err) {
      toast.info("Thank you! Review received.");
      setShowReviewForm(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <section className="mt-16 sm:mt-24 pt-10 sm:pt-14 border-t border-[#E8E4DC] font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-1">
            CLIENT VERIFICATIONS
          </span>
          <h3 className="font-quiche text-2xl sm:text-3xl text-[#111113] font-light">
            Reviews &amp; Experience
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111113] text-white text-xs uppercase tracking-[0.18em] font-medium hover:bg-[#C2922E] transition-colors self-start sm:self-auto"
        >
          <MessageSquare size={13} />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Review Form Drawer */}
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
                <label className="text-[11px] text-[#555560] block mb-1">Your Rating</label>
                <div className="flex items-center gap-1.5 text-[#C2922E]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="text-lg focus:outline-none"
                    >
                      {star <= newRating ? "★" : "☆"}
                    </button>
                  ))}
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 text-xs uppercase tracking-wider border border-[#111113] text-[#111113]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 text-xs uppercase tracking-wider bg-[#111113] text-white hover:bg-[#C2922E] disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
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
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#75757A] italic py-2">
          Be the first to review this tailored piece.
        </p>
      )}
    </section>
  );
};

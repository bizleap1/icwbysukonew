import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatINR } from "../data/products";

const CartDrawer = () => {
  const { isOpen, closeCart, items, removeItem, updateQty, subtotal } = useCart();
  const navigate = useNavigate();

  const goCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Dim Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[70]"
            data-testid="cart-backdrop"
          />

          {/* Luxury Warm Ivory Slide-Over Drawer */}
          <motion.aside
            data-testid="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[80] w-full sm:w-[480px] bg-[#FAF8F5] text-[#121215] border-l border-[#E8E4DC] shadow-2xl flex flex-col font-body selection:bg-[#C2922E] selection:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-[#E8E4DC] bg-[#FAF8F5]">
              <div>
                <span className="text-[9.5px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-0.5">
                  YOUR CURATED SELECTION
                </span>
                <h3 className="font-quiche text-xl sm:text-2xl font-light tracking-tight text-[#111113]">
                  Shopping Bag
                </h3>
              </div>
              <button 
                data-testid="cart-close-btn" 
                onClick={closeCart} 
                className="p-1.5 text-[#111113]/70 hover:text-[#C2922E] transition-colors rounded-full hover:bg-black/5"
                aria-label="Close bag"
              >
                <X size={20} strokeWidth={1.3} />
              </button>
            </div>

            {/* Scrollable Items Section */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
              {items.length === 0 ? (
                <div data-testid="cart-empty" className="flex flex-col items-center justify-center py-24 sm:py-32 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#F3EFE6] border border-[#E8E4DC] flex items-center justify-center mb-5 text-[#C2922E]">
                    <ShoppingBag size={20} strokeWidth={1.3} />
                  </div>
                  <h4 className="font-quiche text-2xl font-light text-[#111113] mb-2">
                    Your bag is quiet
                  </h4>
                  <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed max-w-xs mb-7">
                    Begin curating your personal collection of ICW architectural tailoring.
                  </p>
                  <button
                    onClick={() => {
                      closeCart();
                      navigate("/new-in");
                    }}
                    className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] font-medium text-[#111113] hover:text-[#C2922E] transition-colors border-b border-[#111113] hover:border-[#C2922E] pb-1"
                  >
                    <span>EXPLORE NEW ARRIVALS</span>
                    <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-[#E8E4DC]/70">
                  {items.map((item) => (
                    <li key={item.key} data-testid={`cart-item-${item.id}`} className="py-5 first:pt-0 last:pb-0 flex gap-4 sm:gap-5">
                      <div className="w-20 h-28 sm:w-24 sm:h-32 shrink-0 bg-[#F3EFE6] border border-[#EAE6DF] overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover object-top" 
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-quiche text-[15px] sm:text-base font-light text-[#111113] leading-snug line-clamp-2">
                              {item.name}
                            </h4>
                            <button
                              data-testid={`cart-remove-${item.id}`}
                              onClick={() => removeItem(item.key)}
                              className="text-[#888894] hover:text-[#111113] transition-colors p-1 -mr-1 -mt-1"
                              aria-label="Remove item"
                            >
                              <X size={14} strokeWidth={1.3} />
                            </button>
                          </div>
                          <p className="text-[9.5px] uppercase tracking-[0.2em] text-[#777782] mt-1 font-medium">
                            Size: {item.size}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3">
                          {/* Quantity Selector */}
                          <div className="flex items-center border border-[#E8E4DC] bg-white">
                            <button
                              data-testid={`cart-decrease-${item.id}`}
                              onClick={() => updateQty(item.key, item.qty - 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#111113]/70 hover:bg-[#F3EFE6] hover:text-[#C2922E] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={11} strokeWidth={1.3} />
                            </button>
                            <span className="w-8 text-center text-xs font-medium text-[#111113] font-body select-none">
                              {item.qty}
                            </span>
                            <button
                              data-testid={`cart-increase-${item.id}`}
                              onClick={() => updateQty(item.key, item.qty + 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#111113]/70 hover:bg-[#F3EFE6] hover:text-[#C2922E] transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={11} strokeWidth={1.3} />
                            </button>
                          </div>

                          {/* Item Price */}
                          <span className="font-light text-xs sm:text-sm text-[#111113] tracking-wider">
                            {formatINR(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer Summary / Checkout CTA */}
            {items.length > 0 && (
              <div className="border-t border-[#E8E4DC] bg-[#FAF8F5] px-6 sm:px-8 py-5 sm:py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-[#555560] font-medium">
                    Estimated Subtotal
                  </span>
                  <span data-testid="cart-subtotal" className="font-quiche text-xl sm:text-2xl font-light text-[#111113]">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#777782] leading-relaxed">
                  Complimentary luxury delivery &amp; taxes calculated at checkout
                </p>
                <button
                  data-testid="cart-checkout-btn"
                  onClick={goCheckout}
                  className="w-full bg-[#111113] text-white py-4 text-[11px] uppercase tracking-[0.26em] font-medium hover:bg-[#C2922E] transition-all duration-300 shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

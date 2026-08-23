import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCTS, formatINR } from "../data/products";

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (query.trim().length > 1) {
        const q = query.toLowerCase();
        const filtered = PRODUCTS.filter(
          (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.fabric.toLowerCase().includes(q)
        );
        setResults(filtered.slice(0, 6)); // limit to top 6
      } else {
        setResults([]);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] bg-[#0a0a0c]/90 backdrop-blur-xl flex flex-col pt-20 px-6 lg:px-12"
        >
          <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-white/20 pb-4 relative">
              <Search className="text-white/50 shrink-0" size={24} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, fabrics, or categories..."
                className="w-full bg-transparent border-none outline-none text-2xl lg:text-4xl font-display text-white px-6 placeholder-white/20"
              />
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <X size={32} />
              </button>
            </div>

            <div className="mt-10 overflow-y-auto pb-20 flex-1">
              {query.length > 1 && results.length === 0 ? (
                <p className="text-center font-body text-white/50 mt-10">
                  No results found for "{query}". Try "Silk" or "Suit".
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onClose();
                        navigate(`/product/${product.slug}`);
                      }}
                      className="flex items-center gap-6 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="w-20 h-24 shrink-0 overflow-hidden bg-[#15151a]">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-body text-white/50 block mb-1">
                          {product.category}
                        </span>
                        <h4 className="font-display text-xl text-white mb-2 group-hover:text-white/80 transition-colors">
                          {product.name}
                        </h4>
                        <span className="font-body text-sm text-white/70">{formatINR(product.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;

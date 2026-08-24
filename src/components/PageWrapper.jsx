import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const PageWrapper = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ 
        duration: shouldReduceMotion ? 0.2 : 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      className="w-full h-full origin-top"
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;

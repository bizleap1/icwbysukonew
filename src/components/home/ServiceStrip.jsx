import React from "react";

export const ServiceStrip = () => {
  return (
    <section className="bg-[#F6F2EA] py-5 sm:py-5.5 px-4 sm:px-6 lg:px-12 border-y border-[#E2DDD5] transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto grid grid-cols-2 gap-y-3.5 gap-x-3 text-center sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:text-left text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#222227] font-normal">
        <span>CURATED EDITIONS</span>
        <span className="hidden sm:inline text-[#D8D4CC]/70">&bull;</span>
        <span>SIGNATURE TAILORING</span>
        <span className="hidden sm:inline text-[#D8D4CC]/70">&bull;</span>
        <span>COORDINATED SETS</span>
        <span className="hidden sm:inline text-[#D8D4CC]/70">&bull;</span>
        <span>CLIENT CONCIERGE</span>
      </div>
    </section>
  );
};

export default ServiceStrip;

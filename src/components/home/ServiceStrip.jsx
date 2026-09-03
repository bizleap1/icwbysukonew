import React from "react";

export const ServiceStrip = () => {
  const PILLARS = [
    { id: "curated", label: "CURATED BY MOMENT" },
    { id: "signatures", label: "SIGNATURE TAILORING" },
    { id: "coords", label: "COORDINATED SETS" },
    { id: "styling", label: "PERSONAL STYLING" }
  ];

  return (
    <section className="bg-[#FAF8F5] border-y border-[#E8E4DC] transition-colors duration-300 w-full select-none cursor-default">
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-14">
        {/* Mobile 2x2 Clean Static Layout (< sm) - Sleek slim height */}
        <div className="grid grid-cols-2 sm:hidden font-body text-[9px] uppercase tracking-[0.22em] text-[#44444C] py-0.5">
          {PILLARS.map((pillar, idx) => {
            const isRightCol = idx % 2 === 1;
            const isTopRow = idx < 2;
            const borderClasses = `${!isRightCol ? "border-r" : ""} ${isTopRow ? "border-b" : ""} border-[#E8E4DC]`;

            return (
              <span
                key={pillar.id}
                className={`h-[28px] flex items-center justify-center text-center px-2 font-medium ${borderClasses}`}
              >
                {pillar.label}
              </span>
            );
          })}
        </div>

        {/* Desktop 4 Equal Columns / Evenly Distributed Row (>= sm) - Ultra-slim refined height ~40-44px */}
        <div className="hidden sm:grid sm:grid-cols-4 items-center text-center font-body text-[9.5px] lg:text-[10.5px] uppercase tracking-[0.28em] text-[#44444C] h-[38px] sm:h-[42px] lg:h-[44px]">
          {PILLARS.map((pillar, idx) => (
            <div key={pillar.id} className="flex items-center justify-center relative w-full h-full">
              <span className="font-medium py-0.5">
                {pillar.label}
              </span>
              {idx < PILLARS.length - 1 && (
                <span className="absolute -right-0.5 text-[#C2922E] text-[11px] font-bold select-none hidden lg:inline-block pointer-events-none">
                  &middot;
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceStrip;

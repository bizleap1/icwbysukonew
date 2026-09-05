import React from "react";
import { Link } from "react-router-dom";

// 3 Curated Complete Power Ensembles (Full-Body Outfits)
const SIGNATURE_LOOKS = [
  {
    id: "authority-suit",
    title: "The Authority Suit",
    productSlug: "the-noir-tailored-suit",
    image: "/products/the-noir-tailored-suit/1.webp",
  },
  {
    id: "everyday-executive",
    title: "The Everyday Executive",
    productSlug: "the-midnight-sculpted-vest-set",
    image: "/products/midnight-sculpted-vest-set/1.webp",
  },
  {
    id: "travel-edit",
    title: "The Travel Edit",
    productSlug: "the-lilac-flare-suit",
    image: "/products/lilac-sculpted-flare-suit/1.webp",
  }
];

export const SignatureLooksSection = () => {
  const [authoritySuit, everydayExecutive, travelEdit] = SIGNATURE_LOOKS;

  return (
    <section className="bg-[#FAF8F5] pt-8 sm:pt-12 lg:pt-14 pb-16 sm:pb-24 lg:pb-32 transition-colors duration-300">
      <div className="w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14">
        
        {/* 1. Header (Centered Minimal Luxury Campaign) */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
            <span className="w-4 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.34em] text-[#C2922E] font-medium font-body">
              THE SUKO EDIT
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>
          <h2 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#121215] mb-2.5">
            Signature Suko <span className="italic font-normal">Collection.</span>
          </h2>
          <p className="text-[#555562] font-body text-xs sm:text-[14px] font-light leading-relaxed">
            Complete looks, considered from every angle.
          </p>
        </div>

        {/* 2. Top Dominant Hero Campaign Story (Large Centered Full-Body Editorial Portrait) */}
        <div className="max-w-4xl mx-auto mb-16 sm:mb-20 lg:mb-24">
          <Link
            to={`/product/${authoritySuit.productSlug}`}
            className="group block select-none cursor-pointer"
          >
            <div className="relative aspect-[3/4.2] sm:aspect-[3/4] lg:aspect-[4/5] overflow-hidden bg-[#EFECE6]">
              <img
                src={authoritySuit.image}
                alt={authoritySuit.title}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== authoritySuit.image.replace('.webp', '.png')) {
                    e.currentTarget.src = authoritySuit.image.replace('.webp', '.png');
                  }
                }}
                className="w-full h-full object-cover object-[50%_12%] transition-transform duration-1000 ease-out group-hover:scale-104"
              />
            </div>
            
            {/* Minimal Caption */}
            <div className="pt-5 sm:pt-6 text-center">
              <h3 className="font-quiche text-2xl sm:text-3xl lg:text-[32px] font-light text-[#121215] tracking-tight mb-2.5 group-hover:text-[#C2922E] transition-colors">
                {authoritySuit.title}
              </h3>
              <div>
                <span className="relative inline-block pt-0 pb-0.5 select-none">
                  <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.24em] font-medium text-[#121215] block">
                    SHOP THE LOOK
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* 3. Bottom Two Supporting Editorial Stories (Generous Breathing Room) */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-stretch">
          
          {/* Look 2: The Everyday Executive */}
          <Link
            to={`/product/${everydayExecutive.productSlug}`}
            className="group flex flex-col justify-between select-none cursor-pointer"
          >
            <div className="relative aspect-[3/4] sm:aspect-[3/3.9] overflow-hidden bg-[#EFECE6]">
              <img
                src={everydayExecutive.image}
                alt={everydayExecutive.title}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== everydayExecutive.image.replace('.webp', '.png')) {
                    e.currentTarget.src = everydayExecutive.image.replace('.webp', '.png');
                  }
                }}
                className="w-full h-full object-cover object-[50%_10%] transition-transform duration-1000 ease-out group-hover:scale-104"
              />
            </div>
            <div className="pt-4 sm:pt-5 text-center flex-1 flex flex-col justify-between">
              <h3 className="font-quiche text-xl sm:text-2xl lg:text-[25px] font-light text-[#121215] tracking-tight mb-2.5 group-hover:text-[#C2922E] transition-colors">
                {everydayExecutive.title}
              </h3>
              <div>
                <span className="relative inline-block pt-0 pb-0.5 select-none">
                  <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.24em] font-medium text-[#121215] block">
                    SHOP THE LOOK
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </span>
              </div>
            </div>
          </Link>

          {/* Look 3: The Travel Edit */}
          <Link
            to={`/product/${travelEdit.productSlug}`}
            className="group flex flex-col justify-between select-none cursor-pointer"
          >
            <div className="relative aspect-[3/4] sm:aspect-[3/3.9] overflow-hidden bg-[#EFECE6]">
              <img
                src={travelEdit.image}
                alt={travelEdit.title}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== travelEdit.image.replace('.webp', '.png')) {
                    e.currentTarget.src = travelEdit.image.replace('.webp', '.png');
                  }
                }}
                className="w-full h-full object-cover object-[50%_12%] transition-transform duration-1000 ease-out group-hover:scale-104"
              />
            </div>
            <div className="pt-4 sm:pt-5 text-center flex-1 flex flex-col justify-between">
              <h3 className="font-quiche text-xl sm:text-2xl lg:text-[25px] font-light text-[#121215] tracking-tight mb-2.5 group-hover:text-[#C2922E] transition-colors">
                {travelEdit.title}
              </h3>
              <div>
                <span className="relative inline-block pt-0 pb-0.5 select-none">
                  <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.24em] font-medium text-[#121215] block">
                    SHOP THE LOOK
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </span>
              </div>
            </div>
          </Link>

        </div>

      </div>
    </section>
  );
};

export default SignatureLooksSection;

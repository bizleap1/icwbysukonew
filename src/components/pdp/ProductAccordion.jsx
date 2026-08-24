import React, { useState } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";

export const ProductAccordion = ({ product }) => {
  const [openSection, setOpenSection] = useState("details");

  const sections = [
    {
      id: "details",
      title: "TAILORING & DESIGN DETAILS",
      content: (
        <div className="space-y-2 text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
          <p>{product.description || "Sculptural silhouette designed for executive leadership."}</p>
          <ul className="list-disc pl-4 space-y-1 pt-1">
            <li>Structured architectural shoulders with full luxury lining.</li>
            <li>Precision hand-finished lapels and contrast satin horn buttons.</li>
            <li>Concealed internal pockets and tailored vents for ease of movement.</li>
          </ul>
        </div>
      )
    },
    {
      id: "fabric",
      title: "FABRIC & CARE INSTRUCTIONS",
      content: (
        <div className="space-y-2 text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
          <p>
            <strong className="text-[#111113] font-medium">Composition:</strong> {product.fabric || "Premium Poly-Viscose with 4-Way Executive Stretch"}.
          </p>
          <p>
            <strong className="text-[#111113] font-medium">Care:</strong> Specialized dry clean only. Steam on low heat. Store on structured luxury hanger provided.
          </p>
        </div>
      )
    },
    {
      id: "shipping",
      title: "COMPLIMENTARY SHIPPING & CONCIERGE",
      content: (
        <div className="space-y-2 text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
          <p>
            All ICW garments are delivered in bespoke archival suiting boxes with garment bags and velvet hangers.
          </p>
          <p>
            Complimentary express domestic shipping across India (3–5 business days). Easy 7-day exchanges.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="border-t border-[#E8E4DC] divide-y divide-[#E8E4DC] font-body mt-8 sm:mt-10">
      {sections.map((sec) => {
        const isOpen = openSection === sec.id;
        return (
          <div key={sec.id} className="py-1">
            <button
              type="button"
              onClick={() => setOpenSection(isOpen ? null : sec.id)}
              className="w-full py-4 flex items-center justify-between text-left text-xs uppercase tracking-[0.18em] font-medium text-[#111113] hover:text-[#C2922E] transition-colors"
            >
              <span>{sec.title}</span>
              <span className="text-[#C2922E]">
                {isOpen ? <Minus size={14} /> : <Plus size={14} />}
              </span>
            </button>
            {isOpen && <div className="pb-4 pt-1">{sec.content}</div>}
          </div>
        );
      })}
    </div>
  );
};

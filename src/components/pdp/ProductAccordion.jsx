import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

export const ProductAccordion = ({ product }) => {
  const [openSection, setOpenSection] = useState(null);

  const sections = [
    ...(product.story || product.stylingNotes ? [{
      id: "story",
      title: "WHY THIS PIECE · THE OCCASION",
      content: (
        <div className="space-y-3 text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed font-body">
          {product.story && (
            <p className="text-[#33333A] leading-relaxed">
              {product.story}
            </p>
          )}
          {product.stylingNotes && (
            <div className="pt-1.5 border-t border-[#E8E4DC]/70">
              <span className="text-[9.5px] uppercase tracking-[0.22em] text-[#C2922E] font-medium block mb-1">
                Stylist Consultation Note
              </span>
              <p className="italic text-[#555562]">
                &ldquo;{product.stylingNotes}&rdquo;
              </p>
            </div>
          )}
        </div>
      )
    }] : []),
    {
      id: "details",
      title: "TAILORING & DESIGN DETAILS",
      content: (
        <div className="space-y-2 text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed font-body">
          <p>{product.description || "Structured silhouette designed for modern executive authority."}</p>
          <ul className="list-disc pl-4 space-y-1 pt-1">
            <li>Structured shoulders with smooth tonal interior lining.</li>
            <li>Tailored notch lapels and coordinated front buttons.</li>
            <li>Front pockets and clean seam placement for ease of movement.</li>
          </ul>
        </div>
      )
    },
    {
      id: "fabric",
      title: "FABRIC & CARE INSTRUCTIONS",
      content: (
        <div className="space-y-2 text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed font-body">
          <p>
            <strong className="text-[#111113] font-medium">Composition:</strong> {product.fabricCare?.fabric || "Structured corporate suiting blend with smooth interior lining"}.
          </p>
          <p>
            <strong className="text-[#111113] font-medium">Care:</strong> Specialized dry clean only. Steam on low heat. Store on a structured suit hanger.
          </p>
        </div>
      )
    },
    {
      id: "shipping",
      title: "SHIPPING & STYLING CONCIERGE",
      content: (
        <div className="space-y-2 text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed font-body">
          <p>
            Complimentary express domestic shipping across India (3–5 business days).
          </p>
          <p>
            Easy 7-day exchanges. Connect directly with our WhatsApp styling concierge for personalized fit and styling guidance.
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

export default ProductAccordion;

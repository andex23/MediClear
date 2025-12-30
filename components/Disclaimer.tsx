import React from 'react';

export const Disclaimer: React.FC = () => {
  return (
    <div className="border border-[#F2C94C]/30 bg-[#F2C94C]/5 rounded-[6px] p-4 flex gap-4 text-sm mt-8">
      <div className="text-[#F2C94C] flex-shrink-0 mt-0.5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <div>
        <p className="font-editorial font-semibold text-[#F2C94C] mb-1 uppercase tracking-wider text-xs">Medical Disclaimer</p>
        <p className="font-clinical text-[#A5B5AF] text-xs leading-relaxed">
          MediClear uses AI to explain medical data. This system is for informational purposes only and is 
          <span className="text-[#E5ECEA] font-bold"> not a substitute for professional medical advice</span>. 
          Consult a doctor for diagnosis.
        </p>
      </div>
    </div>
  );
};

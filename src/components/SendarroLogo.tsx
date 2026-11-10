import React, { useState } from 'react';

interface SendarroLogoProps {
  className?: string;
  onClick?: () => void;
}

export const SendarroLogo: React.FC<SendarroLogoProps> = ({ 
  className = "h-10 sm:h-12 md:h-14 object-contain", 
  onClick 
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/sendarro-logo.webp');
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (imgSrc === '/sendarro-logo.webp') {
      setImgSrc('/sendarro-logo.png');
    } else if (imgSrc === '/sendarro-logo.png') {
      setImgSrc('/assets/aistudio/83514-removebg-preview_592796fb.png');
    } else if (imgSrc === '/assets/aistudio/83514-removebg-preview_592796fb.png') {
      setImgSrc('/logo.png');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div 
        onClick={onClick}
        className={`flex items-center gap-2 cursor-pointer font-sans font-bold tracking-tight text-[#141414] select-none ${className}`}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#141414] rounded-md flex items-center justify-center text-emerald-400 font-extrabold text-sm md:text-base shadow-sm">
          S
        </div>
        <span className="text-xl md:text-2xl font-black uppercase tracking-wider">Sendarro</span>
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt="Sendarro" 
      loading="eager"
      decoding="async"
      // @ts-ignore
      fetchpriority="high"
      onError={handleError}
      onClick={onClick}
      className={`object-contain transition-all ${className} ${onClick ? 'cursor-pointer' : ''}`} 
    />
  );
};

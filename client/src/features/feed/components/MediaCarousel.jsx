"use client";

import React, { useState } from 'react';

function MediaCarousel({ media }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!media || media.length === 0) return null;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    };

    const currentItem = media[currentIndex];

    return (
        <div className="relative mt-4 w-full rounded-2xl overflow-hidden border border-white/10 group/carousel aspect-[4/3] bg-black/40">
            
            {/* Media Rendering */}
            {currentItem.type === 'image' ? (
                <img 
                    src={currentItem.url} 
                    alt={`Slide ${currentIndex + 1}`} 
                    className="w-full h-full object-contain"
                />
            ) : (
                <video 
                    src={currentItem.url} 
                    controls 
                    className="w-full h-full object-contain"
                />
            )}

            {/* Navigation Arrows (Only show if multiple media items exist) */}
            {media.length > 1 && (
                <>
                    {/* Left Arrow */}
                    <button 
                        onClick={prevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/80 text-white ring-1 ring-white/20 backdrop-blur-md shadow-lg transition-colors hover:bg-sky-500 hover:ring-sky-400"
                    >
                        <i className="fa-solid fa-chevron-left text-lg"></i>
                    </button>

                    {/* Right Arrow */}
                    <button 
                        onClick={nextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/80 text-white ring-1 ring-white/20 backdrop-blur-md shadow-lg transition-colors hover:bg-sky-500 hover:ring-sky-400"
                    >
                        <i className="fa-solid fa-chevron-right text-lg"></i>
                    </button>

                    {/* Dot Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {media.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === currentIndex ? 'w-6 bg-sky-400' : 'w-1.5 bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default MediaCarousel;

'use client'

import React from 'react'

interface WatermarkProps {
    text: string
}

export function Watermark({ text }: WatermarkProps) {
    // We use a combination of transparent text and movement to create a 
    // secure watermark that deters screen recording without blocking the UI.
    return (
        <div
            className="absolute inset-0 z-40 pointer-events-none overflow-hidden select-none"
            aria-hidden="true"
        >
            <div
                className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] flex flex-wrap justify-around items-center opacity-[0.15]"
                style={{
                    transform: 'rotate(-30deg)',
                    animation: 'watermarkSlide 40s linear infinite',
                }}
            >
                {Array.from({ length: 150 }).map((_, i) => (
                    <span
                        key={i}
                        className="text-white font-bold text-xl whitespace-nowrap px-12 py-8"
                    >
                        {text}
                    </span>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes watermarkSlide {
          0% { transform: rotate(-30deg) translate(0%, 0%); }
          100% { transform: rotate(-30deg) translate(-10%, -10%); }
        }
      `}} />
        </div>
    )
}

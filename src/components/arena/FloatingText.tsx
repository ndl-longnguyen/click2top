'use client';

import React from 'react';
import { FloatingTextItem } from '@/lib/types/game';

interface FloatingTextProps {
  items: FloatingTextItem[];
}

export const FloatingText: React.FC<FloatingTextProps> = ({ items }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute font-black tracking-wider text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] animate-float-up whitespace-nowrap select-none"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            color: item.color,
            fontSize: item.isCrit ? '1.75rem' : '1.25rem',
            textShadow: item.isCrit
              ? '0 0 15px rgba(245, 158, 11, 0.8), 0 0 25px rgba(245, 158, 11, 0.5)'
              : '0 0 10px rgba(0,0,0,0.8)',
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};

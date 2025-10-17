import React from 'react';
import type { Pen, Ink } from '../types';
import { InkDropIcon, CleanIcon } from './icons';
import { BrandLogo } from './BrandLogo';

interface PenItemProps {
  pen: Pen;
  ink: Ink | undefined;
  onInk: (pen: Pen) => void;
  onClean: (penId: string) => void;
  customLogo?: string | null;
}

export const PenItem: React.FC<PenItemProps> = ({ pen, ink, onInk, onClean, customLogo }) => {
  const nibDetails = [pen.nib.size, pen.nib.material, pen.nib.features].filter(Boolean).join(' ');

  return (
    <div className="bg-[var(--color-surface-primary)] rounded-xl shadow-sm p-3 mb-2 backdrop-blur-lg texture-paper" style={{boxShadow: `0 1px 2px 0 var(--color-shadow)`}}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <BrandLogo brandName={pen.brand} className="w-9 h-9 flex-shrink-0" customLogo={customLogo} />
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text-primary)] truncate text-sm">{pen.brand}</p>
            <p className="text-[var(--color-text-secondary)] truncate text-sm">{pen.model}</p>
            <p className="text-xs text-[var(--color-text-subtle)] mt-1 truncate">{nibDetails}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          {ink ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full border border-[var(--color-border-primary)]" style={{ backgroundColor: ink.color }}></div>
              <div>
                <p className="font-medium text-xs text-[var(--color-text-secondary)]">{ink.brand}</p>
                <p className="text-xs text-[var(--color-text-subtle)]">{ink.name}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[var(--color-text-subtle)] italic">已清洗</div>
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-2 pt-2 border-t border-[var(--color-border-secondary)]">
        {ink ? (
          <button onClick={() => onClean(pen.id)} className="flex items-center space-x-1 text-xs text-[var(--color-text-danger)] font-medium px-2.5 py-1 rounded-lg hover:bg-[var(--color-button-danger-hover-bg)] transition-colors">
            <CleanIcon className="w-3.5 h-3.5" />
            <span>清洗</span>
          </button>
        ) : (
          <button onClick={() => onInk(pen)} className="flex items-center space-x-1 text-xs text-[var(--color-text-accent)] font-medium px-2.5 py-1 rounded-lg hover:bg-[var(--color-button-subtle-hover-bg)] transition-colors">
            <InkDropIcon className="w-3.5 h-3.5" />
            <span>上墨</span>
          </button>
        )}
      </div>
    </div>
  );
};

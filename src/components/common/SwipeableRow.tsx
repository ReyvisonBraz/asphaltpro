import React, { useState, useRef, TouchEvent } from 'react';

interface SwipeAction {
  label: string;
  icon: string;
  colorClass: string; // e.g. 'bg-red-600 text-white'
  onClick: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  onClick?: () => void;
  className?: string;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  actions,
  onClick,
  className = '',
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const startXRef = useRef<number | null>(null);
  const currentXRef = useRef<number | null>(null);
  const isSwipingRef = useRef(false);

  const actionsWidth = actions.length * 64; // 64px per action button

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startXRef.current === null) return;
    const diff = e.touches[0].clientX - startXRef.current;
    currentXRef.current = e.touches[0].clientX;

    // Only allow left swipe (negative diff) or closing back (positive diff if open)
    if (isOpen) {
      const newTranslate = Math.min(0, Math.max(-actionsWidth - 20, -actionsWidth + diff));
      setTranslateX(newTranslate);
      if (Math.abs(diff) > 10) isSwipingRef.current = true;
    } else {
      if (diff < 0) {
        // Dragging left
        const newTranslate = Math.max(-actionsWidth - 20, diff);
        setTranslateX(newTranslate);
        if (Math.abs(diff) > 10) isSwipingRef.current = true;
      }
    }
  };

  const handleTouchEnd = () => {
    if (startXRef.current === null || currentXRef.current === null) return;
    const diff = currentXRef.current - startXRef.current;

    if (!isOpen) {
      if (diff < -40) {
        // Swiped enough to snap open
        setTranslateX(-actionsWidth);
        setIsOpen(true);
      } else {
        // Snap closed
        setTranslateX(0);
        setIsOpen(false);
      }
    } else {
      if (diff > 40) {
        // Swiped right to close
        setTranslateX(0);
        setIsOpen(false);
      } else {
        // Keep open
        setTranslateX(-actionsWidth);
        setIsOpen(true);
      }
    }

    startXRef.current = null;
    currentXRef.current = null;
  };

  const handleRowClick = () => {
    if (isOpen) {
      // If open, tap closes it
      setTranslateX(0);
      setIsOpen(false);
      return;
    }
    if (!isSwipingRef.current && onClick) {
      onClick();
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background action buttons revealed on swipe */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch z-0"
        style={{ width: `${actionsWidth}px` }}
      >
        {actions.map((action, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTranslateX(0);
              setIsOpen(false);
              action.onClick();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-opacity active:opacity-80 select-none ${action.colorClass}`}
          >
            <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
            <span className="text-[10px] leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Foreground Swipeable Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleRowClick}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwipingRef.current ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative bg-white z-10 w-full"
      >
        {children}
      </div>
    </div>
  );
};

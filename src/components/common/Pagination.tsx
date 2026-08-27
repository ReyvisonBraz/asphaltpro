import React from 'react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`
        flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3
        bg-white border-t border-[#DEE2E6] text-xs text-[#77767B] select-none
        ${className}
      `.trim()}
    >
      <div className="text-center sm:text-left">
        Mostrando <span className="font-bold text-[#010102]">{startItem}</span> a{' '}
        <span className="font-bold text-[#010102]">{endItem}</span> de{' '}
        <span className="font-bold text-[#010102]">{totalItems}</span> registros
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="xs"
          icon="chevron_left"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
        />

        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`
                w-7 h-7 rounded-lg text-xs font-bold transition-colors flex items-center justify-center
                ${
                  currentPage === page
                    ? 'bg-[#835400] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#DEE2E6]'
                }
              `}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-1 text-gray-400 font-bold">
              ...
            </span>
          )
        )}

        <Button
          variant="secondary"
          size="xs"
          icon="chevron_right"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Próxima página"
        />
      </div>
    </div>
  );
};

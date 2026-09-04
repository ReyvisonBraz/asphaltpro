import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: string;
  itemDetails?: {
    label: string;
    value: string;
  }[];
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar Exclusão',
  cancelText = 'Cancelar',
  variant = 'danger',
  icon = 'delete_forever',
  itemDetails,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-red-100 text-red-600'
                : variant === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-[#FFF4E6] text-[#835400]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
          <span className="text-base font-bold text-[#010102]">{title}</span>
        </div>
      }
      subtitle="Esta operação não poderá ser desfeita."
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            icon={icon}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {message}
        </p>

        {itemDetails && itemDetails.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-xs">
            {itemDetails.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span className="text-gray-500 font-medium">{item.label}:</span>
                <span className="font-bold text-[#010102] truncate text-right">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

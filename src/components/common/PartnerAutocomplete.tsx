import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessPartner, PartnerType } from '../../types';

export interface PartnerAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectPartner?: (partner: BusinessPartner) => void;
  partnerType?: PartnerType;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}

export const PartnerAutocomplete: React.FC<PartnerAutocompleteProps> = ({
  label,
  placeholder = 'Digite para pesquisar por nome, CNPJ ou cidade...',
  value,
  onChange,
  onSelectPartner,
  partnerType = 'ambos',
  error,
  helperText,
  required = false,
  leftIcon = 'business',
  className = '',
  disabled = false,
  autoFocus = false,
  id,
}) => {
  const { getUnifiedPartners } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize string for accent/case-insensitive matching
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '');

  // Get available partners list
  const allPartners = useMemo(() => {
    return getUnifiedPartners(partnerType);
  }, [getUnifiedPartners, partnerType]);

  // Filtered partners based on query
  const filteredPartners = useMemo(() => {
    const rawQuery = value.trim();
    if (!rawQuery) {
      // If empty query, show up to 6 most relevant partners
      return allPartners.slice(0, 6);
    }

    const queryNorm = normalize(rawQuery);
    const digitsOnlyQuery = rawQuery.replace(/\D/g, '');

    return allPartners.filter((p) => {
      const nameMatch = normalize(p.nome).includes(queryNorm);
      const fantasiaMatch = p.nomeFantasia && normalize(p.nomeFantasia).includes(queryNorm);
      const contactMatch = p.contato && normalize(p.contato).includes(queryNorm);
      const cityMatch = p.cidadeUf && normalize(p.cidadeUf).includes(queryNorm);
      
      // CNPJ / CPF numeric search
      let docMatch = false;
      if (p.documento) {
        const pDocDigits = p.documento.replace(/\D/g, '');
        if (digitsOnlyQuery.length >= 2 && pDocDigits.includes(digitsOnlyQuery)) {
          docMatch = true;
        } else if (p.documento.toLowerCase().includes(rawQuery.toLowerCase())) {
          docMatch = true;
        }
      }

      return nameMatch || fantasiaMatch || contactMatch || cityMatch || docMatch;
    }).slice(0, 8);
  }, [allPartners, value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (partner: BusinessPartner) => {
    onChange(partner.nome);
    if (onSelectPartner) {
      onSelectPartner(partner);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredPartners.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredPartners.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredPartners.length) {
        e.preventDefault();
        handleSelect(filteredPartners[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Check if currently typed value exactly matches a known partner
  const matchedExactPartner = useMemo(() => {
    if (!value.trim()) return null;
    return allPartners.find(
      (p) => p.nome.trim().toLowerCase() === value.trim().toLowerCase()
    );
  }, [allPartners, value]);

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-xs font-bold text-[#010102] flex items-center gap-1.5">
            <span>{label}</span>
            {required && <span className="text-[#E03131]">*</span>}
          </label>
          {matchedExactPartner && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              {matchedExactPartner.tipo === 'cliente' ? 'Cliente Cadastrado' : 'Fornecedor Cadastrado'}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="material-symbols-outlined absolute left-3 text-[18px] text-gray-400 pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          required={required}
          className={`
            w-full rounded-xl border text-xs text-[#010102] bg-white transition-all
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0
            ${leftIcon ? 'pl-9' : 'pl-3.5'}
            pr-16 py-2.5
            ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-[#DEE2E6] focus:border-[#835400] focus:ring-[#835400]/20'
            }
            ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
          `}
        />

        {/* Right action controls */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              title="Limpar campo"
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            title="Ver sugestões"
            className="p-1 text-gray-400 hover:text-[#835400] rounded-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] block">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {error && <span className="text-[11px] text-[#E03131] font-medium">{error}</span>}
      {helperText && !error && <span className="text-[11px] text-gray-500">{helperText}</span>}

      {/* AutoComplete Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[70] overflow-hidden divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#835400]">search</span>
              {value.trim()
                ? `Resultados para "${value.trim()}" (${filteredPartners.length})`
                : 'Parceiros sugeridos (Usina & Contratos)'}
            </span>
            <span className="text-[10px] text-gray-400">↑↓ navegar • Enter selecionar</span>
          </div>

          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-50">
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner, index) => {
                const isSelected = index === highlightedIndex;
                const isClient = partner.tipo === 'cliente';
                const isSupplier = partner.tipo === 'fornecedor';

                return (
                  <li
                    key={partner.id}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(partner)}
                    className={`p-3 cursor-pointer transition-colors flex items-start gap-3 text-left ${
                      isSelected ? 'bg-amber-50/80 text-black' : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isClient
                          ? 'bg-emerald-100 text-emerald-800'
                          : isSupplier
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isClient ? 'business' : isSupplier ? 'store' : 'handshake'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {partner.nome}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            isClient
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isSupplier
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {partner.tipo}
                        </span>
                      </div>

                      {partner.nomeFantasia && partner.nomeFantasia !== partner.nome && (
                        <p className="text-[11px] text-gray-600 font-medium truncate">
                          Fantasia: {partner.nomeFantasia}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-gray-500">
                        {partner.documento && (
                          <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                            {partner.documento}
                          </span>
                        )}
                        {partner.cidadeUf && (
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {partner.cidadeUf}
                          </span>
                        )}
                        {partner.contato && (
                          <span className="truncate">
                            Contato: <strong className="text-gray-700">{partner.contato}</strong>
                          </span>
                        )}
                      </div>

                      {partner.ramoAtividade && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          {partner.ramoAtividade}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="p-4 text-center">
                <span className="material-symbols-outlined text-2xl text-gray-400 block mb-1">
                  person_search
                </span>
                <p className="text-xs font-semibold text-gray-700">
                  Nenhum cadastro encontrado para "{value}"
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Você pode continuar digitando para cadastrar este novo parceiro livremente.
                </p>
              </li>
            )}
          </ul>

          {value.trim() && (
            <div className="p-2 bg-gray-50 text-center">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-[#835400] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">check</span>
                Manter texto "{value}" como novo registro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

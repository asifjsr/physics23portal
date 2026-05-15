import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  itemType?: string;
  itemName?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
  itemType,
  itemName
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md glass border-white/10 p-8 shadow-2xl overflow-hidden relative"
          >
            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">
                {title}
              </h3>
              
              {itemName && (
                <div className="mb-4 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] block mb-1">Target {itemType || 'Item'}</span>
                  <span className="text-white font-bold tracking-tight">{itemName}</span>
                </div>
              )}
              
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-[11px] tracking-widest transition-all border border-white/5"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-[2] h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isLoading ? 'Processing...' : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

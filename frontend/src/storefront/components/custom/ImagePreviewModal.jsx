import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

const ImagePreviewModal = ({ previewImage, onClose }) => {
  if (!previewImage) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Product image preview"
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden">
          <img
            src={previewImage}
            alt="Product Preview"
            className="object-contain w-full h-auto max-h-[85vh]"
            loading="eager"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-900 rounded-full p-2 transition-colors shadow-lg"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;


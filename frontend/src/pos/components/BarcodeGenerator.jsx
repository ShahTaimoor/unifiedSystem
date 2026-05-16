import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Barcode, Printer, Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Barcode Generator Component
 * Generates barcodes for products using various formats
 */
export const BarcodeGenerator = ({ 
  product, 
  barcodeValue, 
  onClose 
}) => {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [displayValue, setDisplayValue] = useState(barcodeValue || product?.barcode || '');

  const normalizeBarcodeValue = (value) => {
    return String(value || '').trim().replace(/\s+/g, '');
  };

  const getSafeBarcodeValue = (value) => {
    const normalized = normalizeBarcodeValue(value);
    // CODE128 supports full ASCII; remove control chars for printer/scanner stability.
    return normalized.replace(/[\x00-\x1F\x7F]/g, '');
  };

  useEffect(() => {
    generateBarcode();
  }, [displayValue]);

  const generateBarcode = () => {
    if (!canvasRef.current || !displayValue) return;

    try {
      const safeValue = getSafeBarcodeValue(displayValue);
      if (!safeValue) return;

      // Keep scan reliability high by forcing CODE128 and print-safe dimensions.
      JsBarcode(canvasRef.current, safeValue, {
        format: 'CODE128',
        width: 2.5,
        height: 70,
        displayValue: true,
        fontSize: 14,
        margin: 8, // Quiet zone around bars for scanner reliability
        marginLeft: 8,
        marginRight: 8,
        marginTop: 8,
        marginBottom: 8,
        background: '#ffffff',
        lineColor: '#000000',
        textAlign: 'center',
        flat: true
      });
    } catch (error) {
      toast.error('Unable to generate barcode. Please use letters/numbers only.');
    }
  };



  const handleCopy = () => {
    if (!displayValue) return;
    
    navigator.clipboard.writeText(displayValue).then(() => {
      setCopied(true);
      toast.success('Barcode copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy barcode');
    });
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const printWindow = window.open('', '_blank');
    const barcodeDataUrl = canvas.toDataURL('image/png');
    const printWidth = canvas.width;
    const printHeight = canvas.height;
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode Print</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              html,
              body {
                width: 80mm;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: #fff !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100%;
              background: #fff;
            }
            .print-container {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 76mm;
              padding: 2mm;
              margin: 0 auto;
              box-sizing: border-box;
              background: #fff;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
            img.barcode-img {
              width: ${printWidth}px;
              height: ${printHeight}px;
              object-fit: contain;
              image-rendering: pixelated;
              image-rendering: crisp-edges;
              transform: none !important;
              filter: contrast(100%) brightness(100%);
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <img class="barcode-img" src="${barcodeDataUrl}" alt="Barcode" />
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateRandomBarcode = () => {
    // Generate a random value suitable for CODE128.
    const random = Math.floor(100000000 + Math.random() * 900000000);
    setDisplayValue(random.toString());
  };

  if (!product && !barcodeValue) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No product or barcode value provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Barcode Value Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
            Barcode Value
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={displayValue}
              onChange={(e) => {
                const val = e.target.value;
                // Automatically replace risky characters like + and * with - for better scanner compatibility
                const normalizedValue = val.replace(/[+*]/g, '-');
                setDisplayValue(normalizedValue);
              }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/50"
              placeholder="Enter barcode value"
            />
            <button
              onClick={generateRandomBarcode}
              className="px-4 py-2 text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all"
            >
              Generate Random
            </button>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
            Barcode Format
          </label>
          <div className="relative">
            <select
              value="CODE128"
              onChange={() => {}}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/50 cursor-not-allowed"
              disabled
            >
              <option value="CODE128">CODE128 (Scanner-safe default)</option>
            </select>
          </div>
        </div>

        {/* Barcode Display */}
        <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-100 rounded-xl overflow-auto min-h-[200px]">
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: 'none',
              width: 'auto',
              height: 'auto',
              imageRendering: 'pixelated',
              transform: 'none'
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
          <button
            onClick={handleCopy}
            className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied!' : 'Copy Value'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-8 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print Barcode</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;


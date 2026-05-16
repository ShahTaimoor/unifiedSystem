import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BaseModal from './BaseModal';

/**
 * Barcode Scanner Component
 * Supports both camera scanning and manual barcode entry
 */
const BarcodeScanner = ({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "Scan Barcode",
  scanMode = "camera" // "camera", "manual", or "both"
}) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [activeTab, setActiveTab] = useState(scanMode === 'manual' ? 'manual' : 'camera');
  const html5QrCodeRef = useRef(null);
  const scannerId = "barcode-scanner-viewport";

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error("Error stopping scanner:", err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !html5QrCodeRef.current) {
      const timer = setTimeout(() => {
        try {
          html5QrCodeRef.current = new Html5Qrcode(scannerId);
          html5QrCodeRef.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              onScan(decodedText);
              handleClose();
            },
            (errorMessage) => {
              // Ignore constant scanning errors
            }
          ).catch(err => {
            console.error("Scanner start error:", err);
          });
        } catch (error) {
          console.error("Scanner init error:", error);
        }
      }, 300);
      return () => clearTimeout(timer);
    }

    if ((!isOpen || activeTab !== 'camera') && html5QrCodeRef.current) {
      stopScanner();
    }
  }, [isOpen, activeTab]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
      handleClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="lg"
      variant="centered"
    >
      <div className="flex flex-col">
        {scanMode === 'both' && (
          <div className="flex p-1 bg-gray-100/50 m-6 rounded-2xl border border-gray-100">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'camera' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Camera className={`h-4 w-4 ${activeTab === 'camera' ? 'text-primary-600' : 'text-gray-400'}`} />
              <span>Camera</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'manual' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Keyboard className={`h-4 w-4 ${activeTab === 'manual' ? 'text-primary-600' : 'text-gray-400'}`} />
              <span>Manual Entry</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-8 flex-1">
          {activeTab === 'camera' ? (
            <div className="space-y-6">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-black border-8 border-gray-50 shadow-2xl">
                <div id={scannerId} className="w-full h-full" />
                
                {/* Scanner Overlay UI */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary-500/50 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 py-4 rounded-2xl border border-gray-100">
                Align barcode within the target box
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-8 py-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                  Barcode Number / SKU
                </label>
                <div className="relative">
                  <Keyboard className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                  <input
                    autoFocus
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 text-2xl font-mono text-center border-none rounded-3xl focus:ring-2 focus:ring-primary-500 transition-all bg-gray-50 font-bold"
                    placeholder="e.g. 1234567890"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="w-full py-7 text-lg font-bold rounded-3xl shadow-xl shadow-primary-600/20 bg-primary-600 hover:bg-primary-700 active:scale-[0.98] transition-all"
              >
                Add Item to Cart
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="px-8 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all"
          >
            Cancel
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default BarcodeScanner;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { Printer, X, Package, Settings, Search, Download, Check } from 'lucide-react';
import { toast } from 'sonner';
import BaseModal from './BaseModal';

/**
 * Barcode Label Printer Component
 * Prints barcode labels for products with customizable layouts
 */
export const BarcodeLabelPrinter = ({ 
  isOpen,
  onClose,
  products = [], 
  initialLabelSize = 'standard', // 'standard', 'small', 'large'
  /** When true, show per-line label counts (e.g. purchase receipt qty) */
  quantityMode = false,
  modalTitle = 'Print Barcode Labels',
}) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [labelQuantities, setLabelQuantities] = useState({});
  const [labelSize, setLabelSize] = useState(initialLabelSize);
  const labelFormat = 'CODE128';
  const [includePrice, setIncludePrice] = useState(false);
  const [includeName, setIncludeName] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [showBarcodeValue, setShowBarcodeValue] = useState(true);
  const [nameSize, setNameSize] = useState(10);
  const [priceSize, setPriceSize] = useState(9);
  const [barcodeHeight, setBarcodeHeight] = useState(50);
  const [labelPadding, setLabelPadding] = useState(0);
  const [nameMargin, setNameMargin] = useState(2);
  const [priceMargin, setPriceMargin] = useState(2);
  const [labelsPerRow, setLabelsPerRow] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  
  const formatLabelPrice = (value) =>
    Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const getSafeBarcodeValue = (value) => {
    const normalized = String(value || '').trim().replace(/\s+/g, '');
    return normalized.replace(/[\x00-\x1F\x7F]/g, '');
  };

  const getLabelSpec = (size) => {
    if (size === 'thermal_50x30') {
      return {
        page: '50mm 29mm',
        pageWidth: '50mm',
        labelWidthMm: 46,
        labelHeightMm: 24,
        labelWidthPx: 380,
        labelHeightPx: 220,
        barcodeWidth: 1.6,
        barcodeHeight: 52,
        fontSize: 10,
        margin: 5,
      };
    }
    if (size === 'small') {
      return {
        page: '58mm 30mm',
        pageWidth: '58mm',
        labelWidthMm: 54,
        labelHeightMm: 26,
        labelWidthPx: 220,
        labelHeightPx: 110,
        barcodeWidth: 1.7,
        barcodeHeight: 46,
        fontSize: 12,
        margin: 10,
      };
    }
    if (size === 'large') {
      return {
        page: '100mm 50mm',
        pageWidth: '100mm',
        labelWidthMm: 96,
        labelHeightMm: 46,
        labelWidthPx: 360,
        labelHeightPx: 180,
        barcodeWidth: 2.4,
        barcodeHeight: 82,
        fontSize: 14,
        margin: 12,
      };
    }
    return {
      page: '80mm 40mm',
      pageWidth: '80mm',
      labelWidthMm: 76,
      labelHeightMm: 36,
      labelWidthPx: 300,
      labelHeightPx: 140,
      barcodeWidth: 2.0,
      barcodeHeight: 64,
      fontSize: 13,
      margin: 12,
    };
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [products, productSearch]);

  useEffect(() => {
    if (products.length > 0) {
      setSelectedProducts(products.map(p => p._id || p.id));
      const next = {};
      products.forEach((p) => {
        const id = p._id || p.id;
        const q = Math.max(1, Math.min(9999, Math.round(Number(p.labelQuantity) || 1)));
        next[id] = q;
      });
      setLabelQuantities(next);
    }
  }, [products]);

  useEffect(() => {
    const spec = getLabelSpec(labelSize);
    setNameSize(labelSize === 'large' ? 16 : labelSize === 'standard' ? 12 : 10);
    setPriceSize(labelSize === 'large' ? 14 : labelSize === 'standard' ? 11 : 9);
    setBarcodeHeight(spec.barcodeHeight);
  }, [labelSize]);

  const toggleProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const setLabelQty = (productId, raw) => {
    const n = Math.round(Number(raw));
    const v = Number.isFinite(n) ? Math.max(1, Math.min(9999, n)) : 1;
    setLabelQuantities((prev) => ({ ...prev, [productId]: v }));
  };

  const getLabelCount = (product) => {
    const id = product._id || product.id;
    const fromState = labelQuantities[id];
    if (fromState != null) return fromState;
    return Math.max(1, Math.min(9999, Math.round(Number(product.labelQuantity) || 1)));
  };

  const expandSelectedForPrint = (selected) => {
    const out = [];
    for (const product of selected) {
      const n = getLabelCount(product);
      const barcodeValue = product.barcode || product.sku || product._id || product.id;
      if (!barcodeValue) continue;
      for (let i = 0; i < n; i++) out.push(product);
    }
    return out;
  };

  const selectAll = () => {
    setSelectedProducts(filteredProducts.map((p) => p._id || p.id));
  };

  const deselectAll = () => {
    setSelectedProducts([]);
  };

  const generateBarcodeCanvas = (barcodeValue) => {
    const safeValue = getSafeBarcodeValue(barcodeValue);
    if (!safeValue) return null;

    const canvas = document.createElement('canvas');
    const spec = getLabelSpec(labelSize);
    const scale = 2; 
    
    try {
      JsBarcode(canvas, safeValue, {
        format: 'CODE128',
        width: spec.barcodeWidth * scale,
        height: barcodeHeight * scale,
        displayValue: showBarcodeValue,
        fontSize: spec.fontSize * scale,
        margin: spec.margin * scale,
        background: '#ffffff',
        lineColor: '#000000',
        textAlign: 'center',
        textMargin: 4 * scale,
        flat: true
      });
      return canvas;
    } catch (error) {
      console.error('Barcode generation error:', error);
      return null;
    }
  };

  const handlePrint = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const selected = products.filter(p => 
      selectedProducts.includes(p._id || p.id)
    );

    const toPrint = expandSelectedForPrint(selected);
    if (toPrint.length === 0) {
      toast.error('No printable barcodes found');
      return;
    }

    const printWindow = window.open('', '_blank');
    const spec = getLabelSpec(labelSize);
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Labels</title>
          <style>
            @media print {
              @page { size: ${spec.page}; margin: 0; }
              html, body { width: ${spec.pageWidth}; margin: 0; padding: 0; background: #fff !important; print-color-adjust: exact !important; }
            }
            body { font-family: Arial, sans-serif; margin: 0; padding: ${labelPadding}mm; background: #fff; }
            .label { border: none; width: 100%; height: ${spec.labelHeightMm}mm; padding: ${labelPadding}mm; text-align: center; page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; background: #fff; }
            .label-name { font-size: ${nameSize}px; font-weight: bold; margin-bottom: ${nameMargin}px; word-wrap: break-word; max-width: 100%; line-height: 1; }
            .label-price { font-size: ${priceSize}px; color: #000; margin-top: ${priceMargin}px; font-weight: bold; }
            .barcode-image { display: block; width: 100%; height: auto; max-width: ${spec.labelWidthMm - 4}mm; image-rendering: crisp-edges; }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${toPrint.map(product => {
              const barcodeValue = product.barcode || product.sku || product._id || product.id;
              const canvas = generateBarcodeCanvas(barcodeValue);
              if (!canvas) return '';
              return `
                <div class="label">
                  ${includeName ? `<div class="label-name">${product.name || 'Product'}</div>` : ''}
                  ${includeBarcode ? `<img class="barcode-image" src="${canvas.toDataURL('image/png')}" />` : ''}
                  ${includePrice && product.pricing?.retail ? `<div class="label-price">PKR ${formatLabelPrice(product.pricing.retail)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    toast.success(`Printing ${toPrint.length} label(s)`);
  };

  const handleDownloadPdf = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const selected = products.filter(p => selectedProducts.includes(p._id || p.id));
    const toPrint = expandSelectedForPrint(selected);
    if (toPrint.length === 0) {
      toast.error('No printable barcodes found');
      return;
    }

    const spec = getLabelSpec(labelSize);
    const [pageW, pageH] = spec.page.split(' ').map(v => parseFloat(v));
    const marginX = 0.8;
    const marginY = 0.8;
    const gapX = 1;
    const gapY = 1;
    const cols = Math.max(1, Math.min(labelsPerRow, 4));
    const usableW = pageW - (marginX * 2) - (gapX * (cols - 1));
    const labelW = usableW / cols;
    const labelH = Math.max(18, spec.labelHeightMm);

    const pdf = new jsPDF({
      orientation: pageW >= pageH ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pageW, pageH]
    });

    let index = 0;
    let pageStarted = false;
    while (index < toPrint.length) {
      if (pageStarted) pdf.addPage([pageW, pageH], pageW >= pageH ? 'landscape' : 'portrait');
      pageStarted = true;

      let row = 0;
      while (true) {
        const y = marginY + row * (labelH + gapY);
        if (y + labelH > pageH - marginY + 0.01) break;

        for (let col = 0; col < cols && index < toPrint.length; col += 1) {
          const product = toPrint[index];
          const barcodeValue = product.barcode || product.sku || product._id || product.id;
          const canvas = generateBarcodeCanvas(barcodeValue);
          if (!canvas) { index += 1; continue; }

          const x = marginX + col * (labelW + gapX);
          let cursorY = y + 2.2;
          
          if (includeName) {
            const title = (product.name || 'Product').slice(0, 48);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(nameSize * 0.75);
            pdf.text(title, x + (labelW / 2), cursorY, { align: 'center', baseline: 'top' });
            cursorY += (nameSize * 0.35) + 2;
          }

          if (includeBarcode) {
            const barcodeDataUrl = canvas.toDataURL('image/png');
            const barcodeW = Math.max(18, labelW - 4);
            const barcodeH = Math.min(14, barcodeHeight * 0.26);
            pdf.addImage(barcodeDataUrl, 'PNG', x + ((labelW - barcodeW) / 2), cursorY, barcodeW, barcodeH);
            cursorY += barcodeH + 1.5;
          }

          if (includePrice && product.pricing?.retail != null) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(priceSize * 0.75);
            pdf.text(`PKR ${formatLabelPrice(product.pricing.retail)}`, x + (labelW / 2), Math.min(y + labelH - 1, cursorY), { align: 'center' });
          }

          index += 1;
        }
        row += 1;
        if (index >= toPrint.length) break;
      }
    }

    pdf.save(`barcode_labels_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success(`PDF downloaded (${toPrint.length} labels)`);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="5xl"
      variant="centered"
    >
      <div className="flex flex-col h-[85vh]">
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">Label Settings</h3>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Label Size
                    </label>
                    <select
                      value={labelSize}
                      onChange={(e) => setLabelSize(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="thermal_50x30">50mm x 30mm (Thermal)</option>
                      <option value="small">58mm x 30mm</option>
                      <option value="standard">80mm x 40mm</option>
                      <option value="large">100mm x 50mm</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'includeName', label: 'Include Name', state: includeName, setter: setIncludeName },
                      { key: 'includePrice', label: 'Include Price', state: includePrice, setter: setIncludePrice },
                      { key: 'includeBarcode', label: 'Include Barcode', state: includeBarcode, setter: setIncludeBarcode },
                      { key: 'showBarcodeValue', label: 'Show SKU Value', state: showBarcodeValue, setter: setShowBarcodeValue }
                    ].map(item => (
                      <label key={item.key} className="flex items-center group cursor-pointer">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          item.state ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'
                        }`}>
                          <input 
                            type="checkbox"
                            checked={item.state}
                            onChange={(e) => item.setter(e.target.checked)}
                            className="hidden"
                          />
                          {item.state && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className={`ml-3 text-sm font-semibold transition-colors ${item.state ? 'text-gray-900' : 'text-gray-500'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-50 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Name Px</label>
                        <input type="number" value={nameSize} onChange={(e) => setNameSize(Number(e.target.value))} className="w-full px-3 py-1.5 bg-gray-50 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Price Px</label>
                        <input type="number" value={priceSize} onChange={(e) => setPriceSize(Number(e.target.value))} className="w-full px-3 py-1.5 bg-gray-50 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                      <Package className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">Select Products</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={selectAll} className="text-xs font-bold text-primary-600 hover:text-primary-700">Select All</button>
                    <button onClick={deselectAll} className="text-xs font-bold text-gray-400 hover:text-gray-600">Clear</button>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50/50 border-b border-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[50vh]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white border-b border-gray-50 shadow-sm z-10">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">SKU/Barcode</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-32">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredProducts.map((p) => {
                        const pid = p._id || p.id;
                        const isSelected = selectedProducts.includes(pid);
                        return (
                          <tr key={pid} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-primary-50/30' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(pid)} className="mr-4 rounded border-gray-300 text-primary-600" />
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{p.name}</div>
                                  <div className="text-xs text-gray-500">PKR {p.pricing?.retail || 0}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-mono text-xs font-bold text-gray-600">{p.barcode || p.sku || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number"
                                value={getLabelCount(p)}
                                onChange={(e) => setLabelQty(pid, e.target.value)}
                                className="w-full px-3 py-1.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-center"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white px-8 py-5 flex justify-end items-center space-x-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-8 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={handlePrint} className="px-8 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center">
            <Printer className="h-4 w-4 mr-2" /> Direct Print
          </button>
          <button onClick={handleDownloadPdf} className="px-8 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 flex items-center">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default BarcodeLabelPrinter;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp } from 'lucide-react';
import { Button } from '@/pos/components/ui/button';
import { useGetInvestorsQuery } from '../store/services/investorsApi';
import { toast } from 'sonner';

export const ProductInvestorsModal = ({ product, isOpen, onClose, onSave }) => {
  const [linkedInvestors, setLinkedInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [sharePercentage, setSharePercentage] = useState(30);

  const { data: investorsData, isLoading: investorsLoading } = useGetInvestorsQuery(
    {},
    {
      skip: !isOpen,
      refetchOnMountOrArgChange: true,
    }
  );

  const investors = useMemo(() => {
    const list =
      investorsData?.data?.investors ||
      investorsData?.data ||
      investorsData?.investors ||
      investorsData ||
      [];
    return Array.isArray(list) ? list : [];
  }, [investorsData]);

  const investorRowId = (inv) => {
    const raw = inv?._id ?? inv?.id;
    if (raw == null) return '';
    if (typeof raw === 'object') {
      const inner = raw._id ?? raw.id;
      return inner != null ? String(inner).trim() : String(raw).trim();
    }
    return String(raw).trim();
  };

  const idsMatch = (a, b) => {
    const sa = a == null ? '' : String(a).trim().toLowerCase();
    const sb = b == null ? '' : String(b).trim().toLowerCase();
    return sa !== '' && sa === sb;
  };

  const productIdKey = product?._id ?? product?.id;
  const lastSyncedRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !productIdKey || !product) {
      if (!isOpen) lastSyncedRef.current = null;
      return;
    }
    if (lastSyncedRef.current === productIdKey) return;
    lastSyncedRef.current = productIdKey;

    const existing = (product.investors || []).map((inv) => {
      const raw = inv.investor;
      const id = typeof raw === 'object' && raw != null ? raw._id || raw.id : raw;
      const name = typeof raw === 'object' && raw != null ? raw.name || raw.email || 'Unknown' : 'Unknown';
      return {
        investorId: id != null ? String(id).trim() : '',
        investorName: name,
        sharePercentage: inv.sharePercentage ?? inv.share_percentage ?? 30,
      };
    });
    setLinkedInvestors(existing);
  }, [isOpen, productIdKey, product]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedInvestor('');
      setSharePercentage(30);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleAddInvestor = () => {
    if (!selectedInvestor) { toast.error('Please select an investor'); return; }
    const investor = investors.find((inv) => idsMatch(investorRowId(inv), selectedInvestor));
    if (!investor) { toast.error('Could not find selected investor. Try refreshing.'); return; }
    const chosenId = investorRowId(investor);
    if (linkedInvestors.some((inv) => idsMatch(inv.investorId, chosenId))) {
      toast.error('This investor is already linked'); return;
    }
    setLinkedInvestors([...linkedInvestors, {
      investorId: chosenId,
      investorName: investor.name || investor.email || 'Investor',
      sharePercentage,
    }]);
    setSelectedInvestor('');
    setSharePercentage(30);
  };

  const handleRemoveInvestor = (id) => {
    setLinkedInvestors(linkedInvestors.filter(inv => inv.investorId !== id));
  };

  const handleUpdatePercentage = (id, val) => {
    setLinkedInvestors(linkedInvestors.map(inv =>
      inv.investorId === id ? { ...inv, sharePercentage: parseFloat(val) || 0 } : inv
    ));
  };

  const handleSave = () => {
    if (linkedInvestors.length === 0) { toast.error('Please add at least one investor'); return; }
    const productId = product?._id ?? product?.id;
    if (!productId) { toast.error('Missing product id'); return; }
    const investorsToSave = linkedInvestors.map((inv) => {
      const sp = parseFloat(inv.sharePercentage);
      return { investor: inv.investorId, sharePercentage: Number.isFinite(sp) ? sp : 30 };
    });
    onSave(productId, investorsToSave);
  };

  if (!isOpen || !product) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage Investors</h2>
              <p className="text-sm text-gray-500 truncate max-w-xs">{product.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add Investor */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Investor</h3>
            <div className="flex gap-2">
              <select
                value={selectedInvestor}
                onChange={(e) => setSelectedInvestor(e.target.value)}
                disabled={investorsLoading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {investorsLoading ? 'Loading investors...' : 'Select Investor'}
                </option>
                {!investorsLoading && investors.length === 0 ? (
                  <option value="" disabled>No investors — create one first</option>
                ) : (
                  investors.map((inv) => {
                    const id = investorRowId(inv);
                    if (!id) return null;
                    return (
                      <option key={id} value={id}>
                        {inv.name || inv.email || id}
                      </option>
                    );
                  }).filter(Boolean)
                )}
              </select>
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sharePercentage}
                  onChange={(e) => setSharePercentage(parseFloat(e.target.value) || 0)}
                  placeholder="%"
                  className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <Button
                type="button"
                onClick={handleAddInvestor}
                variant="default"
                size="default"
                className="flex-shrink-0"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Set the profit share % for this product's investors. The remainder goes to the company.
            </p>
          </div>

          {/* Linked Investors */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Linked Investors ({linkedInvestors.length})
            </h3>
            {linkedInvestors.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No investors linked yet.</p>
                <p className="text-xs text-gray-400 mt-1">Add an investor using the form above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedInvestors.map((linkedInv) => (
                  <div
                    key={linkedInv.investorId}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-200 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 flex-1">{linkedInv.investorName}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={linkedInv.sharePercentage}
                        onChange={(e) => handleUpdatePercentage(linkedInv.investorId, e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">%</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvestor(linkedInv.investorId)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex flex-row-reverse gap-2">
          <Button type="button" onClick={handleSave} variant="default" size="default">
            Save Investors
          </Button>
          <Button type="button" onClick={onClose} variant="secondary" size="default">
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

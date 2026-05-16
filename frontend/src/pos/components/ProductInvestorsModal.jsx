import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetInvestorsQuery } from '../store/services/investorsApi';
import { toast } from 'sonner';
import BaseModal from './BaseModal';

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
    // API returns { success, data: [...] } — same shape as Investors page (data may be the array directly).
    const list =
      investorsData?.data?.investors ||
      investorsData?.data ||
      investorsData?.investors ||
      investorsData ||
      [];
    return Array.isArray(list) ? list : [];
  }, [investorsData]);

  /** Stable string id for selects and comparisons (avoids ObjectId / type mismatches). */
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
  const lastSyncedProductIdRef = useRef(null);

  // Seed from the server when the modal opens or the product changes — not on every parent
  // `product` reference change (background refetch was resetting linkedInvestors and clearing Adds).
  useEffect(() => {
    if (!isOpen) {
      lastSyncedProductIdRef.current = null;
      return;
    }
    if (!productIdKey || !product) return;
    if (lastSyncedProductIdRef.current === productIdKey) return;
    lastSyncedProductIdRef.current = productIdKey;

    const existingInvestors = (product.investors || []).map((inv) => {
      const raw = inv.investor;
      const id =
        typeof raw === 'object' && raw != null
          ? raw._id || raw.id
          : raw;
      const name =
        typeof raw === 'object' && raw != null
          ? raw.name || raw.email || 'Unknown'
          : 'Unknown';
      return {
        investorId: id != null ? String(id).trim() : '',
        investorName: name,
        sharePercentage: inv.sharePercentage ?? inv.share_percentage ?? 30
      };
    });
    setLinkedInvestors(existingInvestors);
  }, [isOpen, productIdKey, product]);

  const handleAddInvestor = () => {
    if (!selectedInvestor) {
      toast.error('Please select an investor');
      return;
    }

    const investor = investors.find((inv) => idsMatch(investorRowId(inv), selectedInvestor));
    if (!investor) {
      toast.error('Could not match the selected investor. Refresh the page and try again.');
      return;
    }

    const chosenId = investorRowId(investor);
    if (linkedInvestors.some((inv) => idsMatch(inv.investorId, chosenId))) {
      toast.error('This investor is already linked to this product');
      return;
    }

    setLinkedInvestors([
      ...linkedInvestors,
      {
        investorId: chosenId,
        investorName: investor.name || investor.email || 'Investor',
        sharePercentage: sharePercentage
      }
    ]);

    setSelectedInvestor('');
    setSharePercentage(30);
  };

  const handleRemoveInvestor = (investorId) => {
    setLinkedInvestors(linkedInvestors.filter(inv => inv.investorId !== investorId));
  };

  const handleUpdatePercentage = (investorId, newPercentage) => {
    setLinkedInvestors(linkedInvestors.map(inv =>
      inv.investorId === investorId
        ? { ...inv, sharePercentage: parseFloat(newPercentage) || 0 }
        : inv
    ));
  };

  const handleSave = () => {
    if (linkedInvestors.length === 0) {
      toast.error('Please add at least one investor');
      return;
    }

    const investorsToSave = linkedInvestors.map((inv) => {
      const sp = parseFloat(inv.sharePercentage);
      return {
        investor: inv.investorId,
        sharePercentage: Number.isFinite(sp) ? sp : 30
      };
    });

    const productId = product?._id ?? product?.id;
    if (!productId) {
      toast.error('Missing product id');
      return;
    }
    onSave(productId, investorsToSave);
  };

  const footer = (
    <div className="flex flex-col sm:flex-row-reverse gap-3">
      <Button
        type="button"
        onClick={handleSave}
        variant="default"
        className="w-full sm:w-auto"
      >
        Save Investors
      </Button>
      <Button
        type="button"
        onClick={onClose}
        variant="secondary"
        className="w-full sm:w-auto"
      >
        Cancel
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Investors - ${product?.name}`}
      maxWidth="lg"
      footer={footer}
    >
      <div className="p-4 sm:p-6">
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add Investor</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <select
                value={selectedInvestor}
                onChange={(e) => setSelectedInvestor(e.target.value)}
                disabled={investorsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              >
                <option value="">
                  {investorsLoading ? 'Loading investors...' : 'Select Investor'}
                </option>
                {!investorsLoading && investors.length === 0 ? (
                  <option value="" disabled>No investors available. Create one from the Investors page.</option>
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
            </div>
            <div className="sm:col-span-1 flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={sharePercentage}
                onChange={(e) => setSharePercentage(parseFloat(e.target.value) || 0)}
                placeholder="%"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <Button
                type="button"
                onClick={handleAddInvestor}
                variant="default"
                className="px-4"
              >
                Add
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
            Set the profit share percentage for this product. This determines what % of profit goes to investors (split among all linked investors), with the remainder going to the company.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            Linked Investors 
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
              {linkedInvestors.length}
            </span>
          </h4>
          {linkedInvestors.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">
                No investors linked. Add investors above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedInvestors.map((linkedInv) => (
                <div
                  key={linkedInv.investorId}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-primary-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {linkedInv.investorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={linkedInv.sharePercentage}
                        onChange={(e) => handleUpdatePercentage(linkedInv.investorId, e.target.value)}
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                      <span className="text-sm font-medium text-gray-500">%</span>
                    </div>
                    <button
                      onClick={() => handleRemoveInvestor(linkedInv.investorId)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Remove"
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
    </BaseModal>
  );
};


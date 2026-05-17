import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Printer } from 'lucide-react';
import { useGetReturnQuery } from '../store/services/returnsApi';
import { useCompanyInfo } from '../hooks/useCompanyInfo';
import { useIssueRefundMutation } from '../store/services/saleReturnsApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PrintModal, ReturnPrintContent } from './print';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { useSensitiveDataPermissions } from '../hooks/useSensitiveDataPermissions';

const ReturnDetailModal = ({
  return: returnData,
  returnData: returnDataProp,
  isOpen,
  onClose,
  onStatusUpdate,
  onAddNote,
  onAddCommunication,
  onUpdate,
  isLoading,
  autoOpenPrint = false
}) => {
  const actualReturnData = returnDataProp || returnData;
  const { getPartyPermissions } = useSensitiveDataPermissions();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showIssueRefundModal, setShowIssueRefundModal] = useState(false);
  const [issueRefundMethod, setIssueRefundMethod] = useState('cash');

  const [issueRefund, { isLoading: isIssuingRefund }] = useIssueRefundMutation();

  const { data: detailedReturn, isLoading: detailLoading } = useGetReturnQuery(
    actualReturnData?._id,
    { skip: !actualReturnData?._id || !isOpen }
  );

  const { companyInfo } = useCompanyInfo();
  const returnInfo = detailedReturn?.data || detailedReturn || actualReturnData;

  useEffect(() => {
    if (autoOpenPrint && isOpen && returnInfo && !detailLoading) {
      setShowPrintModal(true);
    }
  }, [autoOpenPrint, isOpen, returnInfo, detailLoading]);

  const getStatusColor = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      received: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (v) => {
    const n = Number(v);
    return isNaN(n) ? '0.00' : n.toFixed(2);
  };

  // Format address - can be string, object {street, city, state, country, zipCode, ...}, or array
  const formatAddress = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    if (Array.isArray(addr)) {
      const a = addr.find(x => x.isDefault) || addr[0];
      return formatAddress(a);
    }
    if (typeof addr !== 'object') return String(addr);
    const parts = [
      addr.street || addr.address_line1 || addr.addressLine1 || addr.line1,
      addr.address_line2 || addr.addressLine2 || addr.line2,
      addr.city,
      addr.state || addr.province,
      addr.country,
      addr.zipCode || addr.zip || addr.postalCode || addr.postal_code
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handlePrint = () => setShowPrintModal(true);

  const handleIssueRefund = async () => {
    if (!returnInfo?._id && !returnInfo?.id) return;
    try {
      await issueRefund({ returnId: returnInfo._id || returnInfo.id, method: issueRefundMethod }).unwrap();
      showSuccessToast('Refund issued successfully');
      setShowIssueRefundModal(false);
      onUpdate?.();
      onStatusUpdate?.();
    } catch (err) {
      showErrorToast(err?.data?.message || err?.message || 'Failed to issue refund');
    }
  };

  const canIssueRefund = returnInfo?.origin === 'sales' &&
    (returnInfo?.refundMethod === 'deferred' || returnInfo?.refundMethod === 'none' || returnInfo?.refund_details?.refundMethod === 'deferred') &&
    !returnInfo?.refund_details?.refundPaidAt &&
    returnInfo?.status === 'processed';

  if (!isOpen || !returnInfo) return null;

  const companyName = companyInfo?.companyName || companyInfo?.data?.companyName || 'Your Company';
  const companyAddress = formatAddress(companyInfo?.address || companyInfo?.data?.address);
  const companyPhone = companyInfo?.contactNumber || companyInfo?.phone || companyInfo?.data?.contactNumber || '';
  const companyEmail = companyInfo?.email || companyInfo?.data?.email || '';

  const party = returnInfo.origin === 'purchase' ? returnInfo.supplier : returnInfo.customer;
  const partyName = returnInfo.origin === 'purchase'
    ? (party?.companyName || party?.businessName || party?.name || 'N/A')
    : (party?.businessName || party?.business_name || party?.displayName || party?.name ||
        [party?.firstName, party?.lastName].filter(Boolean).join(' ') || 'N/A');
  const partyEmail = party?.email || '';
  const partyPhone = party?.phone || '';
  const partyAddress = formatAddress(party?.address || party?.businessAddress);
  const { canViewPhone: canViewPartyPhone } = getPartyPermissions(
    returnInfo.origin === 'purchase' ? 'supplier' : 'customer'
  );

  const origRef = returnInfo.origin === 'purchase'
    ? (returnInfo.originalOrder?.invoiceNumber || returnInfo.originalOrder?.poNumber || 'N/A')
    : (returnInfo.originalOrder?.orderNumber || returnInfo.originalOrder?.invoiceNumber || 'N/A');

  const docLabel = returnInfo.origin === 'purchase' ? 'Supplier' : 'Customer';
  const items = returnInfo.items || [];
  const netRefund = Number(returnInfo.netRefundAmount) || 0;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={`${returnInfo.origin === 'purchase' ? 'Purchase' : 'Sale'} Return Details`}
        maxWidth="xl"
        headerExtra={
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrint}
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
          </div>
        }
      >
        <div className="p-1 sm:p-4">
          {/* Return Header */}
          <div className="text-center mb-8 bg-gray-50/50 py-6 rounded-2xl border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
            {companyAddress && <p className="text-sm text-gray-500 mt-1">{companyAddress}</p>}
            {(companyPhone || companyEmail) && (
              <p className="text-sm text-gray-400 mt-1">
                {[companyPhone && `Phone: ${companyPhone}`, companyEmail && `Email: ${companyEmail}`]
                  .filter(Boolean)
                  .join(' | ')}
              </p>
            )}
            <div className="mt-4 inline-block px-4 py-1 bg-white rounded-full border border-gray-200 text-sm font-bold text-gray-600 uppercase tracking-widest">
              {returnInfo.origin === 'purchase' ? 'Purchase' : 'Sale'} Return
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Bill To / Return To */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                {docLabel} Information
              </h3>
              <div className="space-y-1.5">
                <p className="font-bold text-gray-900 text-lg">{partyName}</p>
                {partyEmail && <p className="text-sm text-gray-600">{partyEmail}</p>}
                {canViewPartyPhone && partyPhone && <p className="text-sm text-gray-600 font-mono">{partyPhone}</p>}
                {partyAddress && <p className="text-sm text-gray-500 leading-relaxed mt-2">{partyAddress}</p>}
              </div>
            </div>

            {/* Return Information */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Document Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Return #</span>
                  <span className="text-sm font-bold text-gray-900">{returnInfo.returnNumber || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-sm font-bold text-gray-900">{formatDate(returnInfo.returnDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Ref {returnInfo.origin === 'purchase' ? 'Invoice' : 'Order'}</span>
                  <span className="text-sm font-bold text-primary-600">{origRef}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-sm font-bold text-gray-900 uppercase">{(returnInfo.returnType || '—').replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Status & Refund */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Financial Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(returnInfo.status)}`}>
                    {(returnInfo.status || '—').replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Method</span>
                  <span className="text-sm font-bold text-gray-900 uppercase">{(returnInfo.refundMethod || '—').replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Net Refund</span>
                  <span className="text-lg font-bold text-primary-600">PKR {formatCurrency(netRefund)}</span>
                </div>
                {returnInfo?.refund_details?.refundPaidAt && (
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg border border-green-100">
                    <span className="text-[10px] font-bold text-green-700 uppercase">Paid on</span>
                    <span className="text-[10px] font-bold text-green-700">{formatDate(returnInfo.refund_details.refundPaidAt)}</span>
                  </div>
                )}
                {canIssueRefund && (
                  <Button
                    onClick={() => setShowIssueRefundModal(true)}
                    variant="default"
                    className="w-full mt-2 shadow-lg shadow-primary-500/20"
                  >
                    Issue Refund
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-1.5 h-4 bg-primary-600 rounded-full mr-2" />
              Returned Items
            </h3>
            <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty</th>
                    <th className="px-4 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Original Price</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Condition</th>
                    <th className="px-4 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-gray-900">{item.product?.name || item.productName || 'Unknown'}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{item.product?.sku || 'No SKU'}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-600 font-mono">
                          {formatCurrency(item.originalPrice || item.unitPrice)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-600">{(item.returnReason || '—').replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.condition === 'new' ? 'bg-green-50 text-green-600 border border-green-100' :
                            item.condition === 'damaged' ? 'bg-red-50 text-red-600 border border-red-100' :
                            'bg-gray-50 text-gray-600 border border-gray-100'
                          }`}>
                            {(item.condition || '—').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-bold text-primary-600 font-mono">
                          {formatCurrency(item.refundAmount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-gray-400 italic">
                        No items returned
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-3 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Subtotal Refund</span>
                <span className="font-mono">{formatCurrency(returnInfo.totalRefundAmount || netRefund)}</span>
              </div>
              {Number(returnInfo.totalRestockingFee) > 0 && (
                <div className="flex justify-between items-center text-sm text-red-500 font-medium">
                  <span>Restocking Fee</span>
                  <span className="font-mono">-{formatCurrency(returnInfo.totalRestockingFee)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Net Refund</span>
                <span className="text-2xl font-bold text-primary-600 font-mono">
                  {formatCurrency(netRefund)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        isOpen={showIssueRefundModal}
        onClose={() => setShowIssueRefundModal(false)}
        title="Issue Refund"
        maxWidth="md"
      >
        <div className="p-6">
          <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 mb-6">
            <p className="text-sm text-primary-900 leading-relaxed">
              Recording a refund payment for Return <span className="font-bold">{returnInfo?.returnNumber}</span>.
              The total amount to be paid is <span className="font-bold">PKR {formatCurrency(returnInfo?.netRefundAmount)}</span>.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Payment Method</label>
              <select
                value={issueRefundMethod}
                onChange={(e) => setIssueRefundMethod(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold text-gray-700"
              >
                <option value="cash">Cash Payment</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check Payment</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button variant="outline" className="px-6 rounded-xl" onClick={() => setShowIssueRefundModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleIssueRefund} 
              disabled={isIssuingRefund}
              className="px-8 rounded-xl shadow-lg shadow-primary-500/20"
            >
              {isIssuingRefund ? <LoadingSpinner size="sm" /> : 'Confirm Refund'}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Print Modal */}
      {showPrintModal && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          documentTitle={`Return ${returnInfo?.returnNumber || 'Document'}`}
          zIndex={60}
          hasData={!!returnInfo}
          emptyMessage="No return data to print."
        >
          <ReturnPrintContent returnData={returnInfo} companyInfo={companyInfo} />
        </PrintModal>
      )}
    </>
  );
};

export default ReturnDetailModal;

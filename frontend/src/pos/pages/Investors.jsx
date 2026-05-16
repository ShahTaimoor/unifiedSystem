import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  User,
  X,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Eye,
  Calendar,
  Package,
  ExternalLink,
  Printer,
  Receipt
} from 'lucide-react';
import { Checkbox } from '../components/Checkbox';
import {
  useGetInvestorsQuery,
  useCreateInvestorMutation,
  useUpdateInvestorMutation,
  useDeleteInvestorMutation,
  useRecordPayoutMutation,
  useRecordInvestmentMutation,
  useGetInvestorProductsQuery,
  useGetProfitSharesQuery,
  useGetInvestorPayoutsQuery,
} from '../store/services/investorsApi';
import { toast } from 'sonner';
import { LoadingSpinner, LoadingButton, LoadingCard, LoadingGrid, LoadingPage } from '../components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DeleteConfirmationDialog } from '../components/ConfirmationDialog';
import { useDeleteConfirmation } from '../hooks/useConfirmation';
import { useAuth } from '../contexts/AuthContext';
import { useTab } from '../contexts/TabContext';
import { PageHeader } from '../components/layout/PageHeader';
import BaseModal from '../components/BaseModal';

/** Amount display without a currency prefix (e.g. no leading $). */
function formatAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** ISO or Date string from API → locale string for payout timestamps */
function formatPayoutDate(iso) {
  if (iso == null || iso === '') return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return null;
  }
}

/** Shorter single-line date/time for investor table “Last paid” (avoids wrapping in narrow cells). */
function formatLastPaidOneLine(iso) {
  if (iso == null || iso === '') return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

/** Prefer camelCase from API; fall back to Postgres snake_case. */
function invNum(inv, camel, snake) {
  const v = inv?.[camel] ?? inv?.[snake];
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Opens a print dialog with a simple HTML document (includes “Printed on” date/time). */
function openPrintDocument(title, innerHtml) {
  const printedAt = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  document.body.appendChild(iframe);
  const w = iframe.contentWindow;
  if (!w) {
    document.body.removeChild(iframe);
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: 'Inter', system-ui, sans-serif; padding: 24px; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1 { font-size: 20px; margin: 0 0 6px; }
    .printed { color: #6b7280; font-size: 12px; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #000; padding: 4px 6px; }
    th { background: #f3f4f6; text-align: left; font-weight: 600; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .note { margin-top: 16px; font-size: 11px; color: #6b7280; }
  </style></head><body>
  <h1>${escapeHtml(title)}</h1>
  <p class="printed">Printed on: ${escapeHtml(printedAt)}</p>
  ${innerHtml}
  </body></html>`);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 250);
}

const InvestorFormModal = ({ investor, onSave, onCancel, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: investor || {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      totalInvestment: 0,
      status: 'active',
      notes: ''
    }
  });

  const onSubmit = (data) => {
    onSave(data);
    reset();
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title={investor ? 'Edit Investor' : 'Add New Investor'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-2 w-6 bg-primary-600 rounded-full" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Personal Details</h3>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Investor Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register('name', { required: 'Investor name is required' })}
                  className="pl-11 rounded-xl h-12 font-bold"
                  placeholder="e.g. John Doe"
                />
              </div>
              {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }
                    })}
                    type="email"
                    className="pl-11 rounded-xl h-12 font-bold"
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('phone')}
                    className="pl-11 rounded-xl h-12 font-bold"
                    placeholder="+92 XXX XXXXXXX"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-2 w-6 bg-gray-400 rounded-full" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Location Audit</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Street Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register('address.street')}
                  className="pl-11 rounded-xl h-12 font-bold"
                  placeholder="Building/Street info"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input {...register('address.city')} placeholder="City" className="rounded-xl h-12 font-bold" />
              <Input {...register('address.state')} placeholder="State/Province" className="rounded-xl h-12 font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input {...register('address.zipCode')} placeholder="Zip Code" className="rounded-xl h-12 font-bold" />
              <Input {...register('address.country')} placeholder="Country" className="rounded-xl h-12 font-bold" />
            </div>
          </div>
        </div>

        {/* Financial & Status */}
        <div className="bg-gray-900 rounded-3xl p-6 text-white space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="grid grid-cols-2 gap-6 relative z-10">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Total Capital</label>
              <div className="relative">
                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                <Input
                  {...register('totalInvestment', { valueAsNumber: true, min: { value: 0, message: 'Must be positive' }})}
                  type="number"
                  step="0.01"
                  className="pl-11 rounded-xl h-14 bg-white/10 border-white/20 text-white font-mono font-bold text-lg focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              {errors.totalInvestment && <p className="text-primary-400 text-[10px] font-bold mt-1.5 px-1 uppercase">{errors.totalInvestment.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Engagement Status</label>
              <select 
                {...register('status')} 
                className="w-full h-14 bg-white/10 border border-white/20 rounded-xl px-4 font-bold text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
              >
                <option value="active" className="text-gray-900">Active Entity</option>
                <option value="inactive" className="text-gray-900">Inactive Entity</option>
                <option value="suspended" className="text-gray-900">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Internal Notes</label>
            <Textarea
              {...register('notes')}
              className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px] font-medium"
              placeholder="Record any specific investor mandates or background info..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-14 rounded-2xl border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Discard
          </Button>
          <Button
            type="submit"
            className="flex-[2] h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/20 font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingInline className="text-white" /> : (investor ? 'Commit Changes' : 'Initialize Investor')}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export const Investors = ({ tabId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  /** `{ id, name }` when profit-shares modal is open */
  const [showProfitShares, setShowProfitShares] = useState(null);
  /** `{ id, name }` when payout-history modal is open */
  const [showPayoutHistory, setShowPayoutHistory] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(null);
  const [showProductsModal, setShowProductsModal] = useState(null);
  const { updateTabTitle } = useTab();

  const queryParams = { 
    search: searchTerm || undefined,
    status: statusFilter || undefined
  };

  const { data, isLoading, error } = useGetInvestorsQuery(queryParams, {
    keepPreviousData: true,
  });

  const investors = useMemo(() => {
    const list = data?.data?.investors || data?.data || data?.investors || data || [];
    return Array.isArray(list) ? list : [];
  }, [data]);

  const [createInvestor, { isLoading: creating }] = useCreateInvestorMutation();
  const [updateInvestor, { isLoading: updating }] = useUpdateInvestorMutation();
  const [deleteInvestor, { isLoading: deleting }] = useDeleteInvestorMutation();
  const [recordPayout, { isLoading: recordingPayout }] = useRecordPayoutMutation();
  const [recordInvestment, { isLoading: recordingInvestment }] = useRecordInvestmentMutation();

  const { confirmation, confirmDelete, handleConfirm, handleCancel } = useDeleteConfirmation();

  const handleEdit = (investor) => {
    setSelectedInvestor(investor);
    setIsModalOpen(true);
  };

  const handleDelete = async (investor) => {
    const investorName = investor.name || investor.email || 'Unknown Investor';
    confirmDelete(investorName, 'Investor', async () => {
      try {
        await deleteInvestor(investor._id).unwrap();
        toast.success('Investor deleted successfully');
      } catch (error) {
        toast.error(error?.data?.message || error?.message || 'Failed to delete investor');
      }
    });
  };

  const handleSave = async (data) => {
    try {
      if (selectedInvestor) {
        await updateInvestor({ id: selectedInvestor._id, ...data }).unwrap();
        toast.success('Investor updated successfully');
        setIsModalOpen(false);
        setSelectedInvestor(null);
      } else {
        await createInvestor(data).unwrap();
        toast.success('Investor created successfully');
        setIsModalOpen(false);
        setSelectedInvestor(null);
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Failed to save investor');
    }
  };

  const handleViewProfitShares = (investor) => {
    setShowProfitShares({ id: investor._id, name: investor.name });
  };

  const handleViewPayoutHistory = (investor) => {
    setShowPayoutHistory({ id: investor._id, name: investor.name });
  };

  const handlePrintInvestorsList = () => {
    const rows = investors
      .map(
        (inv) => `<tr>
        <td>${escapeHtml(inv.name)}</td>
        <td>${escapeHtml(inv.email || '—')}</td>
        <td>${escapeHtml(inv.phone || '—')}</td>
        <td class="num">${escapeHtml(formatAmount(invNum(inv, 'totalInvestment', 'total_investment')))}</td>
        <td class="num">${escapeHtml(formatAmount(invNum(inv, 'totalEarnedProfit', 'total_earned_profit')))}</td>
        <td class="num">${escapeHtml(formatAmount(invNum(inv, 'totalPaidOut', 'total_paid_out')))}</td>
        <td>${escapeHtml(formatPayoutDate(inv.lastPayoutAt ?? inv.last_payout_at) || '—')}</td>
        <td class="num">${escapeHtml(formatAmount(invNum(inv, 'currentBalance', 'current_balance')))}</td>
        <td>${escapeHtml(inv.status || '—')}</td>
      </tr>`
      )
      .join('');
    openPrintDocument(
      'Investors report',
      `<table>
        <thead><tr>
          <th>Name</th><th>Email</th><th>Phone</th>
          <th class="num">Total investment</th><th class="num">Earned profit</th>
          <th class="num">Paid out</th><th>Last payout (date)</th><th class="num">Current balance</th><th>Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="note">Amounts are as of the print date above. Profit share line dates appear on the per-investor Profit Shares print.</p>`
    );
  };

  const handleViewProducts = (investor) => {
    setShowProductsModal(investor);
  };

  const handlePayout = (investor) => {
    setShowPayoutModal(investor);
  };

  const handleInvestment = (investor) => {
    setShowInvestmentModal(investor);
  };

  if (isLoading) return <LoadingPage />;
  if (error) return <div className="p-6 text-red-600">Error loading investors: {error.message}</div>;

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        className="mb-6"
        title="Investors"
        subtitle="Manage investors and track profit distributions"
        actions={
          <>
            <Button
              type="button"
              onClick={handlePrintInvestorsList}
              variant="outline"
              size="default"
              className="flex items-center justify-center gap-2"
              disabled={investors.length === 0}
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              onClick={() => {
                setSelectedInvestor(null);
                setIsModalOpen(true);
              }}
              variant="default"
              size="default"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Investor</span>
            </Button>
          </>
        }
      />

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-[2] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search investors by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input flex-1 sm:w-auto min-w-[150px]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Investors Table */}
      {investors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No investors found</p>
        </div>
      ) : (
        <div className="card w-full">
          <div className="card-content p-0 w-full">
            {/* Table Header */}
            <div className="bg-gray-50 px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-200">
              <div className="grid w-full min-w-0 grid-cols-12 gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-2 items-center">
                <div className="col-span-12 lg:col-span-2 min-w-0">
                  <h3 className="text-base font-medium text-gray-700">Investor Name</h3>
                  <p className="text-sm text-gray-500">Contact Information</p>
                </div>
                <div className="col-span-6 sm:col-span-4 lg:col-span-2 lg:text-right">
                  <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap">Total Investment</h3>
                </div>
                <div className="col-span-6 sm:col-span-4 lg:col-span-1 lg:text-right">
                  <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap">Earned Profit</h3>
                </div>
                <div className="col-span-6 sm:col-span-4 lg:col-span-2 lg:text-right">
                  <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap">Paid Out</h3>
                </div>
                <div className="col-span-6 sm:col-span-4 lg:col-span-2 lg:text-right">
                  <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap">Current Balance</h3>
                </div>
                <div className="col-span-6 sm:col-span-4 lg:col-span-1 lg:text-center">
                  <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap">Status</h3>
                </div>
                <div className="col-span-12 lg:col-span-2 lg:text-right">
                  <h3 className="text-sm font-medium text-gray-700 whitespace-nowrap">Actions</h3>
                </div>
              </div>
            </div>

            {/* Investor Rows */}
            <div className="divide-y divide-gray-200">
              {investors.map((investor) => (
                <div key={investor._id} className="px-4 sm:px-8 py-6 hover:bg-gray-50">
                  <div className="grid w-full min-w-0 grid-cols-12 gap-x-4 sm:gap-x-6 gap-y-3 items-center">
                    {/* Investor Name & Contact */}
                    <div className="col-span-12 lg:col-span-2 min-w-0">
                      <div className="flex items-center space-x-4">
                        <User className="h-6 w-6 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {investor.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1 min-w-0">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{investor.email}</span>
                          </div>
                          {investor.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{investor.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Total Investment */}
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2 text-left lg:text-right tabular-nums">
                      <p className="text-sm text-gray-600">
                        {formatAmount(invNum(investor, 'totalInvestment', 'total_investment'))}
                      </p>
                    </div>

                    {/* Earned Profit */}
                    <div className="col-span-6 sm:col-span-4 lg:col-span-1 text-left lg:text-right tabular-nums">
                      <p className="text-sm font-semibold text-green-600">
                        {formatAmount(invNum(investor, 'totalEarnedProfit', 'total_earned_profit'))}
                      </p>
                    </div>

                    {/* Paid Out + last payout date (wider column + nowrap so date stays one line) */}
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2 text-left lg:text-right tabular-nums">
                      <p className="text-sm text-gray-600">
                        {formatAmount(invNum(investor, 'totalPaidOut', 'total_paid_out'))}
                      </p>
                      {formatLastPaidOneLine(investor.lastPayoutAt ?? investor.last_payout_at) ? (
                        <p className="text-xs text-gray-500 mt-1 flex flex-wrap lg:flex-nowrap items-center gap-1 lg:whitespace-nowrap lg:w-full lg:justify-end">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>Last paid: {formatLastPaidOneLine(investor.lastPayoutAt ?? investor.last_payout_at)}</span>
                        </p>
                      ) : null}
                    </div>

                    {/* Current Balance */}
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2 text-left lg:text-right tabular-nums">
                      <p className="text-sm font-bold text-blue-600">
                        {formatAmount(invNum(investor, 'currentBalance', 'current_balance'))}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-6 sm:col-span-4 lg:col-span-1 flex lg:justify-center justify-start">
                      <span className={`badge ${
                        investor.status === 'active' ? 'badge-success' :
                        investor.status === 'inactive' ? 'badge-gray' :
                        'badge-danger'
                      }`}>
                        {investor.status}
                      </span>
                    </div>

                    {/* Actions — use full cell width and align icons to the right (removes dead space on the right) */}
                    <div className="col-span-12 lg:col-span-2 w-full min-w-0">
                      <div className="flex w-full items-center justify-start lg:justify-end gap-2 sm:gap-3 flex-wrap">
                        <button
                          onClick={() => handleViewProducts(investor)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Linked Products"
                        >
                          <Package className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleViewProfitShares(investor)}
                          className="text-green-600 hover:text-green-800"
                          title="View Profit Shares"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleViewPayoutHistory(investor)}
                          className="text-amber-700 hover:text-amber-900"
                          title="Payout history (dates paid out)"
                        >
                          <Receipt className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleInvestment(investor)}
                          className="text-green-600 hover:text-green-800"
                          title="Record Investment (Receive Money)"
                        >
                          <TrendingUp className="h-5 w-5" />
                        </button>
                        {invNum(investor, 'currentBalance', 'current_balance') > 0 && (
                          <button
                            onClick={() => handlePayout(investor)}
                            className="text-primary-600 hover:text-primary-800"
                            title="Record Payout (Pay Money)"
                          >
                            <TrendingUp className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(investor)}
                          className="text-primary-600 hover:text-primary-800"
                          title="Edit Investor"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(investor)}
                          className="text-danger-600 hover:text-danger-800"
                          title="Delete Investor"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <InvestorFormModal
          investor={selectedInvestor}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedInvestor(null);
          }}
          isSubmitting={creating || updating}
        />
      )}

      {/* Profit Shares Modal */}
      {showProfitShares && (
        <ProfitSharesModal
          investorId={showProfitShares.id}
          investorName={showProfitShares.name}
          onClose={() => setShowProfitShares(null)}
        />
      )}

      {showPayoutHistory && (
        <PayoutHistoryModal
          investorId={showPayoutHistory.id}
          investorName={showPayoutHistory.name}
          onClose={() => setShowPayoutHistory(null)}
        />
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <PayoutModal
          investor={showPayoutModal}
          onSave={async (amount, payoutOptions) => {
            try {
              await recordPayout({
                id: showPayoutModal._id,
                amount,
                paymentMethod: payoutOptions?.paymentMethod || 'cash',
                debitAccountCode: payoutOptions?.debitAccountCode || undefined,
              }).unwrap();
              toast.success('Payout recorded successfully (posted to general ledger)');
              setShowPayoutModal(null);
            } catch (error) {
              toast.error(error?.data?.message || error?.message || 'Failed to record payout');
            }
          }}
          onCancel={() => setShowPayoutModal(null)}
          isSubmitting={recordingPayout}
        />
      )}

      {/* Investment Modal */}
      {showInvestmentModal && (
        <InvestmentModal
          investor={showInvestmentModal}
          onSave={async (amount, notes) => {
            try {
              await recordInvestment({ id: showInvestmentModal._id, amount, notes }).unwrap();
              toast.success('Investment recorded successfully');
              setShowInvestmentModal(null);
            } catch (error) {
              toast.error(error?.data?.message || error?.message || 'Failed to record investment');
            }
          }}
          onCancel={() => setShowInvestmentModal(null)}
          isSubmitting={recordingInvestment}
        />
      )}

      {/* Products Modal */}
      {showProductsModal && (
        <InvestorProductsModal
          investor={showProductsModal}
          onClose={() => setShowProductsModal(null)}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        isOpen={confirmation.isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={confirmation.title}
        message={confirmation.message}
      />
    </div>
  );
};

// Investor Products Modal Component
const InvestorProductsModal = ({ investor, onClose }) => {
  const { data, isLoading } = useGetInvestorProductsQuery(investor._id, {
    skip: !investor,
  });

  const products = useMemo(() => {
    const productsList = data?.data?.products || data?.data || data?.products || data || [];
    return Array.isArray(productsList) ? productsList : [];
  }, [data]);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`Product Portfolio — ${investor.name}`}
      maxWidth="4xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Investment Focus</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">Linked Assets</h3>
            </div>
          </div>
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-3 text-right">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">Total Linked</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{products.length}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Portfolio Empty</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto font-medium">
              Link products to this investor from the Products catalog to track split-profit earnings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="group relative bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors duration-500">
                        <Package className="h-6 w-6 text-gray-400 group-hover:text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                            product.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                            product.status === 'inactive' ? 'bg-gray-50 text-gray-700 border-gray-100' :
                            'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {product.status}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-50">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available</p>
                        <p className={`text-sm font-mono font-bold ${
                          (product.inventory?.currentStock || 0) <= (product.inventory?.reorderPoint || 0)
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}>
                          {product.inventory?.currentStock || 0} Units
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Costing</p>
                        <p className="text-sm font-mono font-bold text-gray-900">
                          {formatAmount(product.pricing?.cost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Retail</p>
                        <p className="text-sm font-mono font-bold text-gray-900">
                          {formatAmount(product.pricing?.retail)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Split Yield</p>
                        <p className="text-sm font-mono font-bold text-primary-600 bg-primary-50 px-2 rounded-lg inline-block">
                          {product.sharePercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 text-right space-y-4">
                    <div className="flex flex-col items-end">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Link Date</p>
                      <p className="text-xs font-bold text-gray-900 mt-1">
                        {product.linkedAt ? new Date(product.linkedAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        window.open(`/products`, '_blank');
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest"
                    >
                      Audit Product
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

// Profit Shares Modal Component
const ProfitSharesModal = ({ investorId, investorName, onClose }) => {
  const { data, isLoading, isError, error } = useGetProfitSharesQuery({ id: investorId }, {
    skip: !investorId,
  });

  const profitShares = useMemo(() => {
    const sharesList = data?.data?.profitShares || data?.data || data?.profitShares || data || [];
    return Array.isArray(sharesList) ? sharesList : [];
  }, [data]);

  const profitSharesErrorMessage =
    isError && error?.data != null
      ? String(
          typeof error.data === 'object' && error.data?.message != null
            ? error.data.message
            : error.data
        )
      : isError
        ? 'Could not load profit shares. Try again or check the server.'
        : null;

  const printProfitShares = () => {
    if (profitShares.length === 0) {
      toast.error('Nothing to print');
      return;
    }
    const rows = profitShares
      .map((share) => {
        const shareInvestorId = share.investor_id ?? share.investor?._id ?? share.investor ?? null;
        const isThisInvestor =
          shareInvestorId && shareInvestorId.toString() === investorId.toString();
        const investorShare = isThisInvestor
          ? Number(share.investor_share ?? share.investorShare ?? 0)
          : share.investors?.find((inv) => {
              const invId = inv.investor?._id || inv.investor;
              return invId && invId.toString() === investorId.toString();
            })?.shareAmount || 0;
        const sharePercentage = isThisInvestor
          ? Number(share.investor_share_percentage ?? share.investorSharePercentage ?? 0)
          : share.investors?.find((inv) => {
              const invId = inv.investor?._id || inv.investor;
              return invId && invId.toString() === investorId.toString();
            })?.sharePercentage || 0;
        const lineDate =
          share.order_date ?? share.orderDate ?? share.created_at ?? share.createdAt;
        const dateStr = lineDate
          ? new Date(lineDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
          : '—';
        const saleAmt = share.sale_amount ?? share.saleAmount;
        const totProfit = share.total_profit ?? share.totalProfit;
        const ordNum = share.order_number ?? share.orderNumber ?? share.order?.orderNumber;
        const prodName = share.product_name ?? share.productName ?? share.product?.name;
        return `<tr>
          <td>${escapeHtml(dateStr)}</td>
          <td>${escapeHtml(ordNum || '—')}</td>
          <td>${escapeHtml(prodName || 'N/A')}</td>
          <td class="num">${escapeHtml(formatAmount(saleAmt))}</td>
          <td class="num">${escapeHtml(formatAmount(totProfit))}</td>
          <td class="num">${escapeHtml(String(sharePercentage))}%</td>
          <td class="num">${escapeHtml(formatAmount(investorShare))}</td>
        </tr>`;
      })
      .join('');
    const title = investorName
      ? `Profit shares — ${investorName}`
      : 'Profit shares';
    openPrintDocument(
      title,
      `<p style="margin:0 0 16px;font-size:14px;color:#374151">Each row shows the <strong>sale / order date</strong> when profit was credited (not payout date).</p>
      <table>
        <thead><tr>
          <th>Date (sale)</th><th>Order #</th><th>Product</th>
          <th class="num">Sale amount</th><th class="num">Total profit</th>
          <th class="num">Share %</th><th class="num">Investor share</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`
    );
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`Profit Streams — ${investorName || 'Entity'}`}
      maxWidth="4xl"
    >
      <div className="p-6">
        <div className="flex justify-end mb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-gray-200 font-bold px-5 h-10 hover:bg-gray-50"
            onClick={printProfitShares}
            disabled={isLoading || isError || profitShares.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Export Statement
          </Button>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : isError ? (
          <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-900 font-bold uppercase tracking-widest text-xs">Sync Failure</p>
            <p className="text-red-600 text-sm mt-1">{profitSharesErrorMessage}</p>
          </div>
        ) : profitShares.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Earnings Recorded</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto font-medium">
              Profit distributions are triggered automatically upon successful settlement of linked product orders.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 grid grid-cols-[140px_100px_minmax(0,1fr)_100px_100px_80px_100px] gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Settlement Date</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Ref</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Asset</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Volume</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Profit</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Split</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Credit</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {profitShares.map((share) => {
                const shareInvestorId = share.investor_id ?? share.investor?._id ?? share.investor ?? null;
                const isThisInvestor = shareInvestorId && (shareInvestorId.toString() === investorId.toString());
                const investorShare = isThisInvestor ? Number(share.investor_share ?? share.investorShare ?? 0) : share.investors?.find(inv => (inv.investor?._id || inv.investor)?.toString() === investorId.toString())?.shareAmount || 0;
                const sharePercentage = isThisInvestor ? Number(share.investor_share_percentage ?? share.investorSharePercentage ?? 0) : share.investors?.find(inv => (inv.investor?._id || inv.investor)?.toString() === investorId.toString())?.sharePercentage || 0;
                const lineDate = share.order_date ?? share.orderDate ?? share.created_at ?? share.createdAt;
                
                return (
                  <div key={share.id || share._id} className="px-6 py-4 grid grid-cols-[140px_100px_minmax(0,1fr)_100px_100px_80px_100px] gap-4 items-center hover:bg-gray-50/50 transition-colors group">
                    <div className="text-[11px] font-medium text-gray-500 font-mono">
                      {lineDate ? new Date(lineDate).toLocaleDateString() : '—'}
                      <span className="block text-[9px] text-gray-400 uppercase">{lineDate ? new Date(lineDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                    </div>
                    <div className="text-xs font-bold text-primary-600">#{share.order_number ?? share.orderNumber ?? share.order?.orderNumber}</div>
                    <div className="text-xs font-bold text-gray-900 truncate">{share.product_name ?? share.productName ?? share.product?.name ?? 'N/A'}</div>
                    <div className="text-xs font-mono text-gray-600 text-right">{formatAmount(share.sale_amount ?? share.saleAmount)}</div>
                    <div className="text-xs font-mono text-gray-600 text-right">{formatAmount(share.total_profit ?? share.totalProfit)}</div>
                    <div className="text-[11px] font-bold text-blue-600 text-right bg-blue-50 py-0.5 rounded px-1.5">{sharePercentage}%</div>
                    <div className="text-sm font-mono font-bold text-green-600 text-right">{formatAmount(investorShare)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

function payoutMethodLabel(pm) {
  if (pm === 'bank') return 'Bank';
  return 'Cash';
}

// Payout history — each cash payout with date (from investor_payouts)
const PayoutHistoryModal = ({ investorId, investorName, onClose }) => {
  const { data, isLoading, isError, error } = useGetInvestorPayoutsQuery(investorId, {
    skip: !investorId,
  });

  const payouts = useMemo(() => {
    const raw = data?.data ?? data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const errMsg = isError && error?.data != null ? String(typeof error.data === 'object' && error.data?.message != null ? error.data.message : error.data) : isError ? 'Could not load payout history.' : null;

  const printPayouts = () => {
    if (payouts.length === 0) {
      toast.error('Nothing to print');
      return;
    }
    const rows = payouts.map((p) => {
      const when = formatPayoutDate(p.paidAt ?? p.paid_at);
      const amt = p.amount;
      const method = payoutMethodLabel(p.paymentMethod ?? p.payment_method);
      const dr = p.debitAccountCode ?? p.debit_account_code ?? '—';
      const cr = p.creditAccountCode ?? p.credit_account_code ?? (p.paymentMethod === 'bank' || p.payment_method === 'bank' ? '1001' : '1000');
      return `<tr><td>${escapeHtml(when || '—')}</td><td class="num">${escapeHtml(formatAmount(amt))}</td><td>${escapeHtml(method)}</td><td>${escapeHtml(String(dr))}</td><td>${escapeHtml(String(cr))}</td></tr>`;
    }).join('');
    const title = investorName ? `Payout history — ${investorName}` : 'Payout history';
    openPrintDocument(title, `<p style="margin:0 0 16px;font-size:14px;color:#374151">Each row is one payout posted to the general ledger (Dr equity/liability, Cr cash or bank).</p><table><thead><tr><th>Date paid out</th><th class="num">Amount</th><th>Method</th><th>Debit acct</th><th>Credit acct</th></tr></thead><tbody>${rows}</tbody></table>`);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`Payout Registry — ${investorName || 'Entity'}`}
      maxWidth="lg"
    >
      <div className="p-6">
        <div className="flex justify-end mb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-gray-200 font-bold px-5 h-10 hover:bg-gray-50"
            onClick={printPayouts}
            disabled={isLoading || isError || payouts.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : isError ? (
          <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-900 font-bold uppercase tracking-widest text-xs">Registry Error</p>
            <p className="text-red-600 text-sm mt-1">{errMsg}</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Payout Records</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto font-medium">
              Recorded cash and bank distributions will be archived here for financial auditing.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 grid grid-cols-[140px_100px_100px_minmax(0,1fr)] gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Date</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Debit</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Protocol</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">General Ledger Path</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {payouts.map((p) => (
                <div key={p.id} className="px-6 py-5 grid grid-cols-[140px_100px_100px_minmax(0,1fr)] gap-4 items-center hover:bg-gray-50/50 transition-colors">
                  <div className="text-xs font-bold text-gray-900 font-mono">{formatPayoutDate(p.paidAt ?? p.paid_at) || '—'}</div>
                  <div className="text-sm font-mono font-bold text-red-600 text-right">{formatAmount(p.amount)}</div>
                  <div className="text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${p.paymentMethod === 'bank' || p.payment_method === 'bank' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {payoutMethodLabel(p.paymentMethod ?? p.payment_method)}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 rounded">Dr {p.debitAccountCode ?? p.debit_account_code ?? '—'}</span>
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 rounded">Cr {p.creditAccountCode ?? p.credit_account_code ?? (p.paymentMethod === 'bank' || p.payment_method === 'bank' ? '1001' : '1000')}</span>
                    </div>
                    {p.ledgerTransactionId || p.ledger_transaction_id ? <div className="font-mono text-gray-400 truncate">Ref: {p.ledgerTransactionId ?? p.ledger_transaction_id}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

// Payout Modal Component
const PayoutModal = ({ investor, onSave, onCancel, isSubmitting }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [debitAccountCode, setDebitAccountCode] = useState('');
  const currentBalance = invNum(investor, 'currentBalance', 'current_balance');

  const handleFormSubmit = () => {
    const payoutAmount = parseFloat(amount);
    if (payoutAmount <= 0) {
      toast.error('Payout amount must be greater than 0');
      return;
    }
    if (payoutAmount > currentBalance) {
      toast.error(`Payout amount cannot exceed current balance of ${formatAmount(currentBalance)}`);
      return;
    }
    onSave(payoutAmount, { paymentMethod, debitAccountCode: debitAccountCode.trim() || undefined });
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title="Record Distribution"
      maxWidth="md"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="p-6 space-y-8">
        <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-600/20 transition-all duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400">Target Entity</p>
                <p className="text-xl font-bold text-white">{investor.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Available Liquid</p>
                <p className="text-xl font-mono font-bold text-white">PKR {formatAmount(currentBalance)}</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Withdrawal Protocol</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-bold ${paymentMethod === 'cash' ? 'bg-primary-600/20 border-primary-500 text-white shadow-lg shadow-primary-500/10' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-[10px] uppercase">Physical Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-bold ${paymentMethod === 'bank' ? 'bg-primary-600/20 border-primary-500 text-white shadow-lg shadow-primary-500/10' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <Building className="h-5 w-5" />
                  <span className="text-[10px] uppercase">Bank Transfer</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Disbursement Amount</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">PKR</div>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={currentBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-20 h-16 rounded-2xl bg-white/10 border-white/20 text-white font-mono font-bold text-2xl focus:ring-primary-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-1">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Override Ledger Code (Optional)</label>
            <Input
              type="text"
              value={debitAccountCode}
              onChange={(e) => setDebitAccountCode(e.target.value)}
              placeholder="e.g. 3100 (Retained Earnings)"
              className="rounded-xl h-12 font-mono font-bold bg-gray-50"
            />
          </div>
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-primary-600 shrink-0" />
            <p className="text-[11px] text-primary-800 leading-relaxed font-medium">
              Recorded distributions will automatically debit your selected equity account and credit the designated cash/bank liquidity account in the General Ledger.
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button type="button" onClick={onCancel} variant="outline" className="flex-1 h-14 rounded-2xl border-gray-200 font-bold" disabled={isSubmitting}>Discard</Button>
          <Button type="submit" className="flex-[2] h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/20 font-bold" disabled={isSubmitting || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance}>
            {isSubmitting ? <LoadingInline className="text-white" /> : 'Confirm Disbursement'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

// Investment Modal Component (Receive Money from Investor)
const InvestmentModal = ({ investor, onSave, onCancel, isSubmitting }) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const totalInvestmentVal = invNum(investor, 'totalInvestment', 'total_investment');

  const handleFormSubmit = () => {
    const investmentAmount = parseFloat(amount);
    if (investmentAmount <= 0) {
      toast.error('Investment amount must be greater than 0');
      return;
    }
    onSave(investmentAmount, notes);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title="Capital Injection"
      maxWidth="md"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="p-6 space-y-8">
        <div className="bg-primary-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-400/20 transition-all duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400">Target Entity</p>
                <p className="text-xl font-bold text-white">{investor.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Capitalized</p>
                <p className="text-xl font-mono font-bold text-white">PKR {formatAmount(totalInvestmentVal)}</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Investment Amount</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">PKR</div>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-20 h-16 rounded-2xl bg-white/10 border-white/20 text-white font-mono font-bold text-2xl focus:ring-primary-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mt-3 px-1">This injection will increase the entity's equity stake.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Audit Particulars</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Record the source or purpose of this investment..."
            className="rounded-2xl border-gray-100 bg-gray-50/50 p-4 font-medium"
            maxLength={500}
          />
        </div>

        <div className="flex space-x-3">
          <Button type="button" onClick={onCancel} variant="outline" className="flex-1 h-14 rounded-2xl border-gray-200 font-bold" disabled={isSubmitting}>Discard</Button>
          <Button type="submit" className="flex-[2] h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/20 font-bold" disabled={isSubmitting || parseFloat(amount) <= 0}>
            {isSubmitting ? <LoadingInline className="text-white" /> : 'Confirm Investment'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default Investors;


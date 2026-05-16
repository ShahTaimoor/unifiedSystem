import React, { useMemo, useState, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  Eye,
  X,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import AsyncSelect from 'react-select/async';
import { useGetAccountsQuery } from '../store/services/chartOfAccountsApi';
import { useGetBanksQuery } from '../store/services/banksApi';
import {
  useGetJournalVouchersQuery,
  useCreateJournalVoucherMutation,
  usePostJournalVoucherMutation,
} from '../store/services/journalVouchersApi';
import { useLazySearchCustomersQuery } from '../store/services/customersApi';
import { useLazySearchSuppliersQuery } from '../store/services/suppliersApi';
import { handleApiError } from '../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '../components/LoadingSpinner';
import DateFilter from '../components/DateFilter';
import { getCurrentDatePakistan } from '../utils/dateUtils';
import BaseModal from '../components/BaseModal';

const todayISO = () => getCurrentDatePakistan();

const createEmptyEntry = () => ({
  accountId: '',
  debit: '',
  credit: '',
  particulars: '',
  partyId: '',
  partyName: ''
});

const getAccountDisplayLabel = (account) => {
  if (!account) return '';
  // Hide UUID-based codes for customer/supplier party accounts — show only the name
  const isPartyAccount =
    account.accountCode?.startsWith('CUST-') ||
    account.accountCode?.startsWith('SUPP-') ||
    (Array.isArray(account.tags) && (account.tags.includes('customer') || account.tags.includes('supplier')));
  if (isPartyAccount) return account.accountName || '';
  return `${account.accountCode} — ${account.accountName}`;
};

/* ─── View‑Detail Modal ─────────────────────────────────────────────────── */
const ViewModal = ({ voucher, onClose }) => {
  if (!voucher) return null;
  return (
    <BaseModal
      isOpen={!!voucher}
      onClose={onClose}
      title={voucher.voucherNumber}
      maxWidth="3xl"
      variant="centered"
    >
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-50 p-2 rounded-xl">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Date</p>
              <p className="text-sm font-bold text-gray-900">{new Date(voucher.voucherDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entry Status</p>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
              Posted to Ledger
            </span>
          </div>
        </div>

        {voucher.description && (
          <div className="mb-8 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Primary Description</p>
            <p className="text-sm font-semibold text-gray-700">{voucher.description}</p>
          </div>
        )}

        <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-sm mb-6">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account & Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Narration</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Debit</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(voucher.entries || []).map((e, i) => (
                <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{e.accountCode}</div>
                    {(e.customerName || e.supplierName) && (
                      <div className="text-[10px] font-bold text-primary-600 uppercase tracking-tighter mt-0.5 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        Party: {e.customerName || e.supplierName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-gray-600 italic">
                      {e.particulars || e.description || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-gray-900">
                      {parseFloat(e.debitAmount) > 0 ? parseFloat(e.debitAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-gray-900">
                      {parseFloat(e.creditAmount) > 0 ? parseFloat(e.creditAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50/80 border-t border-gray-100">
              <tr>
                <td colSpan="2" className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Batch Totals</td>
                <td className="px-6 py-4 text-right font-black text-slate-900">{(voucher.totalDebit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-right font-black text-slate-900">{(voucher.totalCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {voucher.notes && (
          <div className="mt-6 flex items-start space-x-3 p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Additional Internal Notes</p>
              <p className="text-xs font-medium text-amber-700 mt-1 leading-relaxed">{voucher.notes}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-10 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

/* ─── Party‑Selector Component ────────────────────────────────────────── */
const PartySelector = ({ type, value, onChange, placeholder }) => {
  const [searchCustomers] = useLazySearchCustomersQuery();
  const [searchSuppliers] = useLazySearchSuppliersQuery();

  const loadOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      if (type === 'customer') {
        const result = await searchCustomers(inputValue).unwrap();
        const list = result?.data || result || [];
        return list.map(c => ({
          value: c.id || c._id,
          label: c.name || c.businessName || 'Unnamed Customer'
        }));
      } else {
        const result = await searchSuppliers(inputValue).unwrap();
        const list = result?.data || result || [];
        return list.map(s => ({
          value: s.id || s._id,
          label: s.name || s.business_name || s.company_name || 'Unnamed Supplier'
        }));
      }
    } catch (err) {
      console.error('Failed to search parties:', err);
      return [];
    }
  };

  return (
    <AsyncSelect
      cacheOptions
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder || `Search ${type}...`}
      isClearable
      menuPortalTarget={document.body}
      className="w-full min-w-[200px]"
      styles={{
        control: (p) => ({ ...p, minHeight: '2.5rem' }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
      }}
    />
  );
};

/* ─── Main Component ────────────────────────────────────────────────────── */
export const JournalVouchers = () => {
  /* ── filter state ── */
  const [filters, setFilters] = useState({
    fromDate: todayISO(),
    toDate: todayISO(),
    search: ''
  });

  /* ── form state ── */
  const [formState, setFormState] = useState({
    voucherDate: todayISO(),
    reference: '',
    description: '',
    notes: '',
    entries: [createEmptyEntry(), createEmptyEntry()]
  });

  /* ── modal ── */
  const [viewVoucher, setViewVoucher] = useState(null);

  /* ── accounts ── */
  const [accountMap, setAccountMap] = useState(new Map());
  // bankMap stores id → bank object for quick label lookup
  const [bankMap, setBankMap] = useState(new Map());

  const extractAccounts = useCallback((response) =>
    response?.data?.accounts || response?.accounts || response?.data || response || [], []);

  const updateAccountMap = useCallback((accounts) => {
    setAccountMap(prev => {
      const next = new Map(prev);
      accounts.forEach(a => {
        if (a._id) next.set(a._id, a);
        if (a.id) next.set(a.id, a);
      });
      return next;
    });
  }, []);

  const {
    data: accountsResponse,
    isLoading: accountsLoading,
    isFetching: accountsFetching
  } = useGetAccountsQuery(
    { includePartyAccounts: true },
    { onError: (error) => handleApiError(error, 'Chart of Accounts') }
  );

  React.useEffect(() => {
    if (accountsResponse) updateAccountMap(extractAccounts(accountsResponse));
  }, [accountsResponse, extractAccounts, updateAccountMap]);

  /* ── banks ── */
  const { data: banksResponse } = useGetBanksQuery({ isActive: 'true' });
  const banks = React.useMemo(() => {
    const list = banksResponse?.data?.banks || banksResponse?.banks || [];
    return list.filter(b => !b.deletedAt && b.isActive !== false);
  }, [banksResponse]);

  React.useEffect(() => {
    const next = new Map();
    banks.forEach(b => next.set(b._id || b.id, b));
    setBankMap(next);
  }, [banks]);

  const bankOptions = React.useMemo(() => ({
    label: 'Bank Accounts',
    options: banks.map(b => ({
      value: `BANK::${b._id || b.id}`,
      label: `${b.bankName || b.bank_name} — ${b.accountName || b.account_name}`
    }))
  }), [banks]);

  const buildGroups = useCallback((accounts) => {
    const groups = accounts.reduce((acc, account) => {
      let groupLabel;
      if (Array.isArray(account.tags) && account.tags.includes('customer')) groupLabel = 'Customer Accounts';
      else if (Array.isArray(account.tags) && account.tags.includes('supplier')) groupLabel = 'Supplier Accounts';
      else {
        const type = account.accountType || 'other';
        groupLabel = `${type.charAt(0).toUpperCase()}${type.slice(1)} Accounts`;
      }
      if (!acc[groupLabel]) acc[groupLabel] = [];
      acc[groupLabel].push(account);
      return acc;
    }, {});
    return Object.entries(groups).map(([label, records]) => ({
      label,
      options: records
        .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
        .map((a) => ({ value: a._id, label: getAccountDisplayLabel(a) }))
    }));
  }, []);

  const groupedAccountOptions = useMemo(() => {
    const groups = buildGroups(Array.from(accountMap.values()));
    if (bankOptions.options.length > 0) return [...groups, bankOptions];
    return groups;
  }, [accountMap, buildGroups, bankOptions]);

  const loadAccountOptions = useCallback(async (inputValue) => {
    const searchQuery = inputValue?.trim() || '';
    const accounts = extractAccounts(accountsResponse);
    const filtered = searchQuery
      ? accounts.filter(acc =>
        acc.accountCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.accountName?.toLowerCase().includes(searchQuery.toLowerCase()))
      : accounts;
    updateAccountMap(filtered);
    const groups = buildGroups(filtered);
    // Also filter banks
    const filteredBanks = searchQuery
      ? banks.filter(b => {
        const name = `${b.bankName || b.bank_name} ${b.accountName || b.account_name}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      })
      : banks;
    const bankGroup = {
      label: 'Bank Accounts',
      options: filteredBanks.map(b => ({
        value: `BANK::${b._id || b.id}`,
        label: `${b.bankName || b.bank_name} — ${b.accountName || b.account_name}`
      }))
    };
    return filteredBanks.length > 0 ? [...groups, bankGroup] : groups;
  }, [extractAccounts, updateAccountMap, buildGroups, accountsResponse, banks]);

  /* ── queries ── */
  const {
    data: vouchersData,
    isLoading: vouchersLoading,
    isFetching: vouchersFetching,
    refetch
  } = useGetJournalVouchersQuery(
    { ...filters, page: 1, limit: 50 },
    { onError: (error) => handleApiError(error, 'Journal Vouchers') }
  );

  /* ── mutations ── */
  const [createJournalVoucher, { isLoading: creating }] = useCreateJournalVoucherMutation();
  const [postJournalVoucher, { isLoading: posting }] = usePostJournalVoucherMutation();

  const recording = creating || posting;

  /* ── form helpers ── */
  const resetForm = () => {
    setFormState({
      voucherDate: todayISO(),
      reference: '',
      description: '',
      notes: '',
      entries: [createEmptyEntry(), createEmptyEntry()]
    });
  };

  /* resolve the correct { value, label } for an entry in the AsyncSelect */
  const getSelectedOption = (entry) => {
    if (!entry.accountId) return null;
    if (entry.accountId.startsWith('BANK::')) {
      const bankId = entry.accountId.replace('BANK::', '');
      const bank = bankMap.get(bankId);
      if (!bank) return null;
      return {
        value: entry.accountId,
        label: `${bank.bankName || bank.bank_name} — ${bank.accountName || bank.account_name}`
      };
    }
    if (!accountMap.has(entry.accountId)) return null;
    return { value: entry.accountId, label: getAccountDisplayLabel(accountMap.get(entry.accountId)) };
  };

  /* ── totals ── */
  const totals = useMemo(() => {
    const debitTotal = formState.entries.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0);
    const creditTotal = formState.entries.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0);
    const difference = Math.round((debitTotal - creditTotal) * 100) / 100;
    return {
      debitTotal: Math.round(debitTotal * 100) / 100,
      creditTotal: Math.round(creditTotal * 100) / 100,
      difference
    };
  }, [formState.entries]);

  /* ── entry change ── */
  const handleEntryChange = (index, field, value) => {
    setFormState(prev => {
      const nextEntries = prev.entries.map((entry, idx) => {
        if (idx !== index) return entry;
        const updated = { ...entry, [field]: value };
        if (field === 'debit' && value) updated.credit = '';
        if (field === 'credit' && value) updated.debit = '';

        // If account changes, clear or auto-set party
        if (field === 'accountId') {
          const account = value ? accountMap.get(value) : null;
          if (account) {
            const code = account.accountCode || '';
            if (code.startsWith('CUST-')) {
              updated.partyId = code.replace('CUST-', '');
              updated.partyName = account.accountName;
            } else if (code.startsWith('SUPP-')) {
              updated.partyId = code.replace('SUPP-', '');
              updated.partyName = account.accountName;
            } else {
              updated.partyId = '';
              updated.partyName = '';
            }
          } else {
            updated.partyId = '';
            updated.partyName = '';
          }
        }

        return updated;
      });
      return { ...prev, entries: nextEntries };
    });
  };

  const handleAddEntry = () =>
    setFormState(prev => ({ ...prev, entries: [...prev.entries, createEmptyEntry()] }));

  const handleRemoveEntry = (index) => {
    setFormState(prev => {
      if (prev.entries.length <= 2) {
        toast.error('At least two entries are required.');
        return prev;
      }
      return { ...prev, entries: prev.entries.filter((_, idx) => idx !== index) };
    });
  };

  const handlePartySelection = (index, partyId, partyName, type) => {
    setFormState(prev => {
      const nextEntries = [...prev.entries];
      const entry = { ...nextEntries[index], partyId, partyName };

      // Auto-select account if not set
      if (partyId && !entry.accountId) {
        const defaultCode = (type === 'customer') ? '1100' : '2000';
        // Find matching account ID from map
        const defaultAccount = Array.from(accountMap.values()).find(a => a.accountCode === defaultCode);
        if (defaultAccount) {
          entry.accountId = defaultAccount.id || defaultAccount._id;
        }
      }

      nextEntries[index] = entry;
      return { ...prev, entries: nextEntries };
    });
  };

  /* ── submit: create then immediately post ── */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (totals.debitTotal <= 0) {
      toast.error('Total debit must be greater than zero.');
      return;
    }
    if (Math.abs(totals.difference) > 0.01) {
      toast.error('Total debit and credit must be equal.');
      return;
    }

    const payload = {
      voucherDate: formState.voucherDate,
      reference: formState.reference?.trim() || undefined,
      description: formState.description?.trim() || undefined,
      notes: formState.notes?.trim() || undefined,
      entries: formState.entries.map(entry => {
        // Bank entries use a synthetic BANK::{id} value — resolve to account 1001
        if (entry.accountId?.startsWith('BANK::')) {
          const bankId = entry.accountId.replace('BANK::', '');
          const bank = bankMap.get(bankId);
          const bankLabel = bank
            ? `${bank.bankName || bank.bank_name} — ${bank.accountName || bank.account_name}`
            : 'Bank';
          return {
            accountCode: '1001',
            particulars: entry.particulars?.trim() || bankLabel,
            debitAmount: entry.debit ? parseFloat(entry.debit) : 0,
            creditAmount: entry.credit ? parseFloat(entry.credit) : 0,
            bankId: bankId
          };
        }
        const account = entry.accountId ? accountMap.get(entry.accountId) : null;
        const code = account?.accountCode || entry.accountId;
        return {
          accountCode: code,
          particulars: entry.particulars?.trim() || '',
          debitAmount: entry.debit ? parseFloat(entry.debit) : 0,
          creditAmount: entry.credit ? parseFloat(entry.credit) : 0,
          customerId: (code === '1100' || code.startsWith('CUST-')) ? entry.partyId || undefined : undefined,
          supplierId: (code === '2000' || code.startsWith('SUPP-')) ? entry.partyId || undefined : undefined
        };
      })
    };

    const invalidEntry = payload.entries.find(
      e => !e.accountCode || (e.debitAmount <= 0 && e.creditAmount <= 0)
    );
    if (invalidEntry) {
      toast.error('Each entry must include an account and a debit or credit amount.');
      return;
    }

    try {
      // Step 1 — Create the voucher
      const created = await createJournalVoucher(payload).unwrap();
      const jvId = created?.data?._id || created?.data?.id || created?._id || created?.id;

      // Step 2 — Immediately post to ledger
      if (jvId) {
        await postJournalVoucher(jvId).unwrap();
      }

      toast.success('Journal entry recorded and posted to ledger.');
      resetForm();
    } catch (error) {
      handleApiError(error, 'Record Journal Entry');
    }
  };

  /* ── filter helpers ── */
  const handleFilterChange = (field, value) =>
    setFilters(prev => ({ ...prev, [field]: value }));

  const vouchers = vouchersData?.data?.vouchers || vouchersData?.vouchers || [];
  const pagination = vouchersData?.data?.pagination || vouchersData?.pagination;

  /* ────────────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="space-y-6">
      {/* View modal */}
      <ViewModal voucher={viewVoucher} onClose={() => setViewVoucher(null)} />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Journal Vouchers</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Record manual double-entry adjustments. Entries are posted to the ledger immediately on save.
        </p>
      </div>

      {/* ── ENTRY FORM ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-content space-y-6">

          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Voucher Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  autoComplete="off"
                  value={formState.voucherDate}
                  onChange={(e) => setFormState(prev => ({ ...prev, voucherDate: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reference</label>
              <Input
                type="text"
                autoComplete="off"
                value={formState.reference}
                onChange={(e) => setFormState(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Optional reference number"
                maxLength={100}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
              <Input
                type="text"
                autoComplete="off"
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Purpose of this journal entry"
                maxLength={1000}
              />
            </div>
          </div>

          {accountsFetching && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <LoadingSpinner size="sm" inline /> Fetching accounts…
            </div>
          )}

          {/* Entry table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party (Link)</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Particulars</th>
                  <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                  <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formState.entries.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-2 sm:px-4 py-3">
                      <AsyncSelect
                        cacheOptions
                        defaultOptions={groupedAccountOptions}
                        loadOptions={loadAccountOptions}
                        value={getSelectedOption(entry)}
                        onChange={(option) => handleEntryChange(index, 'accountId', option ? option.value : '')}
                        isLoading={accountsLoading || accountsFetching}
                        placeholder="Select account"
                        menuPortalTarget={document.body}
                        styles={{
                          control: (p) => ({ ...p, minHeight: '2.5rem' }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                        isClearable
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      {(() => {
                        const account = accountMap.get(entry.accountId);
                        const code = account?.accountCode || '';
                        if (code === '1100' || code.startsWith('CUST-')) {
                          return (
                            <PartySelector
                              type="customer"
                              value={entry.partyId ? { value: entry.partyId, label: entry.partyName } : null}
                              onChange={(opt) => handlePartySelection(index, opt?.value || '', opt?.label || '', 'customer')}
                              placeholder="Link Customer..."
                            />
                          );
                        }
                        if (code === '2000' || code.startsWith('SUPP-')) {
                          return (
                            <PartySelector
                              type="supplier"
                              value={entry.partyId ? { value: entry.partyId, label: entry.partyName } : null}
                              onChange={(opt) => handlePartySelection(index, opt?.value || '', opt?.label || '', 'supplier')}
                              placeholder="Link Supplier..."
                            />
                          );
                        }
                        return <span className="text-gray-400 text-xs italic">Not required</span>;
                      })()}
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <Input
                        type="text"
                        autoComplete="off"
                        value={entry.particulars}
                        onChange={(e) => handleEntryChange(index, 'particulars', e.target.value)}
                        className="w-full min-w-[150px]"
                        placeholder="Narration / memo"
                        maxLength={500}
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-3 w-24 sm:w-28">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        autoComplete="off"
                        value={entry.debit}
                        onChange={(e) => handleEntryChange(index, 'debit', e.target.value)}
                        className="text-right w-full min-w-[70px] sm:min-w-[90px]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-3 w-24 sm:w-28">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        autoComplete="off"
                        value={entry.credit}
                        onChange={(e) => handleEntryChange(index, 'credit', e.target.value)}
                        className="text-right w-full min-w-[70px] sm:min-w-[90px]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(index)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-2 sm:px-4 py-3">
                    <Button type="button" onClick={handleAddEntry} variant="secondary" size="default" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Line
                    </Button>
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right font-medium text-gray-700">Totals</td>
                  <td className="px-2 sm:px-4 py-3 text-right font-semibold text-gray-900">{totals.debitTotal.toFixed(2)}</td>
                  <td className="px-2 sm:px-4 py-3 text-right font-semibold text-gray-900">{totals.creditTotal.toFixed(2)}</td>
                  <td className="px-2 sm:px-4 py-3" />
                </tr>
                <tr>
                  <td colSpan="5" className="px-2 sm:px-4 pb-3 text-right">
                    <span className={`text-sm font-medium ${Math.abs(totals.difference) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      Difference: {totals.difference.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes</label>
            <Textarea
              value={formState.notes}
              onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
              autoComplete="off"
              rows={3}
              placeholder="Optional notes or supporting details"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="default"
              size="default"
              className="flex items-center gap-2"
              disabled={recording || accountsLoading}
            >
              {recording ? (
                <><LoadingSpinner size="sm" inline className="mr-2" /> Recording…</>
              ) : (
                <><Save className="h-4 w-4" /> Record Journal Entry</>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* ── VOUCHER LOG ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-content">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <DateFilter
                  startDate={filters.fromDate}
                  endDate={filters.toDate}
                  onDateChange={(start, end) => {
                    handleFilterChange('fromDate', start || '');
                    handleFilterChange('toDate', end || '');
                  }}
                  compact={true}
                  showPresets={true}
                  className="w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
                <Input
                  type="text"
                  autoComplete="off"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Voucher no, description..."
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={() => refetch()}
              variant="secondary"
              size="default"
              className="flex items-center gap-2 self-end"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Credit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lines</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">View</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(vouchersLoading || vouchersFetching) && (
                  <tr>
                    <td colSpan="7" className="px-4 py-6 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                )}
                {!vouchersLoading && !vouchersFetching && vouchers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                      No journal entries found for the selected filters.
                    </td>
                  </tr>
                )}
                {vouchers.map((voucher) => {
                  const id = voucher._id || voucher.id;
                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{voucher.voucherNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{new Date(voucher.voucherDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate">
                        {voucher.description || voucher.reference || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">{(voucher.totalDebit || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{(voucher.totalCredit || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{voucher.entries?.length || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          title="View entry details"
                          onClick={() => setViewVoucher(voucher)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {vouchers.length} of {pagination.totalItems || pagination.total || vouchers.length} entr{vouchers.length === 1 ? 'y' : 'ies'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalVouchers;

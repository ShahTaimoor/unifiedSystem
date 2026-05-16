import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Search,
  Calendar,
  Clock,
  FileText,
  User,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Filter,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGetCCTVOrdersQuery } from '../store/services/salesApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import DateFilter from '../components/DateFilter';
import PageShell from '../components/PageShell';
import { getDatePresets } from '../utils/dateUtils';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';
import BaseModal from '../components/BaseModal';

const CCTVAccess = ({ tabId }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [dateFrom, setDateFrom] = useState(() => getDatePresets().last7Days.startDate);
  const [dateTo, setDateTo] = useState(() => getDatePresets().last7Days.endDate);
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedTime, setCopiedTime] = useState(null);

  const tableScrollRef = useRef(null);
  const [canScrollTableLeft, setCanScrollTableLeft] = useState(false);
  const [canScrollTableRight, setCanScrollTableRight] = useState(false);

  const updateTableScrollState = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanScrollTableLeft(scrollLeft > 4);
    setCanScrollTableRight(max > 4 && scrollLeft < max - 4);
  }, []);

  const scrollTableBy = (delta) => {
    const el = tableScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const { data, isLoading, error, refetch } = useGetCCTVOrdersQuery({
    page,
    limit,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    orderNumber: orderNumber || undefined
  });

  // Normalize orders from API (backend returns snake_case; support both and add fallbacks for missing CCTV fields)
  // Use created_at/updated_at so bill times show real time (not 00:00:00) and duration can be calculated
  const orders = React.useMemo(() => {
    const raw = data?.orders || [];
    return raw.map((o) => {
      const customer = o.customer || {};
      const displayName = customer.displayName ?? customer.business_name ?? customer.businessName ?? customer.name ?? 'Walk-in Customer';
      const saleDate = o.sale_date || o.saleDate || o.created_at || o.createdAt;
      const createdAt = o.created_at ?? o.createdAt;
      const updatedAt = o.updated_at ?? o.updatedAt;
      const total = o.total != null ? o.total : (o.pricing?.total ?? 0);
      // Prefer real CCTV timestamps; else use created_at (has time) and updated_at so duration can show
      const billStart = o.bill_start_time ?? o.billStartTime ?? createdAt ?? saleDate;
      const billEnd = o.bill_end_time ?? o.billEndTime ?? updatedAt ?? createdAt ?? saleDate;
      return {
        _id: o.id || o._id,
        id: o.id || o._id,
        orderNumber: o.order_number ?? o.orderNumber ?? 'N/A',
        billDate: o.bill_date ?? o.billDate ?? saleDate,
        billStartTime: billStart,
        billEndTime: billEnd,
        customer: { ...customer, displayName },
        customerInfo: { name: displayName },
        pricing: { total },
        createdAt
      };
    });
  }, [data?.orders]);

  useEffect(() => {
    if (isLoading) return;
    const id = requestAnimationFrame(() => updateTableScrollState());
    return () => cancelAnimationFrame(id);
  }, [orders, isLoading, updateTableScrollState]);

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => updateTableScrollState());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateTableScrollState]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const seconds = Math.round((new Date(endTime) - new Date(startTime)) / 1000);
    if (seconds <= 0) return '—';
    if (seconds < 60) return `${seconds} sec`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} sec`;
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTime(type);
      showSuccessToast('Time copied to clipboard!');
      setTimeout(() => setCopiedTime(null), 2000);
    }).catch(() => {
      showErrorToast('Failed to copy to clipboard');
    });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const generateCCTVURL = (order) => {
    // This is a placeholder - replace with actual CCTV system URL format
    // Example formats:
    // - For Hikvision: http://cctv-ip/playback?start={startTime}&end={endTime}
    // - For Dahua: http://cctv-ip/cgi-bin/playback?start={startTime}&end={endTime}
    // - For generic: http://cctv-ip/playback?from={startTime}&to={endTime}

    if (!order.billStartTime || !order.billEndTime) return null;

    // Get CCTV base URL from environment or settings
    const cctvBaseURL = process.env.REACT_APP_CCTV_BASE_URL || '';

    if (!cctvBaseURL) {
      // Return time range for manual lookup
      return {
        startTime: formatDateTime(order.billStartTime),
        endTime: formatDateTime(order.billEndTime)
      };
    }

    // Format times for URL (ISO 8601 format)
    const startTime = new Date(order.billStartTime).toISOString();
    const endTime = new Date(order.billEndTime).toISOString();

    // Adjust for buffer (±5 seconds)
    const bufferStart = new Date(new Date(startTime).getTime() - 5000).toISOString();
    const bufferEnd = new Date(new Date(endTime).getTime() + 5000).toISOString();

    return `${cctvBaseURL}?start=${encodeURIComponent(bufferStart)}&end=${encodeURIComponent(bufferEnd)}`;
  };

  const handleOpenCCTV = (order) => {
    const cctvURL = generateCCTVURL(order);

    if (typeof cctvURL === 'string') {
      // Open CCTV system in new window
      window.open(cctvURL, '_blank');
      showSuccessToast('Opening CCTV playback...');
    } else if (cctvURL && cctvURL.startTime) {
      // Show time range for manual lookup
      const timeRange = `${cctvURL.startTime} to ${cctvURL.endTime}`;
      copyToClipboard(timeRange, 'range');
      showSuccessToast('Time range copied! Use this to search in your CCTV system.');
    } else {
      showErrorToast('CCTV system URL not configured. Please configure in settings.');
    }
  };

  return (
    <PageShell className="bg-[#f8fafc]" maxWidthClassName="max-w-full">
      <div className="w-full px-4 sm:px-12 lg:px-16 py-8 sm:py-14 space-y-8 sm:space-y-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          <div className="flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-[20px] sm:rounded-[22px] bg-[#0f172a] text-white shadow-2xl shadow-slate-900/20 shrink-0">
            <Camera className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              CCTV Access
            </h1>
            <p className="mt-2 text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed font-medium px-4 sm:px-0">
              Find invoices and open matching camera playback windows using bill timestamps.
            </p>
          </div>
        </header>

        {/* Filters */}
        <section className="rounded-2xl sm:rounded-[24px] border border-slate-200/60 bg-white shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="h-[4px] bg-[#2563eb]" aria-hidden />
          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-8">
              <div className="min-w-0 lg:flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  ORDER NUMBER
                </label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 transition-colors group-focus-within:text-[#2563eb]" />
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. INV-1001"
                    className="w-full h-12 pl-12 pr-4 text-[15px] border border-slate-200 rounded-xl bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-[#2563eb] transition-all duration-200"
                  />
                </div>
              </div>

              <div className="min-w-0 lg:flex-[1.5]">
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 sm:mb-3">
                  <Calendar className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5 text-slate-300" aria-hidden />
                  DATE RANGE
                </label>
                <DateFilter
                  compact
                  startDate={dateFrom}
                  endDate={dateTo}
                  onDateChange={(start, end) => {
                    setDateFrom(start || '');
                    setDateTo(end || '');
                  }}
                  showPresets={false}
                  showClear={false}
                  showLabel={false}
                  className="min-w-0 [&_button]:h-12 sm:[&_button]:h-14 [&_button]:rounded-xl sm:[&_button]:rounded-2xl [&_button]:border-slate-200 [&_button]:bg-slate-50/30 [&_button]:shadow-none [&_button]:hover:bg-white [&_button]:text-slate-900 [&_button_svg:first-of-type]:h-5 [&_button_svg:first-of-type]:w-5 [&_button_svg:first-of-type]:text-[#2563eb]/60 transition-all duration-200"
                />
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full lg:w-auto min-w-[8.5rem] inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#0f172a] px-6 text-[15px] font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-[#1e293b] active:scale-[0.98] transition-all duration-200"
                >
                  <Search className="h-5 w-5 shrink-0" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 sm:py-20">
            <LoadingSpinner />
            <p className="mt-4 text-sm text-slate-500">Loading orders…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 sm:p-5 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Couldn&apos;t load CCTV orders</p>
              <p className="text-sm text-red-800/90 mt-1">{error.message || 'Unknown error'}</p>
            </div>
          </div>
        ) : !orders.length ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 sm:p-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-5">
              <Camera className="h-8 w-8" aria-hidden />
            </div>
            <p className="text-lg font-semibold text-slate-800">No orders in this range</p>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Try another order number or widen the date range, then search again.
            </p>
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
              <div className="border-b border-slate-100 bg-white px-6 py-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-[17px] font-bold text-[#0f172a]">Matching invoices</h3>
                  <p className="text-sm font-medium text-slate-400 mt-0.5">Bill times are used for CCTV playback windows</p>
                </div>
                <Link
                  to="/pos/inventory-alerts"
                  className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                >
                  Inventory alerts
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => scrollTableBy(-280)}
                  disabled={!canScrollTableLeft}
                  aria-label="Scroll table left"
                  title="Scroll left"
                  className="flex-shrink-0 flex items-center justify-center w-9 sm:w-10 border-r border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <div
                  ref={tableScrollRef}
                  onScroll={updateTableScrollState}
                  className="flex-1 min-w-0 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  <table className="w-full min-w-[760px] md:min-w-[900px] table-auto border-separate border-spacing-0">
                    <thead className="bg-[#f8fafc] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-widest min-w-[160px]">
                          INVOICE #
                        </th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-widest min-w-[140px]">
                          CUSTOMER
                        </th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-widest min-w-[180px]">
                          BILL START TIME
                        </th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-widest min-w-[180px]">
                          BILL END TIME
                        </th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-widest min-w-[120px] whitespace-nowrap">
                          DURATION
                        </th>
                        <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-widest min-w-[100px] whitespace-nowrap">
                          AMOUNT
                        </th>
                        <th className="px-6 py-4 text-center text-[11px] font-bold text-[#64748b] uppercase tracking-widest min-w-[120px] whitespace-nowrap">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-slate-300" />
                              <div className="flex flex-col">
                                <span className="font-bold text-[#0f172a] text-[15px]">{order.orderNumber}</span>
                                <span className="text-[13px] font-medium text-slate-400 mt-0.5">
                                  {order.billDate ? formatDateOnly(order.billDate) : formatDateOnly(order.createdAt)}
                                </span>
                              </div>
                              {/* Show warning icon if billDate differs from CCTV date */}
                              {order.billDate && order.billStartTime &&
                                new Date(order.billDate).toDateString() !== new Date(order.billStartTime).toDateString() && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 ml-1" title="Bill date differs from CCTV recording date" />
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                <User className="h-4 w-4 text-slate-300" />
                              </div>
                              <span className="text-[14px] font-bold text-[#475569]">
                                {order.customer?.displayName ||
                                  order.customerInfo?.name ||
                                  'Walk-in Customer'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-[#10b981] flex-shrink-0" />
                              <span className="text-[#334155] font-bold font-mono text-[14px]">
                                {formatDateTime(order.billStartTime)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(formatDateTime(order.billStartTime), `start-${order._id}`)}
                                className="text-slate-300 hover:text-slate-600 transition-colors"
                                title="Copy start time"
                              >
                                {copiedTime === `start-${order._id}` ? (
                                  <CheckCircle className="h-4 w-4 text-[#10b981]" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-[#ef4444] flex-shrink-0" />
                              <span className="text-[#334155] font-bold font-mono text-[14px]">
                                {formatDateTime(order.billEndTime)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(formatDateTime(order.billEndTime), `end-${order._id}`)}
                                className="text-slate-300 hover:text-slate-600 transition-colors"
                                title="Copy end time"
                              >
                                {copiedTime === `end-${order._id}` ? (
                                  <CheckCircle className="h-4 w-4 text-[#ef4444]" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="text-slate-400 font-bold text-sm">
                              {calculateDuration(order.billStartTime, order.billEndTime)}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="font-bold text-[#0f172a] text-[16px]">
                              {Math.round(order.pricing?.total || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleViewDetails(order)}
                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] active:scale-[0.95] transition-all shadow-md"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => scrollTableBy(280)}
                  disabled={!canScrollTableRight}
                  aria-label="Scroll table right"
                  title="Scroll right"
                  className="flex-shrink-0 flex items-center justify-center w-9 sm:w-10 border-l border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {/* Pagination */}
              {data?.pagination && data.pagination.pages > 1 && (
                <div className="bg-slate-50/90 px-4 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-slate-600">
                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={data.pagination.page === 1}
                      className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                      disabled={data.pagination.page === data.pagination.pages}
                      className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Details Modal */}
        <BaseModal
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedOrder(null);
          }}
          title="Invoice CCTV Analysis"
          maxWidth="2xl"
          variant="centered"
        >
          {selectedOrder && (
            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-primary-50 p-2.5 rounded-2xl">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{selectedOrder.orderNumber}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Audit Details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</label>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedOrder.customer?.displayName || selectedOrder.customerInfo?.name || 'Walk-in Customer'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</label>
                    <p className="text-sm font-black text-slate-900">
                      Rs. {Math.round(selectedOrder.pricing?.total || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bill Date vs CCTV Timestamps Warning */}
              {selectedOrder.billDate && selectedOrder.billStartTime && (
                (() => {
                  const billDateOnly = new Date(selectedOrder.billDate).toDateString();
                  const cctvDateOnly = new Date(selectedOrder.billStartTime).toDateString();
                  const isMismatch = billDateOnly !== cctvDateOnly;
                  return isMismatch ? (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 mb-8 flex items-start space-x-4">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Backdate/Postdate Warning</h4>
                        <p className="text-xs font-semibold text-amber-600 leading-relaxed">
                          The accounting bill date ({formatDateOnly(selectedOrder.billDate)}) differs from the actual CCTV recording time. 
                          Footage is available at the actual recording time shown below.
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()
              )}

              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Camera className="h-4 w-4 text-gray-400" />
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Playback Timestamps</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-primary-200 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Start</p>
                        <p className="text-sm font-mono font-bold text-slate-900">{formatDateTime(selectedOrder.billStartTime)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(formatDateTime(selectedOrder.billStartTime), 'detail-start')}
                      className="p-2 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                    >
                      {copiedTime === 'detail-start' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-primary-200 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session End</p>
                        <p className="text-sm font-mono font-bold text-slate-900">{formatDateTime(selectedOrder.billEndTime)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(formatDateTime(selectedOrder.billEndTime), 'detail-end')}
                      className="p-2 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                    >
                      {copiedTime === 'detail-end' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Duration</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {calculateDuration(selectedOrder.billStartTime, selectedOrder.billEndTime)}
                  </span>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => handleOpenCCTV(selectedOrder)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95"
                >
                  <Eye className="h-5 w-5" />
                  Initiate CCTV Playback
                </button>
              </div>
            </div>
          )}
        </BaseModal>
      </div>
    </PageShell>
  );
};

export default CCTVAccess;

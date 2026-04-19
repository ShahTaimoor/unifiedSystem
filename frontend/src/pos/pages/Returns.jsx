import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posPath } from '../lib/paths';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Printer,
  Trash2,
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Package,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  useGetReturnsQuery,
  useGetReturnStatsQuery,
  useGetReturnTrendsQuery,
  useGetReturnQuery,
  useDeleteReturnMutation,
  useUpdateReturnStatusMutation,
  useAddNoteMutation,
  useAddCommunicationMutation,
} from '../store/services/returnsApi';
import { useCompanyInfo } from '../hooks/useCompanyInfo';
import { handleApiError, showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { LoadingSpinner, LoadingCard, LoadingTable } from '../components/LoadingSpinner';
import { useResponsive, ResponsiveContainer, ResponsiveGrid } from '../components/ResponsiveContainer';
import CreateReturnModal from '../components/CreateReturnModal';
import { PrintModal, ReturnPrintContent } from '../components/print';
import ReturnDetailModal from '../components/ReturnDetailModal';
import ReturnStatsCard from '../components/ReturnStatsCard';
import ReturnFilters from '../components/ReturnFilters';
import PaginationControls from '../components/PaginationControls';
import { getCurrentDatePakistan } from '../utils/dateUtils';

const Returns = () => {
  const navigate = useNavigate();
  const today = getCurrentDatePakistan();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    returnType: '',
    priority: '',
    search: '',
    startDate: today,
    endDate: today
  });
  
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preselectedReturnType, setPreselectedReturnType] = useState('sales');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printReturnData, setPrintReturnData] = useState(null);
  const { isMobile } = useResponsive();
  // Fetch returns
  const { 
    data: returnsData, 
    isLoading: returnsLoading, 
    error: returnsError,
    refetch: refetchReturns
  } = useGetReturnsQuery(filters, {
    onError: (error) => {
      handleApiError(error, 'Fetch Returns');
    },
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Fetch return statistics - show all stats if no date filter, or filtered stats if dates provided
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useGetReturnStatsQuery(
    filters.startDate && filters.endDate
      ? {
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      : {}
  );

  const { companyInfo } = useCompanyInfo();

  // Mutations
  const [updateReturnStatus] = useUpdateReturnStatusMutation();
  const [deleteReturn] = useDeleteReturnMutation();

  const handleUpdateStatus = async (returnId, status, notes) => {
    try {
      await updateReturnStatus({ returnId, status, notes }).unwrap();
      showSuccessToast(`Return status updated to ${status}`);
      setShowDetailModal(false);
      setSelectedReturn(null);
      refetchReturns();
    } catch (error) {
      handleApiError(error, 'Update Return Status');
    }
  };

  const [addNote] = useAddNoteMutation();

  const handleAddNote = async (returnId, note, isInternal) => {
    try {
      await addNote({ returnId, note, isInternal }).unwrap();
      showSuccessToast('Note added successfully');
      refetchReturns();
    } catch (error) {
      handleApiError(error, 'Add Note');
    }
  };

  const handleDeleteReturn = async (returnId) => {
    try {
      await deleteReturn(returnId).unwrap();
      showSuccessToast('Return deleted successfully');
      refetchReturns();
    } catch (error) {
      handleApiError(error, 'Delete Return');
    }
  };


  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const { data: selectedReturnData } = useGetReturnQuery(selectedReturn?._id, {
    skip: !selectedReturn?._id,
  });

  const handleReturnSelect = (returnId) => {
    setSelectedReturn({ _id: returnId }); // Trigger query
    setShowDetailModal(true);
  };

  React.useEffect(() => {
    if (selectedReturnData?.data) {
      setSelectedReturn(selectedReturnData.data);
    }
  }, [selectedReturnData]);

  const handleStatusUpdate = async (status, notes = '') => {
    if (!selectedReturn) return;
    await handleUpdateStatus(selectedReturn._id, status, notes);
  };

  const handleAddNoteWrapper = async (note, isInternal = false) => {
    if (!selectedReturn) return;
    await handleAddNote(selectedReturn._id, note, isInternal);
  };

  const [addCommunication] = useAddCommunicationMutation();

  const handleAddCommunication = async (type, message, recipient = null) => {
    if (!selectedReturn) return;
    try {
      await addCommunication({ returnId: selectedReturn._id, type, message, recipient }).unwrap();
      showSuccessToast('Communication logged successfully');
      refetchReturns();
    } catch (error) {
      handleApiError(error, 'Add Communication');
    }
  };

  const handleDeleteReturnClick = async (returnId) => {
    if (window.confirm('Are you sure you want to delete this return? This action cannot be undone.')) {
      await handleDeleteReturn(returnId);
    }
  };

  const handlePrint = (returnItem) => {
    setPrintReturnData(returnItem);
    setShowPrintModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'received':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (returnsLoading && !returnsData) {
    return <LoadingSpinner message="Loading returns..." />;
  }

  const returns = returnsData?.data?.returns || returnsData?.returns || [];
  const pagination = returnsData?.data?.pagination || returnsData?.pagination || {};
  // Handle stats data - RTK Query wraps in data, but also handle direct response
  const stats = statsData?.data || statsData || {
    totalReturns: 0,
    pendingReturns: 0,
    totalRefundAmount: 0,
    returnRate: 0
  };

  return (
    <ResponsiveContainer className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Return Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage returns, exchanges, and refunds</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => refetchReturns()}
            className="btn btn-outline btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate(posPath('/sale-returns'))}
            className="btn btn-primary btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Sales Return</span>
          </button>
          <button
            onClick={() => {
              setPreselectedReturnType('purchase');
              setShowCreateModal(true);
            }}
            className="btn btn-primary btn-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Purchase Return</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && (
        <ResponsiveGrid cols={{ default: 2, md: 2, lg: 4 }} gap={6}>
          <ReturnStatsCard
            title="Total Returns"
            value={stats.totalReturns || 0}
            icon={<Package className="h-5 w-5" />}
            color="blue"
          />
          <ReturnStatsCard
            title="Pending Returns"
            value={stats.pendingReturns || 0}
            icon={<Clock className="h-5 w-5" />}
            color="yellow"
          />
          <ReturnStatsCard
            title="Total Refunds"
            value={`${(Number(stats.totalRefundAmount) || 0).toFixed(2)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="green"
          />
          <ReturnStatsCard
            title="Return Rate"
            value={`${(Number(stats.returnRate) || 0).toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="purple"
          />
        </ResponsiveGrid>
      )}

      {/* Filters */}
      <ReturnFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        isLoading={returnsLoading}
      />

      {/* Returns Table */}
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Returns</h3>
            <span className="text-xs sm:text-sm text-gray-600">
              {pagination.total || 0} total returns
            </span>
          </div>
        </div>
        
        <div className="card-content p-0">
          {returnsLoading ? (
            <LoadingTable rows={5} cols={6} />
          ) : returns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No returns found</p>
              <p className="text-sm">Try adjusting your filters or create a new return</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Return #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {returns.map((returnItem) => (
                    <tr key={returnItem._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(returnItem.returnDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(returnItem.returnDate).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {returnItem.origin === 'purchase' 
                            ? (returnItem.supplier?.companyName || returnItem.supplier?.name || returnItem.supplier?.businessName || 'N/A')
                            : (returnItem.customer?.name || returnItem.customer?.businessName || 'N/A')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {returnItem.origin === 'purchase'
                            ? (returnItem.supplier?.email || 'N/A')
                            : (returnItem.customer?.email || 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {returnItem.originalOrder?.orderNumber || returnItem.originalOrder?.soNumber || returnItem.originalOrder?.invoiceNumber || returnItem.originalOrder?.poNumber || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {returnItem.items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(Number(returnItem.netRefundAmount) || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {returnItem.returnNumber}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {returnItem.returnType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(returnItem.status)}`}>
                          {getStatusIcon(returnItem.status)}
                          <span className="ml-1 capitalize">{returnItem.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(returnItem.priority)}`}>
                          {returnItem.priority || 'normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleReturnSelect(returnItem._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Return Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(returnItem)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Print Return Document"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReturnClick(returnItem._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Return"
                            disabled={!['pending', 'cancelled'].includes(returnItem.status)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <PaginationControls
          page={pagination.current}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          limit={filters.limit}
          onPageChange={(page) => handleFilterChange({ page })}
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateReturnModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetchReturns();
          }}
          defaultReturnType={preselectedReturnType}
        />
      )}

      {showDetailModal && selectedReturn && (
        <ReturnDetailModal
          return={selectedReturn}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReturn(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          onAddNote={handleAddNote}
          onAddCommunication={handleAddCommunication}
          isLoading={false}
        />
      )}

      {showPrintModal && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setPrintReturnData(null);
          }}
          documentTitle={printReturnData ? `Return ${printReturnData.returnNumber}` : 'Return Document'}
          hasData={!!printReturnData}
          emptyMessage="No return data to print."
        >
          <ReturnPrintContent returnData={printReturnData} companyInfo={companyInfo} />
        </PrintModal>
      )}
    </ResponsiveContainer>
  );
};

export default Returns;

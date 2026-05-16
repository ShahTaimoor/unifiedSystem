import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building,
  User,
  Calendar,
  TrendingUp,
  Filter,
  X,
  Eye,
  ArrowRight,
  Save,
  RotateCcw,
  RefreshCw,
  Receipt,
  Printer,
  ArrowUpDown,
  MoreHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { DuplicateLineItemMergeModal } from '../components/order/DuplicateLineItemMergeModal';
import { ProductImagePreviewModal } from '../components/order/ProductImagePreviewModal';
import { EntityStatusBadge } from '../components/order/EntityStatusBadge';
import { SupplierPartySelect, SupplierSummaryStrip } from '../components/order/SupplierPartySelect';
import {
  LineItemSerial,
  LineItemThumbnail,
  LineItemTotalCell,
  LineItemRemoveButton,
  LineItemBoxInputCell,
} from '../components/order/CartLineItemAtoms';
import { useListControls } from '../hooks/useListControls';
import { formatPartyAddress as formatAddressForDisplay } from '../utils/partyDisplay';
import PaginationControls from '../components/PaginationControls';
import ExcelExportButton from '../components/ExcelExportButton';
import PdfExportButton from '../components/PdfExportButton';
import { suppliersApi, useGetSupplierQuery } from '../store/services/suppliersApi';
import { useAppDispatch } from '../store/hooks';
import { useDebouncedSupplierSearch } from '../hooks/useDebouncedSupplierSearch';
import {
  useGetPurchaseOrdersQuery,
  useLazyGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useLazyGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useUpdatePurchaseOrderItemsConfirmationMutation,
  useDeletePurchaseOrderMutation,
  useConfirmPurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation,
} from '../store/services/purchaseOrdersApi';
import {
  OrderConfirmationStatusBadge,
  OrderItemConfirmationCell,
  OrderConfirmSelectedActions,
  getItemConfirmationStatus,
} from '../components/OrderItemConfirmationCell';
import { useDebouncedPosProductSearch } from '../hooks/useDebouncedPosProductSearch';
import { ProductSearch as SharedSalesProductSearch } from '../components/sales/ProductSearch';
import { DualUnitQuantityInput } from '../components/DualUnitQuantityInput';
import { hasDualUnit, getPiecesPerBox, piecesToBoxesAndPieces, formatStockDualLabel } from '../utils/dualUnitUtils';
import { toast } from 'sonner';
import { LoadingSpinner, LoadingButton, LoadingCard, LoadingGrid, LoadingPage, LoadingInline } from '../components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  OrderCheckoutCard,
  OrderDetailsSection,
  OrderSummaryBar,
  OrderSummaryContent,
  OrderCheckoutActions,
} from '../components/order/OrderCheckoutLayout';
import { ShowDetailsSectionHeader } from '../components/ShowDetailsSectionHeader';
import { useTab } from '../contexts/TabContext';
import { useSensitiveDataPermissions } from '../hooks/useSensitiveDataPermissions';
import { getComponentInfo } from '../utils/componentUtils';
import { formatDate, formatCurrency } from '../utils/formatters';
import { useCompanyInfo } from '../hooks/useCompanyInfo';
import DateFilter from '../components/DateFilter';
import { getCurrentDatePakistan, getDateDaysAgo } from '../utils/dateUtils';
import PrintModal from '../components/PrintModal';
import BarcodeLabelPrinter from '../components/BarcodeLabelPrinter';
import { buildReceiptLabelProductsFromLineItems } from '../utils/receiptLabelUtils';
import { useResponsive } from '../components/ResponsiveContainer';
import { DeleteConfirmationDialog } from '../components/ConfirmationDialog';
import { useDeleteConfirmation } from '../hooks/useConfirmation';
import BaseModal from '../components/BaseModal';

// Helper to get product display name (handles object with name/displayName or UUID string)
const getProductDisplayName = (product) => {
  if (!product) return 'Unknown Product';
  if (typeof product === 'object') {
    const name = product.displayName || product.variantName || product.name || product.company_name || '';
    return name || 'Product';
  }
  // UUID-like string - don't show raw ID
  if (typeof product === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product)) {
    return 'Product';
  }
  return product;
};

function normalizePoLineProductId(item) {
  const raw = item?.productData?._id ?? item?.productData?.id ?? item?.product;
  return raw != null ? String(raw) : '';
}

function mergePurchaseOrderLine(existing, addQty, latestProductData) {
  const product = existing.productData || latestProductData;
  const newQty = (existing.quantity || 0) + addQty;
  const costPerUnit = existing.costPerUnit;
  const totalCost = newQty * costPerUnit;
  const ppb = getPiecesPerBox(product);
  const dual = ppb ? piecesToBoxesAndPieces(newQty, ppb) : {};
  return {
    ...existing,
    quantity: newQty,
    totalCost,
    ...(ppb ? { boxes: dual.boxes, pieces: dual.pieces } : {}),
  };
}

// Address formatting moved to utils/partyDisplay.js (imported at top)

// Helper function to safely render values (supports both camelCase and snake_case)
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Handle JSON string (e.g. supplier stored as stringified object)
    if (value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        return parsed.businessName || parsed.business_name || parsed.companyName || parsed.company_name || parsed.name || parsed.contact_person || parsed.contactPerson?.name || parsed.contactPerson || '';
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === 'object') {
    const cp = value.contactPerson ?? value.contact_person;
    const cpVal = typeof cp === 'object' ? (cp?.name ?? cp?.title) : cp;
    return value.businessName || value.business_name || value.companyName || value.company_name || value.name || value.title || value.fullName || value.contact_person || (typeof cpVal === 'string' ? cpVal : '') || '';
  }
  return String(value);
};

const StatusBadge = ({ status }) => (
  <EntityStatusBadge type="purchase_order" status={status} />
);

const PurchaseOrderCard = ({ po, onEdit, onDelete, onConfirm, onCancel, onClose, onView, onConvert }) => (
  <div className="card hover:shadow-lg transition-shadow">
    <div className="card-content">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-gray-900">{po.poNumber}</h3>
            <StatusBadge status={po.status} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Building className="h-4 w-4 mr-2" />
              {po.supplier?.businessName || po.supplier?.business_name || po.supplier?.companyName || (typeof po.supplier === 'string' ? `Supplier ID: ${po.supplier}` : 'Unknown Supplier')}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              {po.createdBy.firstName} {po.createdBy.lastName}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(po.orderDate).toLocaleDateString()}
            </div>

            {po.expectedDelivery && (
              <div className="flex items-center text-sm text-gray-600">
                <Package className="h-4 w-4 mr-2" />
                Expected: {new Date(po.expectedDelivery).toLocaleDateString()}
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              {Math.round(po.subtotal)} ({po.items.length} items)
            </div>
          </div>

          {/* Progress Bar for Received Orders */}
          {(po.status === 'partially_received' || po.status === 'fully_received') && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{po.progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${po.progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <button
            onClick={() => onView(po)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {(po.status === 'draft' || po.status === 'confirmed' || po.status === 'partially_received' || po.status === 'cancelled') && (
            <button
              onClick={() => onEdit(po)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}

          {po.status === 'draft' && (
            <button
              onClick={() => onConfirm(po)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Confirm"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}

          {(po.status === 'draft' || po.status === 'cancelled' || po.status === 'confirmed' || po.status === 'partially_received' || !po.supplier) && (
            <button
              onClick={() => onDelete(po)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {po.status === 'confirmed' && (
            <button
              onClick={() => onCancel(po)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cancel"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}

          {po.status === 'fully_received' && (
            <button
              onClick={() => onClose(po)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {(po.status === 'confirmed' || po.status === 'partially_received') && po.remainingItemsCount > 0 && (
            <button
              onClick={() => onConvert(po)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Convert to Purchase"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ProductSearch = ({ onAddProduct, onRefetchReady, onFocusReady }) => {
  const { companyInfo: companySettings } = useCompanyInfo();
  const dualUnitShowBoxInputEnabled = companySettings.orderSettings?.dualUnitShowBoxInput !== false;
  const dualUnitShowPiecesInputEnabled = companySettings.orderSettings?.dualUnitShowPiecesInput !== false;
  const allowManualCostPriceEnabled = companySettings.orderSettings?.allowManualCostPrice === true;

  return (
    <SharedSalesProductSearch
      onAddProduct={(item) =>
        onAddProduct({
          ...item,
          costPerUnit: Number(item.costPerUnit ?? item.unitPrice ?? 0),
        })
      }
      selectedCustomer={null}
      showCostPrice={false}
      hasCostPricePermission={false}
      priceType="cost"
      dualUnitShowBoxInput={dualUnitShowBoxInputEnabled}
      dualUnitShowPiecesInput={dualUnitShowPiecesInputEnabled}
      allowOutOfStock
      allowManualCostPrice={allowManualCostPriceEnabled}
      onRefetchReady={onRefetchReady}
      onFocusReady={onFocusReady}
    />
  );
};

export const PurchaseOrders = ({ tabId }) => {
  const {
    canViewSupplierBalance,
    canViewSupplierPhone,
    canViewStock
  } = useSensitiveDataPermissions();
  const { updateTabTitle, getActiveTab, openTab } = useTab();
  const { isMobile } = useResponsive();
  const {
    confirmation: deleteConfirmation,
    confirmDelete,
    handleConfirm: handleDeleteConfirm,
    handleCancel: handleDeleteCancel,
  } = useDeleteConfirmation();
  const { companyInfo: companySettings } = useCompanyInfo();
  const resolvedCompanyName = companySettings.companyName || 'Company Name';
  const itemWiseConfirmationEnabled = companySettings.orderSettings?.purchaseOrderItemWiseConfirmation !== false;
  const dualUnitShowBoxInputEnabled = companySettings.orderSettings?.dualUnitShowBoxInput !== false;
  const dualUnitShowPiecesInputEnabled = companySettings.orderSettings?.dualUnitShowPiecesInput !== false;
  const resolvedCompanyAddress = companySettings.address || companySettings.billingAddress || '';
  const resolvedCompanyPhone = companySettings.contactNumber || '';
  const taxSystemEnabled = companySettings.taxEnabled === true;
  const effectiveGlobalTaxPct = Math.min(100, Math.max(0, Number(companySettings.defaultTaxRate ?? 0)));

  // Calculate default date range (14 days ago to today)
  const today = getCurrentDatePakistan();
  const fromDateDefault = getDateDaysAgo(14);

  // State for filters and pagination
  // State for filters / pagination / sort lives in `useListControls`.
  const {
    filters,
    setFilters,
    pagination,
    setPagination,
    sortConfig,
    setFilter: handleFilterChange,
    toggleSort: handleSort,
  } = useListControls({
    initialFilters: {
      fromDate: fromDateDefault, // 14 days ago
      toDate: today, // Today
      poNumber: '',
      status: '',
    },
    initialSort: { key: 'createdAt', direction: 'desc' },
  });

  // State for modals
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrderData, setPrintOrderData] = useState(null);

  const PO_LABEL_PRINT_KEY = 'purchaseOrderOfferBarcodeLabelsAfterConfirm';
  const [printBarcodeLabelsAfterPoConfirm, setPrintBarcodeLabelsAfterPoConfirm] = useState(() => {
    try {
      const v = localStorage.getItem(PO_LABEL_PRINT_KEY);
      if (v === null) return false;
      return v === 'true';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(PO_LABEL_PRINT_KEY, String(printBarcodeLabelsAfterPoConfirm));
    } catch {
      /* ignore */
    }
  }, [printBarcodeLabelsAfterPoConfirm]);

  const [showReceiptLabelPrinter, setShowReceiptLabelPrinter] = useState(false);
  const [receiptLabelProducts, setReceiptLabelProducts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewOrderFresh, setViewOrderFresh] = useState(null);
  const [selectedItemIndices, setSelectedItemIndices] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [editProductQuantity, setEditProductQuantity] = useState(1);
  const [editProductCost, setEditProductCost] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    supplier: '',
    items: [],
    invoiceNumber: '',
    expectedDelivery: new Date().toISOString().split('T')[0],
    notes: '',
    terms: ''
  });

  const itemsRef = useRef(formData.items);
  useEffect(() => {
    itemsRef.current = formData.items;
  }, [formData.items]);

  // Product selection state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customCost, setCustomCost] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [searchKey, setSearchKey] = useState(0); // Key to force re-render
  const [, setRefetchProducts] = useState(null);
  const [poDuplicateMerge, setPoDuplicateMerge] = useState(null);
  const [productSearchResetKey, setProductSearchResetKey] = useState(0);
  const poProductSearchFocusFnRef = useRef(null);
  const handlePoProductSearchFocusReady = useCallback((fn) => {
    poProductSearchFocusFnRef.current = fn;
  }, []);
  const refocusPoProductSearch = useCallback((source) => {
    setTimeout(() => {
      if (source === 'inline') {
        productSearchRef.current?.focus({ preventScroll: true });
      } else if (source === 'editModal') {
        const modalInput = document.querySelector('.modal-product-search input');
        modalInput?.focus({ preventScroll: true });
      } else {
        poProductSearchFocusFnRef.current?.();
      }
    }, 60);
  }, []);

  // Modal-specific product selection state
  const [modalProductSearchTerm, setModalProductSearchTerm] = useState('');
  const [modalSelectedProduct, setModalSelectedProduct] = useState(null);
  const [modalSelectedSuggestionIndex, setModalSelectedSuggestionIndex] = useState(-1);

  // Refs
  const productSearchRef = useRef(null);
  const supplierSearchRef = useRef(null);

  // Current order for operations
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showPurchaseOrderDetailsFields, setShowPurchaseOrderDetailsFields] = useState(false);
  const [showProductImages, setShowProductImages] = useState(localStorage.getItem('showProductImagesUI') !== 'false');

  useEffect(() => {
    const handleConfigChange = () => {
      setShowProductImages(localStorage.getItem('showProductImagesUI') !== 'false');
    };
    window.addEventListener('productImagesConfigChanged', handleConfigChange);
    return () => window.removeEventListener('productImagesConfigChanged', handleConfigChange);
  }, []);

  const [previewImageProduct, setPreviewImageProduct] = useState(null);

  const poCartScrollRef = useRef(null);
  const poCartLineElRefs = useRef(new Map());
  const [highlightedPoLineIndex, setHighlightedPoLineIndex] = useState(null);
  const poCartNeedsInnerScroll = formData.items.length > 10;

  useLayoutEffect(() => {
    if (highlightedPoLineIndex === null) return;
    const idx = highlightedPoLineIndex;
    poCartScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (poCartNeedsInnerScroll) {
      poCartLineElRefs.current.get(idx)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } else {
      requestAnimationFrame(() => {
        poCartLineElRefs.current.get(idx)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    }
  }, [highlightedPoLineIndex, poCartNeedsInnerScroll, formData.items.length]);

  useEffect(() => {
    if (formData.items.length === 0) setHighlightedPoLineIndex(null);
  }, [formData.items.length]);

  // Auto-focus on product search field when component mounts
  useEffect(() => {
    if (productSearchRef.current) {
      productSearchRef.current.focus({ preventScroll: true });
    }
  }, []);

  // Focus management for edit modal
  useEffect(() => {
    if (showEditModal) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Focus on the first input field in the modal after a short delay
      const timer = setTimeout(() => {
        const modalInput = document.querySelector('.modal-product-search input');
        if (modalInput) {
          modalInput.focus();
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      // Clear modal state when modal is closed
      setModalProductSearchTerm('');
      setModalSelectedProduct(null);
      setEditProductQuantity(1);
      setEditProductCost(0);
      setModalSelectedSuggestionIndex(-1);
    }
  }, [showEditModal]);


  // Transform filters to match backend API expectations
  const queryParams = React.useMemo(() => {
    const params = {
      ...pagination,
    };

    // Map fromDate/toDate to dateFrom/dateTo
    if (filters.fromDate) {
      params.dateFrom = filters.fromDate;
    }
    if (filters.toDate) {
      params.dateTo = filters.toDate;
    }

    // Map poNumber to search parameter
    if (filters.poNumber) {
      params.search = filters.poNumber;
    }

    if (filters.status) {
      params.status = filters.status;
    }

    return params;
  }, [filters, pagination]);

  // Fetch purchase orders
  const {
    data: purchaseOrdersData,
    isLoading,
    error,
    refetch,
  } = useGetPurchaseOrdersQuery(queryParams, { refetchOnMountOrArgChange: true });

  const [fetchPurchaseOrdersForExport] = useLazyGetPurchaseOrdersQuery();

  const dispatch = useAppDispatch();
  const { suppliers, isLoading: suppliersLoading, isFetching: suppliersFetching } = useDebouncedSupplierSearch(
    supplierSearchTerm,
    { selectedSupplier }
  );
  const invalidateSuppliersList = () => {
    dispatch(suppliersApi.util.invalidateTags([{ type: 'Suppliers', id: 'LIST' }]));
  };

  // Fetch complete supplier data when supplier is selected (for immediate balance updates)
  const { data: completeSupplierData, refetch: refetchSupplier } = useGetSupplierQuery(
    selectedSupplier?._id,
    {
      skip: !selectedSupplier?._id,
      staleTime: 0, // Always consider data stale to get fresh balance information
      refetchOnMountOrArgChange: true, // Refetch when component mounts or params change
    }
  );

  // Update supplier with complete data when fetched
  useEffect(() => {
    if (completeSupplierData?.data) {
      setSelectedSupplier(completeSupplierData.data);
    }
  }, [completeSupplierData]);

  // Fetch full order (with populated products) when view modal is open
  const viewOrderId = showViewModal && selectedOrder ? (selectedOrder.id || selectedOrder._id) : null;
  const { data: viewOrderData } = useGetPurchaseOrderQuery(viewOrderId, { skip: !viewOrderId });
  const viewOrder = viewOrderFresh || viewOrderData?.data?.purchaseOrder || viewOrderData?.purchaseOrder || selectedOrder;

  const {
    items: productsData,
    isLoading: lineProductSearchLoading,
    emptyMessage: lineProductEmptyMessage,
  } = useDebouncedPosProductSearch(productSearchTerm, { dropdownLimit: 120 });

  const {
    items: modalProductsData,
    isLoading: modalProductSearchLoading,
  } = useDebouncedPosProductSearch(modalProductSearchTerm, { dropdownLimit: 120 });

  const modalProductsLoading = modalProductSearchLoading;

  // Auto-scroll selected product into view when navigating with keyboard
  useEffect(() => {
    if (selectedProductIndex >= 0 && productSearchTerm && productsData) {
      const productList = document.querySelector('.product-list-container');
      const selectedProductElement = productList?.querySelector(`[data-product-index="${selectedProductIndex}"]`);

      if (selectedProductElement && productList) {
        selectedProductElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [selectedProductIndex, productSearchTerm, productsData]);


  // Mutations
  const [createPurchaseOrderMutation, { isLoading: creating }] = useCreatePurchaseOrderMutation();
  const [updatePurchaseOrderMutation, { isLoading: updating }] = useUpdatePurchaseOrderMutation();
  const [deletePurchaseOrderMutation, { isLoading: deleting }] = useDeletePurchaseOrderMutation();
  const [confirmPurchaseOrderMutation, { isLoading: confirming }] = useConfirmPurchaseOrderMutation();
  const [triggerGetPurchaseOrder] = useLazyGetPurchaseOrderQuery();
  const [updateItemsConfirmationMutation, { isLoading: updatingItemsConfirmation }] = useUpdatePurchaseOrderItemsConfirmationMutation();
  const [cancelPurchaseOrderMutation, { isLoading: cancelling }] = useCancelPurchaseOrderMutation();
  const [closePurchaseOrderMutation, { isLoading: closing }] = useClosePurchaseOrderMutation();

  // Helper functions
  const resetForm = () => {
    setFormData({
      supplier: '',
      items: [],
      invoiceNumber: '',
      expectedDelivery: new Date().toISOString().split('T')[0],
      notes: '',
      terms: ''
    });
    setSelectedSupplier(null);
    setSupplierSearchTerm('');
    setSelectedProduct(null);
    setProductSearchTerm('');
    setQuantity(1);
    setCustomCost('');
    setSearchKey(prev => prev + 1); // Force re-render of search components
    setHighlightedPoLineIndex(null);

    // Reset tab title to default
    if (updateTabTitle && getActiveTab) {
      const activeTab = getActiveTab();
      if (activeTab) {
        updateTabTitle(activeTab.id, 'PO');
      }
    }
  };

  const handleSupplierSelect = (supplier) => {
    // SearchableDropdown passes the full supplier object, not just the ID
    const supplierId = typeof supplier === 'string' ? supplier : supplier._id;
    const supplierObj = typeof supplier === 'object' ? supplier : suppliers?.find(s => s._id === supplierId);

    setSelectedSupplier(supplierObj);
    setFormData(prev => ({ ...prev, supplier: supplierId }));
    setSupplierSearchTerm(supplierObj?.companyName || supplierObj?.company_name || supplierObj?.businessName || supplierObj?.name || '');

    // Update tab title to show supplier name
    if (updateTabTitle && getActiveTab && supplierObj) {
      const activeTab = getActiveTab();
      if (activeTab) {
        updateTabTitle(activeTab.id, `PO - ${supplierObj.companyName || supplierObj.company_name || supplierObj.businessName || supplierObj.name || 'Unknown'}`);
      }
    }
  };

  const handleSupplierSearch = (searchTerm) => {
    setSupplierSearchTerm(searchTerm);

    if (searchTerm === '') {
      setSelectedSupplier(null);
      setFormData(prev => ({ ...prev, supplier: '' }));

      // Reset tab title to default when supplier is cleared
      if (updateTabTitle && getActiveTab) {
        const activeTab = getActiveTab();
        if (activeTab) {
          updateTabTitle(activeTab.id, 'PO');
        }
      }
    }
  };

  const productDisplayKey = (product) => {
    const inventory = product.inventory || {};
    const isLowStock = inventory.currentStock <= (inventory.reorderPoint || inventory.minStock || 0);
    const isOutOfStock = inventory.currentStock === 0;

    // Get display name - use variant display name if it's a variant
    const displayName = product.isVariant
      ? (product.displayName || product.variantName || product.name)
      : product.name;

    // Get cost price
    const pricing = product.pricing || {};
    const cost = pricing.cost || 0;

    // Show variant indicator
    const variantInfo = product.isVariant
      ? <span className="text-xs text-blue-600 font-semibold">({product.variantType}: {product.variantValue})</span>
      : null;

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col">
          <div className="font-medium">{displayName}</div>
          {variantInfo && <div className="text-xs text-gray-500">{variantInfo}</div>}
        </div>
        <div className="flex items-center space-x-4">
          <div className={`text-sm ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-600'}`}>
            Stock:{' '}
            {hasDualUnit(product)
              ? formatStockDualLabel(inventory.currentStock || 0, product)
              : `${inventory.currentStock || 0} pcs`}
          </div>
          <div className="text-sm text-gray-600">Cost: {Math.round(cost)}</div>
        </div>
      </div>
    );
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Use variant pricing if it's a variant
    const cost = product.pricing?.cost || 0;
    setCustomCost(cost.toString());
    // Show product/variant name in the field
    const displayName = product.isVariant
      ? (product.displayName || product.variantName || product.name)
      : product.name;
    setProductSearchTerm(displayName);
    setSelectedProductIndex(-1);
  };

  const handleProductSearch = (searchTerm) => {
    setProductSearchTerm(searchTerm);
    setSelectedProductIndex(-1); // Reset selection when searching

    // Clear selected product if search term doesn't match the selected product name
    if (selectedProduct && searchTerm !== selectedProduct.name) {
      setSelectedProduct(null);
      setCustomCost('');
    }

    if (searchTerm === '') {
      setSelectedProduct(null);
      setCustomCost('');
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && selectedProduct) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const resetPoProductPickerFields = () => {
    setSelectedProduct(null);
    setProductSearchTerm('');
    setQuantity(1);
    setCustomCost('');
    setSearchKey((prev) => prev + 1);
    setTimeout(() => {
      if (productSearchRef.current) {
        productSearchRef.current.focus({ preventScroll: true });
      }
    }, 100);
  };

  const handlePoDuplicateMergeConfirm = () => {
    if (!poDuplicateMerge) return;
    const { productId, incomingSnapshot, source } = poDuplicateMerge;

    let mergedIdx = null;
    setFormData((prev) => {
      const idx = prev.items.findIndex((row) => normalizePoLineProductId(row) === productId);
      if (idx < 0) {
        const snap = incomingSnapshot;
        const pid = snap.productData._id ?? snap.productData.id;
        const newItem = {
          product: pid,
          productData: snap.productData,
          quantity: snap.quantity,
          costPerUnit: snap.costPerUnit,
          totalCost: snap.quantity * snap.costPerUnit,
          ...(snap.boxes !== undefined && snap.pieces !== undefined ? { boxes: snap.boxes, pieces: snap.pieces } : {}),
        };
        mergedIdx = prev.items.length;
        return { ...prev, items: [...prev.items, newItem] };
      }
      mergedIdx = idx;
      const merged = mergePurchaseOrderLine(prev.items[idx], incomingSnapshot.quantity, incomingSnapshot.productData);
      return {
        ...prev,
        items: prev.items.map((it, i) => (i === idx ? merged : it)),
      };
    });

    setPoDuplicateMerge(null);

    if (source === 'sharedSearch') {
      setProductSearchResetKey((k) => k + 1);
      refocusPoProductSearch('sharedSearch');
    } else if (source === 'inline') {
      resetPoProductPickerFields();
    } else if (source === 'editModal') {
      setModalSelectedProduct(null);
      setModalProductSearchTerm('');
      setEditProductQuantity(1);
      setEditProductCost(0);
      setModalSelectedSuggestionIndex(-1);
      refocusPoProductSearch('editModal');
    }

    if (mergedIdx !== null && mergedIdx >= 0) {
      setHighlightedPoLineIndex(mergedIdx);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    const costPerUnit = parseFloat(customCost) || selectedProduct.pricing?.cost || 0;
    const ppb = getPiecesPerBox(selectedProduct);
    const { boxes, pieces } = ppb ? piecesToBoxesAndPieces(quantity, ppb) : {};

    const productId = String(selectedProduct._id ?? selectedProduct.id);
    const existingIndex = itemsRef.current.findIndex((row) => normalizePoLineProductId(row) === productId);

    if (existingIndex >= 0) {
      const existing = itemsRef.current[existingIndex];
      const displayName = selectedProduct.isVariant
        ? (selectedProduct.displayName || selectedProduct.variantName || selectedProduct.name)
        : selectedProduct.name;
      setPoDuplicateMerge({
        productId,
        displayName: displayName || 'Product',
        currentQuantity: existing.quantity,
        addQuantity: quantity,
        source: 'inline',
        incomingSnapshot: {
          quantity,
          costPerUnit,
          productData: selectedProduct,
          ...(ppb && { boxes, pieces }),
        },
      });
      return;
    }

    const totalCost = costPerUnit * quantity;
    const newItem = {
      product: selectedProduct._id,
      productData: selectedProduct,
      quantity,
      ...(ppb && { boxes, pieces }),
      costPerUnit,
      totalCost,
    };

    let addedLineIndex = null;
    setFormData((prev) => {
      addedLineIndex = prev.items.length;
      return {
        ...prev,
        items: [...prev.items, newItem],
      };
    });
    if (addedLineIndex !== null && addedLineIndex >= 0) {
      setHighlightedPoLineIndex(addedLineIndex);
    }

    resetPoProductPickerFields();
  };

  const handleAddItemFromProductSearch = useCallback((item) => {
    const productObj = item?.product;
    const productId = String(productObj?._id || productObj?.id || item?.product || '');
    const qty = Number(item?.quantity) || 1;
    const costPerUnit = Number(item?.costPerUnit ?? item?.unitPrice ?? 0);
    const totalCost = costPerUnit * qty;

    if (!productId || !productObj || qty <= 0) {
      return;
    }

    const existingIndex = itemsRef.current.findIndex((row) => normalizePoLineProductId(row) === productId);

    if (existingIndex >= 0) {
      const existing = itemsRef.current[existingIndex];
      const displayName = productObj.isVariant
        ? (productObj.displayName || productObj.variantName || productObj.name)
        : productObj.name;
      setPoDuplicateMerge({
        productId,
        displayName: displayName || 'Product',
        currentQuantity: existing.quantity,
        addQuantity: qty,
        source: 'sharedSearch',
        incomingSnapshot: {
          quantity: qty,
          costPerUnit,
          productData: productObj,
          ...(item?.boxes !== undefined && item?.pieces !== undefined ? { boxes: item.boxes, pieces: item.pieces } : {}),
        },
      });
      return;
    }

    const newItem = {
      product: productId,
      productData: productObj,
      quantity: qty,
      ...(item?.boxes !== undefined && item?.pieces !== undefined ? { boxes: item.boxes, pieces: item.pieces } : {}),
      costPerUnit,
      totalCost,
    };

    let addedLineIndex = null;
    setFormData((prev) => {
      addedLineIndex = prev.items.length;
      return {
        ...prev,
        items: [...prev.items, newItem],
      };
    });

    if (addedLineIndex !== null && addedLineIndex >= 0) {
      setHighlightedPoLineIndex(addedLineIndex);
    }
  }, []);

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSortCartItems = () => {
    setFormData(prev => {
      if (!prev.items || prev.items.length < 2) {
        return prev;
      }

      const getProductName = (item) => {
        const productData = item.productData || item.product;

        if (!productData) return '';

        if (typeof productData === 'string') {
          return productData;
        }

        return (
          (productData.isVariant
            ? (productData.displayName || productData.variantName || productData.name)
            : productData.name) ||
          productData.title ||
          productData.businessName ||
          productData.fullName ||
          ''
        );
      };

      const sortedItems = [...prev.items].sort((a, b) => {
        const nameA = getProductName(a).toString().toLowerCase();
        const nameB = getProductName(b).toString().toLowerCase();

        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

      return {
        ...prev,
        items: sortedItems
      };
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalCost, 0);
    const tax =
      !taxSystemEnabled ? 0 : subtotal * (effectiveGlobalTaxPct / 100);
    const total = subtotal + tax;
    const supplierOutstanding =
      Number(selectedSupplier?.pendingBalance ?? selectedSupplier?.outstandingBalance ?? 0) || 0;
    const totalPayables = total + supplierOutstanding;

    return { subtotal, tax, total, supplierOutstanding, totalPayables };
  };


  const handleCreate = () => {
    if (formData.items.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    if (!formData.supplier) {
      toast.error('Please select a supplier');
      return;
    }

    const { subtotal, tax, total } = calculateTotals();
    const orderData = {
      ...formData,
      isTaxExempt: !taxSystemEnabled,
      subtotal,
      tax,
      total
    };

    createPurchaseOrderMutation(orderData)
      .unwrap()
      .then(() => {
        toast.success('Purchase order created successfully');

        // Refetch suppliers list to update balances (so new supplier selection works without refresh)
        if (invalidateSuppliersList && typeof invalidateSuppliersList === 'function') {
          try {
            invalidateSuppliersList();
          } catch (error) {
            // Failed to refetch suppliers - silent fail
          }
        }

        // Reset form (clears supplier and enables supplier selection UI for next order)
        resetForm();
        if (updateTabTitle && getActiveTab) {
          const activeTab = getActiveTab();
          if (activeTab) {
            updateTabTitle(activeTab.id, 'PO');
          }
        }
        refetch();
      })
      .catch((error) => {
        toast.error(error?.data?.message || 'Failed to create purchase order');
      });
  };

  const handleUpdate = () => {
    // Clean the form data before sending to backend
    const cleanedData = {
      ...formData,
      isTaxExempt: !taxSystemEnabled,
      items: formData.items.map(item => {
        const base = {
          product: item.product,
          quantity: Math.round(Number(item.quantity) || 1),
          costPerUnit: item.costPerUnit,
          totalCost: item.totalCost,
          receivedQuantity: item.receivedQuantity || 0,
          remainingQuantity: item.remainingQuantity || item.quantity
        };
        if (item.boxes != null || item.pieces != null) {
          base.boxes = item.boxes;
          base.pieces = item.pieces;
        }
        return base;
      })
    };

    updatePurchaseOrderMutation({ id: selectedOrder.id || selectedOrder._id, ...cleanedData })
      .unwrap()
      .then(() => {
        setShowEditModal(false);
        setSelectedOrder(null);

        // Immediately refetch supplier to update outstanding balance (BEFORE resetting form)
        // Only refetch if supplier is selected (query is not skipped)
        if (selectedSupplier?._id && refetchSupplier && typeof refetchSupplier === 'function') {
          try {
            refetchSupplier().then((result) => {
              // Update supplier state immediately with fresh data
              if (result?.data?.data) {
                setSelectedSupplier(result.data.data);
              }
            }).catch((error) => {
              // Ignore "Cannot refetch a query that has not been started yet" errors
              if (!error?.message?.includes('has not been started')) {
                // Failed to refetch supplier - silent fail
              }
            });
          } catch (error) {
            // Ignore "Cannot refetch a query that has not been started yet" errors
            if (!error?.message?.includes('has not been started')) {
              // Failed to call refetchSupplier - silent fail
            }
          }
        }

        // Also refetch suppliers list to update balances
        if (invalidateSuppliersList && typeof invalidateSuppliersList === 'function') {
          try {
            invalidateSuppliersList();
          } catch (error) {
            // Failed to refetch suppliers - silent fail
          }
        }

        resetForm();
        toast.success('Purchase order updated successfully');
        if (updateTabTitle && getActiveTab) {
          const activeTab = getActiveTab();
          if (activeTab) {
            updateTabTitle(activeTab.id, 'PO');
          }
        }
        refetch();
      })
      .catch((error) => {
        const errorMessage = error?.data?.message || error?.message || 'Failed to update purchase order';
        toast.error(errorMessage);
      });
  };

  const handleDelete = (idOrOrder) => {
    const id = typeof idOrOrder === 'object' ? (idOrOrder?.id ?? idOrOrder?._id) : idOrOrder;
    const label = (typeof idOrOrder === 'object' && (idOrOrder?.purchaseOrderNumber || idOrOrder?.orderNumber)) || `${id}`;
    confirmDelete(label, 'Purchase Order', async () => {
      try {
        await deletePurchaseOrderMutation(id).unwrap();
        toast.success('Purchase order deleted successfully');
        refetch();
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to delete purchase order');
        throw error;
      }
    });
  };

  const handleConfirm = async (order) => {
    const id = order?.id || order?._id;
    if (!id) return;
    if (
      !window.confirm(
        'Are you sure you want to confirm this purchase order? Inventory will be updated and a purchase invoice may be created.'
      )
    ) {
      return;
    }
    try {
      await confirmPurchaseOrderMutation(id).unwrap();
      toast.success('Purchase order confirmed successfully');
      refetch();

      if (!printBarcodeLabelsAfterPoConfirm) return;

      try {
        const res = await triggerGetPurchaseOrder(id).unwrap();
        const po = res?.data?.purchaseOrder || res?.purchaseOrder;
        const items = po?.items || [];
        const prods = buildReceiptLabelProductsFromLineItems(items);
        if (prods.length) {
          setReceiptLabelProducts(prods);
          setShowReceiptLabelPrinter(true);
        }
      } catch (labelErr) {
        console.warn('Could not load PO for barcode labels:', labelErr);
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Failed to confirm purchase order');
    }
  };

  const handleCancel = (id) => {
    if (window.confirm('Are you sure you want to cancel this purchase order? This action cannot be undone.')) {
      cancelPurchaseOrderMutation(id)
        .unwrap()
        .then(() => {
          toast.success('Purchase order cancelled successfully');
          refetch();
        })
        .catch((error) => {
          toast.error(error?.data?.message || 'Failed to cancel purchase order');
        });
    }
  };

  const handleUpdateItemsConfirmation = (itemUpdates, confirmAll, cancelAll) => {
    const order = viewOrder || selectedOrder;
    const id = order?.id ?? order?._id;
    if (!id) return;
    updateItemsConfirmationMutation({ id, itemUpdates, confirmAll, cancelAll })
      .unwrap()
      .then((response) => {
        toast.success('Items confirmation updated');
        if (response?.purchaseOrder) {
          setViewOrderFresh(response.purchaseOrder);
          setSelectedOrder(response.purchaseOrder);
        }
        setSelectedItemIndices([]);
        refetch();
      })
      .catch((error) => {
        toast.error(error?.data?.message || 'Failed to update items confirmation');
      });
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);

    // Process items to ensure productData is available and costPerUnit is preserved
    const processedItems = (order.items || []).map(item => {
      // Use saved costPerUnit, or fallback to product's default cost price if saved cost is 0
      let finalCostPerUnit = item.costPerUnit || 0;
      if (finalCostPerUnit === 0 && item.product?.pricing?.cost) {
        finalCostPerUnit = item.product.pricing.cost;
      }

      return {
        product: item.product?._id || item.product,
        quantity: item.quantity,
        costPerUnit: finalCostPerUnit, // Use saved cost or fallback to product default
        totalCost: item.totalCost || (item.quantity * finalCostPerUnit),
        receivedQuantity: item.receivedQuantity || 0,
        remainingQuantity: item.remainingQuantity || item.quantity,
        productData: item.product || null // Use the populated product data
      };
    });

    const newFormData = {
      supplier: order.supplier?._id || '',
      items: processedItems,
      expectedDelivery: order.expectedDelivery ? new Date(order.expectedDelivery).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: order.notes || '',
      terms: order.terms || ''
    };

    setFormData(newFormData);

    // Set the selected supplier and update tab title
    if (order.supplier) {
      setSelectedSupplier(order.supplier);
      setSupplierSearchTerm(order.supplier.companyName || order.supplier.name || '');

      // Update tab title to show supplier name
      if (updateTabTitle && getActiveTab) {
        const activeTab = getActiveTab();
        if (activeTab) {
          updateTabTitle(activeTab.id, `PO - ${order.supplier.companyName || order.supplier.name || 'Unknown'}`);
        }
      }
    } else {
      setSelectedSupplier(null);
      setSupplierSearchTerm('');

      // Reset tab title to default
      if (updateTabTitle && getActiveTab) {
        const activeTab = getActiveTab();
        if (activeTab) {
          updateTabTitle(activeTab.id, 'PO');
        }
      }
    }

    setShowEditModal(true);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setViewOrderFresh(null);
    setSelectedItemIndices([]);
    setShowViewModal(true);
  };

  const formatPurchaseOrderForPrint = (order) => {
    if (!order) return null;
    const supplier = order.supplier || {};
    const supplierInfo = {
      ...order.supplierInfo,
      address: order.supplierInfo?.address && typeof order.supplierInfo.address === 'string'
        ? order.supplierInfo.address
        : formatAddressForDisplay(supplier) || ''
    };
    const items = (order.items || []).map((item) => {
      const product = item.product || item.productData || {};
      const productName = typeof product === 'object' && product !== null
        ? (product.name || product.displayName || product.display_name || product.variantName || product.variant_name)
        : getProductDisplayName(product);
      const name = productName || 'Product';
      const qty = Number(item.quantity) || 0;
      const unitCost = Number(item.costPerUnit ?? item.unitCost ?? item.cost ?? 0) || 0;
      const totalCost = Number(item.totalCost) || qty * unitCost;
      const barcode =
        typeof product === 'object' && product !== null
          ? (product.barcode || product.barcodeNumber || '').toString().trim()
          : '';
      const sku =
        typeof product === 'object' && product !== null
          ? (product.sku || product.skuCode || '').toString().trim()
          : '';
      return {
        quantity: qty,
        unitPrice: unitCost,
        unitCost,
        costPerUnit: unitCost,
        total: totalCost,
        product: { name, ...(barcode ? { barcode } : {}), ...(sku ? { sku } : {}) },
        name
      };
    });
    const subtotal = order.subtotal ?? items.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0);
    const tax = order.tax ?? 0;
    const total = order.total ?? subtotal + tax;
    return {
      ...order,
      supplier,
      supplierInfo,
      items,
      subtotal,
      tax,
      total,
      poNumber: order.poNumber || order.orderNumber || order.referenceNumber,
      orderNumber: order.poNumber || order.orderNumber,
      status: order.status || 'draft',
      createdAt: order.createdAt || order.orderDate,
      payment: order.payment || { method: 'N/A', status: 'Pending', amountPaid: 0 }
    };
  };

  const handlePrint = async (order) => {
    const orderId = order?._id || order?.id;
    let source = order;
    if (orderId) {
      try {
        const result = await triggerGetPurchaseOrder(orderId).unwrap();
        source = result?.purchaseOrder || result?.data?.purchaseOrder || result || order;
      } catch {
        toast.error('Could not load full order — printing with available data');
      }
    }
    const formatted = formatPurchaseOrderForPrint(source);
    if (formatted) {
      setPrintOrderData(formatted);
      setShowPrintModal(true);
    }
  };



  // Extract purchase orders data - handle multiple possible response structures
  const purchaseOrders = React.useMemo(() => {
    if (!purchaseOrdersData) return [];
    if (purchaseOrdersData?.data?.purchaseOrders) return purchaseOrdersData.data.purchaseOrders;
    if (purchaseOrdersData?.purchaseOrders) return purchaseOrdersData.purchaseOrders;
    if (purchaseOrdersData?.data?.data?.purchaseOrders) return purchaseOrdersData.data.data.purchaseOrders;
    if (Array.isArray(purchaseOrdersData)) return purchaseOrdersData;
    if (Array.isArray(purchaseOrdersData?.data)) return purchaseOrdersData.data;
    return [];
  }, [purchaseOrdersData]);

  const poTableScrollRef = useRef(null);
  const excelExportRef = useRef(null);
  const pdfExportRef = useRef(null);
  const virtualizePoRows = purchaseOrders.length > 35;
  const poRowVirtualizer = useVirtualizer({
    count: purchaseOrders.length,
    getScrollElement: () => poTableScrollRef.current,
    estimateSize: () => 56,
    overscan: 12,
  });

  const paginationInfo = purchaseOrdersData?.data?.pagination || purchaseOrdersData?.pagination || {};
  const { subtotal, tax, total, supplierOutstanding, totalPayables } = calculateTotals();

  const purchaseOrdersExportParams = useMemo(() => {
    const params = { all: true };
    if (filters.fromDate) params.dateFrom = filters.fromDate;
    if (filters.toDate) params.dateTo = filters.toDate;
    if (filters.poNumber) params.search = filters.poNumber;
    if (filters.status) params.status = filters.status;
    return params;
  }, [filters]);

  const getExportData = useCallback(async () => {
    try {
      const res = await fetchPurchaseOrdersForExport(purchaseOrdersExportParams).unwrap();
      const allRows = res?.purchaseOrders ?? res?.data?.purchaseOrders ?? [];
      return {
        title: 'Purchase Orders Report',
        filename: `Purchase_Orders_${filters.fromDate}_to_${filters.toDate}.xlsx`,
        company: {
          name: companySettings?.companyName || 'ZARYAB IMPEX',
          address: companySettings?.address || companySettings?.billingAddress || '',
          contact: `${companySettings?.contactNumber || ''} ${companySettings?.email ? '| ' + companySettings.email : ''}`.trim()
        },
        columns: [
          { header: 'S.No', key: 'sno', width: 8, type: 'number' },
          { header: 'PO #', key: 'poNumber', width: 22 },
          { header: 'Supplier', key: 'supplierName', width: 35 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Status', key: 'status', width: 18 },
          { header: 'Total', key: 'total', width: 14, type: 'currency' }
        ],
        data: allRows.map((order, i) => ({
          sno: i + 1,
          poNumber: order.purchase_order_number || order.poNumber || order.po_number || '—',
          supplierName: safeRender(order.supplier) || 'Unknown',
          date: formatDate(order.purchase_date || order.order_date || order.created_at || order.createdAt),
          status: String(order?.status || '—').replace(/_/g, ' '),
          total: Number(order.total || 0)
        })),
        summary: {
          rows: [
            {
              label: 'GRAND TOTAL:',
              poNumber: `${allRows.length} orders`,
              total: allRows.reduce((sum, o) => sum + Number(o.total || 0), 0)
            }
          ]
        }
      };
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Could not load purchase orders for export';
      toast.error(msg);
      return null;
    }
  }, [fetchPurchaseOrdersForExport, purchaseOrdersExportParams, filters.fromDate, filters.toDate, companySettings]);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Modern Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-3">
            <div className="flex-shrink-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Purchase Orders</h1>
            </div>
            <div className="hidden sm:block h-7 w-px bg-gray-200"></div>
            <div className="flex-1 min-w-0 sm:min-w-[220px] lg:max-w-lg">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Select Supplier
                </label>
                {selectedSupplier && (
                  <button
                    onClick={() => {
                      setSelectedSupplier(null);
                      setSupplierSearchTerm('');
                      setFormData(prev => ({ ...prev, supplier: '' }));
                      if (updateTabTitle && getActiveTab) {
                        const activeTab = getActiveTab();
                        if (activeTab) {
                          updateTabTitle(activeTab.id, 'PO');
                        }
                      }
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider underline"
                  >
                    Change
                  </button>
                )}
              </div>
              <SupplierPartySelect
                innerRef={supplierSearchRef}
                items={suppliers}
                selectedItem={selectedSupplier}
                onSelect={handleSupplierSelect}
                onSearch={handleSupplierSearch}
                searchValue={supplierSearchTerm}
                loading={suppliersLoading || suppliersFetching}
                emptyMessage={supplierSearchTerm.length > 0 ? "No suppliers found" : "Start typing to search suppliers..."}
                canViewBalance={canViewSupplierBalance}
                showSecondaryName
              />
            </div>
          </div>

          <SupplierSummaryStrip
            supplier={selectedSupplier}
            canViewBalance
            canViewPhone
          />
        </div>
      </div>

      {/* Combined Product Selection and Cart Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <h3 className="text-lg font-medium text-gray-900">Product Selection & Cart</h3>
            {formData.items.length > 0 && (
              <Button
                type="button"
                onClick={handleSortCartItems}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2 w-fit"
                title="Sort products alphabetically"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort A-Z</span>
              </Button>
            )}
          </div>
        </div>
        <div className="card-content">
          {/* Product Search */}
          <div className="mb-2">
            <ProductSearch
              key={productSearchResetKey}
              onAddProduct={handleAddItemFromProductSearch}
              onRefetchReady={setRefetchProducts}
              onFocusReady={handlePoProductSearchFocusReady}
            />
          </div>

          {/* Cart Items */}
          {formData.items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No items in cart</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div
                ref={poCartScrollRef}
                className={
                  poCartNeedsInnerScroll
                    ? 'max-h-[min(70vh,860px)] overflow-y-auto -mx-1 px-1 [scrollbar-gutter:stable]'
                    : 'overflow-visible -mx-1 px-1'
                }
              >
                {formData.items.map((item, index) => {
                  const product = item.productData || item.product; // Use stored product/variant data or fallback to product
                  const displayName = product?.isVariant
                    ? (product?.displayName || product?.variantName || product?.name || 'Unknown Variant')
                    : (product?.name || 'Unknown Product');
                  const totalPrice = item.costPerUnit * item.quantity;
                  const isLowStock = product?.inventory?.currentStock <= (product?.inventory?.reorderPoint || 0);
                  const serialHighlight = highlightedPoLineIndex === index;

                  return (
                    <div
                      key={index}
                      ref={(node) => {
                        if (node) poCartLineElRefs.current.set(index, node);
                        else poCartLineElRefs.current.delete(index);
                      }}
                    >
                      {/* Mobile Card View */}
                      <div className="md:hidden mb-4 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            {showProductImages && (
                              <LineItemThumbnail
                                src={product?.imageUrl}
                                size="md"
                                onClick={() => setPreviewImageProduct(product)}
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <LineItemSerial
                                  index={index}
                                  highlight={serialHighlight}
                                  variant="mobile"
                                />
                                <span className="font-medium text-sm truncate">
                                  {product?.isVariant
                                    ? safeRender(product?.displayName || product?.variantName || product?.name || 'Unknown Variant')
                                    : safeRender(product?.name || 'Unknown Product')}
                                </span>
                              </div>
                              {product?.isVariant && (
                                <span className="text-xs text-gray-500 block">
                                  {product.variantType}: {product.variantValue}
                                </span>
                              )}
                              {(() => {
                                const b = (product?.barcode ?? '').toString().trim();
                                if (b) return <span className="text-xs text-gray-600 font-mono block mt-0.5">Barcode: {b}</span>;
                                const s = (product?.sku ?? '').toString().trim();
                                if (s) return <span className="text-xs text-gray-600 font-mono block mt-0.5">SKU: {s}</span>;
                                return null;
                              })()}
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {isLowStock && <span className="text-yellow-600 text-xs">⚠️ Low</span>}
                              </div>
                            </div>
                          </div>
                          <LineItemRemoveButton
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 p-0 flex-shrink-0 ml-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 block text-center leading-tight">
                              {hasDualUnit(product)
                                ? formatStockDualLabel(product?.inventory?.currentStock || 0, product)
                                : (product?.inventory?.currentStock || 0)}
                            </span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
                            <LineItemTotalCell value={Math.round(totalPrice)} />
                          </div>
                          <div className={hasDualUnit(product) ? 'col-span-2' : ''}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                            {hasDualUnit(product) ? (
                              <DualUnitQuantityInput
                                product={product}
                                quantity={item.quantity}
                                showBoxInput={dualUnitShowBoxInputEnabled}
                                showPiecesInput={dualUnitShowPiecesInputEnabled}
                                onChange={(newQuantity, dual) => {
                                  if (newQuantity <= 0) {
                                    handleRemoveItem(index);
                                    return;
                                  }
                                  const ppb = getPiecesPerBox(product);
                                  const { boxes, pieces } = ppb && dual ? dual : (ppb ? piecesToBoxesAndPieces(newQuantity, ppb) : {});
                                  setFormData(prev => ({
                                    ...prev,
                                    items: prev.items.map((itm, i) =>
                                      i === index ? {
                                        ...itm,
                                        quantity: newQuantity,
                                        ...(ppb && { boxes, pieces }),
                                        totalCost: newQuantity * itm.costPerUnit
                                      } : itm
                                    )
                                  }));
                                }}
                                min={1}
                                inputClassName="text-center h-8 w-full border border-gray-300 rounded px-2"
                                compact={hasDualUnit(product)}
                              />
                            ) : (
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value) || 1;
                                  if (newQuantity <= 0) {
                                    handleRemoveItem(index);
                                    return;
                                  }
                                  setFormData(prev => ({
                                    ...prev,
                                    items: prev.items.map((itm, i) =>
                                      i === index ? { ...itm, quantity: newQuantity, totalCost: newQuantity * itm.costPerUnit } : itm
                                    )
                                  }));
                                }}
                                onFocus={(e) => e.target.select()}
                                className="text-center h-8 w-full"
                                min="1"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.costPerUnit}
                              onChange={(e) => {
                                const newCost = parseFloat(e.target.value) || 0;
                                setFormData(prev => ({
                                  ...prev,
                                  items: prev.items.map((itm, i) =>
                                    i === index ? { ...itm, costPerUnit: newCost, totalCost: itm.quantity * newCost } : itm
                                  )
                                }));
                              }}
                              onFocus={(e) => e.target.select()}
                              className="text-center h-8 w-full"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Desktop Table Row */}
                      <div className={`hidden md:block py-1 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div
                          className={`grid gap-x-1 items-center ${dualUnitShowBoxInputEnabled
                            ? 'grid-cols-[2.25rem_minmax(0,1fr)_4.75rem_5.35rem_5.35rem_5.35rem_5.35rem_2.25rem]'
                            : 'grid-cols-[2.25rem_minmax(0,1fr)_5.35rem_5.35rem_5.35rem_5.35rem_2.25rem]'
                            }`}
                        >
                          {/* Serial Number - 1 column (new field) */}
                          <div className="min-w-0 flex justify-start">
                            <LineItemSerial index={index} highlight={serialHighlight} />
                          </div>

                          {/* Product Name — col-span-4 so Qty can use 3 cols for dual units */}
                          <div className="min-w-0 flex items-center h-8 gap-2 pl-1">
                            {showProductImages && (
                              <LineItemThumbnail
                                src={product?.imageUrl}
                                onClick={() => setPreviewImageProduct(product)}
                              />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm truncate">
                                {product?.isVariant
                                  ? safeRender(product?.displayName || product?.variantName || product?.name || 'Unknown Variant')
                                  : safeRender(product?.name || 'Unknown Product')}
                                {isLowStock && <span className="text-yellow-600 text-xs ml-2">⚠️ Low</span>}
                              </span>
                              {product?.isVariant && (
                                <span className="text-xs text-gray-500">
                                  {product.variantType}: {product.variantValue}
                                </span>
                              )}
                            </div>
                          </div>

                          {dualUnitShowBoxInputEnabled && (
                            <div className="min-w-0">
                              <LineItemBoxInputCell
                                product={product}
                                item={item}
                                inputComponent={Input}
                                onChange={(rawValue) => {
                                  const ppb = getPiecesPerBox(product);
                                  const newBoxes = Math.max(0, parseInt(rawValue, 10) || 0);
                                  const currentPieces = piecesToBoxesAndPieces(item.quantity, ppb || 1).pieces;
                                  const nextQty = (newBoxes * (ppb || 1)) + currentPieces;
                                  setFormData(prev => ({
                                    ...prev,
                                    items: prev.items.map((itm, i) =>
                                      i === index
                                        ? {
                                          ...itm,
                                          boxes: newBoxes,
                                          quantity: nextQty,
                                          totalCost: nextQty * itm.costPerUnit
                                        }
                                        : itm
                                    )
                                  }));
                                }}
                              />
                            </div>
                          )}

                          {/* Stock - 1 column (matches Product Selection Stock) */}
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 block text-center min-h-8 flex items-center justify-center leading-tight text-xs">
                              {hasDualUnit(product)
                                ? formatStockDualLabel(product?.inventory?.currentStock || 0, product)
                                : (product?.inventory?.currentStock || 0)}
                            </span>
                          </div>

                          {/* Quantity */}
                          <div className="min-w-0">
                            <DualUnitQuantityInput
                              product={product}
                              quantity={item.quantity}
                              showBoxInput={dualUnitShowBoxInputEnabled && !hasDualUnit(product)}
                              showPiecesInput={dualUnitShowPiecesInputEnabled}
                              showRemainingAfterSale={false}
                              showPiecesUnitLabel={false}
                              onChange={(newQuantity, dual) => {
                                if (newQuantity <= 0) {
                                  handleRemoveItem(index);
                                  return;
                                }
                                const ppb = getPiecesPerBox(product);
                                const { boxes, pieces } = ppb && dual ? dual : (ppb ? piecesToBoxesAndPieces(newQuantity, ppb) : {});
                                setFormData(prev => ({
                                  ...prev,
                                  items: prev.items.map((itm, i) =>
                                    i === index ? {
                                      ...itm,
                                      quantity: newQuantity,
                                      ...(ppb && { boxes, pieces }),
                                      totalCost: newQuantity * itm.costPerUnit
                                    } : itm
                                  )
                                }));
                              }}
                              min={1}
                              inputClassName="w-full min-w-0 text-center h-8 border border-gray-300 rounded px-2"
                              compact={hasDualUnit(product)}
                            />
                          </div>

                          {/* Cost - 1 column (matches Product Selection Cost) */}
                          <div className="min-w-0">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.costPerUnit}
                              onChange={(e) => {
                                const newCost = parseFloat(e.target.value) || 0;
                                setFormData(prev => ({
                                  ...prev,
                                  items: prev.items.map((itm, i) =>
                                    i === index ? { ...itm, costPerUnit: newCost, totalCost: itm.quantity * newCost } : itm
                                  )
                                }));
                              }}
                              onFocus={(e) => e.target.select()}
                              className="text-center h-8"
                              min="0"
                            />
                          </div>

                          {/* Total - 1 column (matches Product Selection Amount) */}
                          <div className="min-w-0">
                            <LineItemTotalCell
                              value={Number.isFinite(totalPrice) ? totalPrice.toFixed(2) : '0.00'}
                            />
                          </div>

                          {/* Delete Button - 1 column (matches Product Selection Add Button) */}
                          <div className="min-w-0 flex justify-end">
                            <LineItemRemoveButton onClick={() => handleRemoveItem(index)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Purchase Order Details - Create Mode */}
      {formData.items.length > 0 && !showEditModal && (
        <div
          className={`mt-4 grid w-full min-w-0 grid-cols-1 gap-4 lg:gap-5 lg:items-start ${showPurchaseOrderDetailsFields ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
            }`}
        >
          <OrderCheckoutCard
            className={`mt-0 ml-0 max-w-none min-w-0 w-full border-slate-200 bg-none bg-slate-50 shadow-sm ring-0 ${showPurchaseOrderDetailsFields ? 'order-1' : 'order-2'
              }`}
          >
            <OrderDetailsSection
              detailsTitle="Purchase Details"
              showDetails={showPurchaseOrderDetailsFields}
              onShowDetailsChange={setShowPurchaseOrderDetailsFields}
              checkboxId="showPurchaseOrderDetailsFields"
            >
              {showPurchaseOrderDetailsFields && (
                <>
                  {/* Mobile Layout - Stacked */}
                  <div className="md:hidden space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Invoice Number
                      </label>
                      <Input
                        type="text"
                        value={formData.invoiceNumber || "Auto-generated"}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        className="h-10 text-sm w-full"
                        placeholder="Auto-generated"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Expected Delivery
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={formData.expectedDelivery}
                          onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                          className="h-10 text-sm w-full pr-8"
                        />
                        <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none sm:hidden" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <Input
                        type="text"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="h-10 text-sm w-full"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>

                  {/* Desktop Layout - Horizontal */}
                  <div className="hidden md:flex flex-nowrap gap-3 items-end justify-end">
                    <div className="flex flex-col w-44">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Invoice Number
                      </label>
                      <Input
                        type="text"
                        value={formData.invoiceNumber || "Auto-generated"}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="Auto-generated"
                        disabled
                      />
                    </div>
                    <div className="flex flex-col w-48">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Expected Delivery
                      </label>
                      <Input
                        type="date"
                        value={formData.expectedDelivery}
                        onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex flex-col w-[28rem]">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <Input
                        type="text"
                        autoComplete="off"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </>
              )}
            </OrderDetailsSection>
          </OrderCheckoutCard>

          <OrderCheckoutCard
            className={`mt-0 ml-0 max-w-none min-w-0 w-full border-slate-200 bg-none bg-slate-50 shadow-sm ring-0 ${showPurchaseOrderDetailsFields ? 'order-2' : 'order-1'
              }`}
          >
            <OrderSummaryBar>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCreate}
                  disabled={creating || formData.items.length === 0}
                  variant="default"
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white border-none h-8 px-4 font-bold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {creating ? 'Creating...' : 'Create PO'}
                </Button>
                <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                  {formData.items.length > 0 && !showEditModal && (
                    <Button
                      onClick={resetForm}
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      title="Clear Cart"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {formData.items.length > 0 && (
                    <Button
                      onClick={() => {
                        const tempOrder = {
                          poNumber: `PO-${Date.now()}`,
                          supplier: selectedSupplier,
                          items: formData.items.map(item => {
                            const product =
                              item.productData ||
                              (typeof item.product === 'object' ? item.product : null);
                            return {
                              product: product,
                              quantity: item.quantity,
                              unitCost: item.costPerUnit,
                              totalCost: item.quantity * item.costPerUnit
                            };
                          }),
                          subtotal: subtotal,
                          discount: 0,
                          tax: tax,
                          total: total,
                          expectedDelivery: formData.expectedDelivery,
                          notes: formData.notes,
                          terms: formData.terms,
                          createdAt: new Date().toISOString()
                        };
                        handlePrint(tempOrder);
                      }}
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      title="Print Preview"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </OrderSummaryBar>
            <OrderSummaryContent className="bg-none bg-slate-50">
              <div className="space-y-2">
                {taxSystemEnabled && tax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {`Tax (${effectiveGlobalTaxPct}%):`}
                    </span>
                    <span className="text-xl font-semibold tabular-nums text-foreground">
                      {tax.toFixed(2)}
                    </span>
                  </div>
                )}
                {selectedSupplier && (
                  <div className="mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Subtotal</span>
                        <div className="h-8 flex items-center px-2 bg-slate-50 border border-gray-200 rounded-md text-xl font-semibold tabular-nums text-foreground">
                          {subtotal.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Discount</label>
                          <span className="text-[10px] font-bold text-primary-600">Amt</span>
                        </div>
                        <Input
                          type="number"
                          value={0}
                          readOnly
                          className="w-full h-8 px-2 border-gray-200 rounded-md bg-white text-sm font-medium shadow-none"
                        />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Total</span>
                        <div className="h-8 flex items-center px-2 bg-slate-50 border border-gray-200 rounded-md text-xl font-bold tabular-nums text-primary">
                          {total.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Outstanding</span>
                        <div className="h-8 flex items-center px-2 bg-slate-50 border border-gray-200 rounded-md text-xl font-semibold tabular-nums text-foreground">
                          {supplierOutstanding.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Payment</label>
                          <span className="text-[10px] font-bold text-primary-600">Cash</span>
                        </div>
                        <Input
                          type="number"
                          value={0}
                          readOnly
                          className="w-full h-8 px-2 border-gray-200 rounded-md bg-white text-sm font-medium shadow-none"
                        />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-foreground mb-1">Payables</span>
                        <div className="h-8 flex items-center px-2 bg-slate-50 border border-gray-200 rounded-md text-xl font-bold tabular-nums text-primary">
                          {totalPayables.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <OrderCheckoutActions className="mt-4 border-0 pt-0">
                {formData.items.length > 0 && (
                  <div className="flex items-center space-x-2 px-2 mb-2">
                    <Input
                      type="checkbox"
                      id="printLabelsAfterPoConfirm"
                      checked={printBarcodeLabelsAfterPoConfirm}
                      onChange={(e) => setPrintBarcodeLabelsAfterPoConfirm(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="printLabelsAfterPoConfirm" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Print labels after purchase order
                    </label>
                  </div>
                )}
              </OrderCheckoutActions>
            </OrderSummaryContent>
          </OrderCheckoutCard>
        </div>
      )}

      <BaseModal
      isOpen={showEditModal && !!selectedOrder}
      onClose={() => {
        setShowEditModal(false);
        setSelectedOrder(null);
        setSupplierSearchTerm('');
        setModalProductSearchTerm('');
        setModalSelectedProduct(null);
        setEditProductQuantity(1);
        setEditProductCost(0);
        setModalSelectedSuggestionIndex(-1);
        resetForm();
      }}
      title="Edit Purchase Order"
      maxWidth="6xl"
    >
      <div className="p-6 space-y-8">
        {/* Purchase Order Details */}
        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-white/40 px-6 py-4">
            <ShowDetailsSectionHeader
              title="Order Details"
              showDetails={showPurchaseOrderDetailsFields}
              onShowDetailsChange={setShowPurchaseOrderDetailsFields}
              checkboxId="showPurchaseOrderDetailsFieldsEdit"
              titleClassName="text-lg font-bold text-gray-900"
            />
          </div>
          <div className="px-6 py-6 space-y-6">
            {/* Supplier Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Supplier Entity</label>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Search suppliers..."
                  value={supplierSearchTerm}
                  onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold text-gray-700 shadow-sm"
                />
                {/* Supplier Suggestions */}
                {supplierSearchTerm && suppliers?.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-2 max-h-60 overflow-y-auto border border-gray-100 rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                    {suppliers.slice(0, 10).map((supplier) => (
                      <div
                        key={supplier._id}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, supplier: supplier._id }));
                          setSupplierSearchTerm(supplier.companyName || supplier.name);
                        }}
                        className="px-5 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 group transition-colors"
                      >
                        <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{supplier.companyName || supplier.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{supplier.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selected Supplier Display */}
              {formData.supplier && (
                <div className="mt-4 p-4 bg-primary-50/50 rounded-xl border border-primary-100 flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary-600">
                      <Building className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-primary-900">
                      {selectedOrder?.supplierInfo?.companyName || selectedOrder?.supplierInfo?.name || 'Supplier'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, supplier: null }));
                      setSupplierSearchTerm('');
                    }}
                    className="text-xs font-bold text-primary-600 hover:text-primary-800 uppercase tracking-widest"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {showPurchaseOrderDetailsFields && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Invoice Number</label>
                    <Input
                      type="text"
                      value={formData.invoiceNumber || "Auto-generated"}
                      className="rounded-xl py-6 font-mono font-bold bg-gray-100 text-gray-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Expected Delivery</label>
                    <Input
                      type="date"
                      value={formData.expectedDelivery}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                      className="rounded-xl py-6 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Internal Notes</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="rounded-xl p-4 h-24 bg-white"
                      placeholder="Add any internal order notes..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Terms & Conditions</label>
                    <Textarea
                      value={formData.terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                      className="rounded-xl p-4 h-24 bg-white"
                      placeholder="Specify terms for this order..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Selection & Cart Items */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-1">
            <div className="h-2 w-8 bg-primary-600 rounded-full" />
            <h4 className="text-lg font-bold text-gray-900">Items & Inventory</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Product Search Selection */}
            <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Search Products</label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Search or type product name..."
                    value={modalProductSearchTerm}
                    onChange={(e) => {
                      e.stopPropagation();
                      setModalProductSearchTerm(e.target.value);
                      setModalSelectedSuggestionIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (!modalProductsData?.length) return;
                      const maxIndex = Math.min(modalProductsData.length - 1, 9);
                      switch (e.key) {
                        case 'ArrowDown':
                          e.preventDefault();
                          setModalSelectedSuggestionIndex(prev => prev < maxIndex ? prev + 1 : 0);
                          break;
                        case 'ArrowUp':
                          e.preventDefault();
                          setModalSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : maxIndex);
                          break;
                        case 'Enter':
                          e.preventDefault();
                          if (modalSelectedSuggestionIndex >= 0 && modalProductsData[modalSelectedSuggestionIndex]) {
                            const product = modalProductsData[modalSelectedSuggestionIndex];
                            setModalSelectedProduct(product);
                            setEditProductCost(product.pricing?.costPrice || 0);
                            setEditProductQuantity(1);
                            const displayName = product.isVariant ? (product.displayName || product.variantName || product.name) : product.name;
                            setModalProductSearchTerm(displayName);
                            setModalSelectedSuggestionIndex(-1);
                            setTimeout(() => document.querySelector('.modal-quantity-input')?.focus(), 100);
                          }
                          break;
                      }
                    }}
                    className="modal-product-search w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold text-gray-700 transition-all"
                  />
                  {modalProductsData && modalProductsData.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-2 max-h-96 overflow-y-auto border border-gray-100 rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                      {modalProductsData.map((product, index) => (
                        <div
                          key={product._id}
                          onClick={() => {
                            setModalSelectedProduct(product);
                            setEditProductCost(product.pricing?.costPrice || 0);
                            setEditProductQuantity(1);
                            const displayName = product.isVariant ? (product.displayName || product.variantName || product.name) : product.name;
                            setModalProductSearchTerm(displayName);
                            setModalSelectedSuggestionIndex(-1);
                            setTimeout(() => document.querySelector('.modal-quantity-input')?.focus(), 100);
                          }}
                          className={`px-5 py-4 cursor-pointer border-b border-gray-50 last:border-b-0 group transition-colors ${modalSelectedSuggestionIndex === index ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className={`font-bold transition-colors ${modalSelectedSuggestionIndex === index ? 'text-primary-700' : 'text-gray-900'}`}>
                                {product.isVariant ? (product.displayName || product.variantName || product.name) : product.name}
                              </span>
                              {product.isVariant && <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{product.variantType}: {product.variantValue}</span>}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-mono font-bold text-primary-600">PKR {product.pricing?.costPrice?.toLocaleString()}</span>
                              <div className="text-[10px] font-bold text-gray-400 uppercase">Current: {product.inventory?.currentStock || 0}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {modalSelectedProduct && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in duration-300">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Quantity</label>
                    <Input
                      type="number"
                      value={editProductQuantity}
                      onChange={(e) => setEditProductQuantity(parseFloat(e.target.value) || 1)}
                      className="modal-quantity-input rounded-xl py-6 font-mono font-bold text-lg"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Cost / Unit</label>
                    <Input
                      type="number"
                      value={editProductCost}
                      onChange={(e) => setEditProductCost(parseFloat(e.target.value) || 0)}
                      className="rounded-xl py-6 font-mono font-bold text-lg"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      onClick={() => {
                        const product = modalSelectedProduct;
                        const existingIdx = formData.items.findIndex(itm => normalizePoLineProductId(itm) === (product._id || product.id));
                        if (existingIdx >= 0) {
                          setPoDuplicateMerge({
                            productId: product._id || product.id,
                            displayName: product.isVariant ? (product.displayName || product.variantName || product.name) : product.name,
                            currentQuantity: formData.items[existingIdx].quantity,
                            addQuantity: editProductQuantity,
                            incomingSnapshot: {
                              productData: product,
                              quantity: editProductQuantity,
                              costPerUnit: editProductCost,
                              totalCost: editProductQuantity * editProductCost
                            },
                            source: 'editModal'
                          });
                        } else {
                          const newItem = {
                            product: product._id || product.id,
                            productData: product,
                            quantity: editProductQuantity,
                            costPerUnit: editProductCost,
                            totalCost: editProductQuantity * editProductCost
                          };
                          setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
                          setModalProductSearchTerm('');
                          setModalSelectedProduct(null);
                          setModalSelectedSuggestionIndex(-1);
                          setTimeout(() => document.querySelector('.modal-product-search')?.focus(), 100);
                        }
                      }}
                      className="w-full py-6 rounded-xl shadow-lg shadow-primary-500/20 font-bold"
                    >
                      Add to Order List
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Summary Panel */}
            <div className="md:col-span-4 bg-gray-900 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <h5 className="font-bold uppercase tracking-widest text-xs text-gray-400">Order Summary</h5>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Total Items</span>
                    <span className="text-lg font-mono font-bold">{formData.items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Subtotal</span>
                    <span className="text-lg font-mono font-bold">PKR {subtotal.toLocaleString()}</span>
                  </div>
                  {taxSystemEnabled && tax > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Tax ({effectiveGlobalTaxPct}%)</span>
                      <span className="text-lg font-mono font-bold">PKR {tax.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                    <span className="text-sm font-bold uppercase tracking-wider text-primary-400">Total Amount</span>
                    <span className="text-3xl font-mono font-bold text-white">PKR {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  onClick={handleUpdate}
                  disabled={updating || formData.items.length === 0}
                  className="w-full py-7 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 font-bold text-lg"
                >
                  {updating ? <LoadingInline className="text-white" /> : 'Confirm & Save Changes'}
                </Button>
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedOrder(null);
                    resetForm();
                  }}
                  variant="outline"
                  className="w-full py-7 rounded-xl border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  Discard Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          {formData.items.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 grid grid-cols-[minmax(0,1fr)_80px_100px_120px_50px] gap-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Information</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Qty</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Cost</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right"></span>
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                {formData.items.map((item, index) => {
                  const product = item.productData || (typeof item.product === 'object' ? item.product : null);
                  return (
                    <div key={index} className="px-6 py-4 grid grid-cols-[minmax(0,1fr)_80px_100px_120px_50px] gap-4 items-center group hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {product?.isVariant ? (product.displayName || product.variantName || product.name) : product?.name}
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 uppercase">Stock: {product?.inventory?.currentStock || 0}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQty = parseFloat(e.target.value) || 1;
                            setFormData(prev => ({
                              ...prev,
                              items: prev.items.map((itm, i) => i === index ? { ...itm, quantity: newQty, totalCost: newQty * itm.costPerUnit } : itm)
                            }));
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg h-10 text-center font-mono font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div className="text-center">
                        <input
                          type="number"
                          value={item.costPerUnit}
                          onChange={(e) => {
                            const newCost = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              items: prev.items.map((itm, i) => i === index ? { ...itm, costPerUnit: newCost, totalCost: itm.quantity * newCost } : itm)
                            }));
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg h-10 text-center font-mono font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div className="text-right font-mono font-bold text-sm text-gray-900">
                        {(item.quantity * item.costPerUnit).toLocaleString()}
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))}
                          className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseModal>

      {/* Results: compact header row + optional barcode option */}
      <div className="card">
        <div className="card-header py-3">
          <div className="flex flex-col gap-3">
            {/* Row 1: Title, Records (desktop), and Refresh */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Purchase Orders</h3>
                <span className="hidden sm:inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {paginationInfo.total ?? paginationInfo.totalItems ?? purchaseOrders.length ?? 0} records
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="p-2 text-gray-400 transition-colors hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Content Row: Date, Toggle, Actions (One row on mobile/desktop) */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                {/* Primary Row: Date and All Action Buttons */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <DateFilter
                      startDate={filters.fromDate}
                      endDate={filters.toDate}
                      onDateChange={(start, end) => {
                        handleFilterChange('fromDate', start || '');
                        handleFilterChange('toDate', end || '');
                      }}
                      compact={true}
                      showPresets={true}
                      showLabel={false}
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      className={`h-10 w-10 p-0 lg:hidden border-gray-200 ${showMobileFilters ? 'bg-gray-100' : ''}`}
                      title="More Filters"
                    >
                      <Filter className={`h-4 w-4 ${showMobileFilters ? 'text-primary-600' : 'text-gray-500'}`} />
                    </Button>

                    <ExcelExportButton 
                      ref={excelExportRef}
                      getData={getExportData} 
                      label="" 
                      className="h-10 w-10 p-0 hidden sm:flex"
                    />
                    <PdfExportButton 
                      ref={pdfExportRef}
                      getData={getExportData} 
                      label="" 
                      className="h-10 w-10 p-0 hidden sm:flex"
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-10 w-10 p-0 sm:hidden border-gray-200"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); excelExportRef.current?.handleExport(); }}>
                          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                          Export to Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pdfExportRef.current?.handleExport(); }}>
                          <FileText className="h-4 w-4 mr-2 text-red-600" />
                          Export to PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      type="button"
                      variant="default"
                      onClick={() => refetch()}
                      className="h-10 px-3 sm:px-5 bg-slate-900 hover:bg-slate-800"
                    >
                      <span className="hidden sm:inline">Search</span>
                      <Search className="h-4 w-4 sm:hidden" />
                    </Button>
                  </div>
                </div>

                {/* Collapsible Filters: Search and Status Select */}
                <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col sm:flex-row items-center gap-2 flex-1`}>
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="po-list-number"
                      type="text"
                      autoComplete="off"
                      placeholder="PO # / supplier…"
                      value={filters.poNumber}
                      onChange={(e) => handleFilterChange('poNumber', e.target.value)}
                      className="input h-10 w-full pl-9 bg-gray-50 border-gray-200 focus:bg-white text-sm"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <select
                      id="po-list-status"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="input h-10 w-full bg-gray-50 border-gray-200 text-sm"
                    >
                      <option value="">All Statuses</option>
                      <option value="draft">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="partially_received">Partially Received</option>
                      <option value="fully_received">Fully Received</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 border-t border-gray-100 pt-2">
              <input
                type="checkbox"
                id="po-offer-barcode-labels"
                checked={printBarcodeLabelsAfterPoConfirm}
                onChange={(e) => setPrintBarcodeLabelsAfterPoConfirm(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="po-offer-barcode-labels" className="cursor-pointer text-sm leading-snug text-gray-700">
                After confirming a draft PO (receipt), open barcode label printer — copies default to line quantity (barcode or SKU per product)
              </label>
            </div>
          </div>
        </div>
        <div className="card-content p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Loading purchase orders...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p>Error loading purchase orders: {error.message}</p>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No purchase orders found for the selected criteria.</p>
            </div>
          ) : (
            <>
              <div
                ref={poTableScrollRef}
                className={`overflow-x-auto ${virtualizePoRows ? 'max-h-[min(70vh,560px)] overflow-y-auto' : ''}`}
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const vItems = poRowVirtualizer.getVirtualItems();
                      const totalH = poRowVirtualizer.getTotalSize();
                      const padTop = vItems.length ? vItems[0].start : 0;
                      const padBottom = vItems.length ? totalH - vItems[vItems.length - 1].end : 0;
                      return (
                        <>
                          {padTop > 0 ? (
                            <tr aria-hidden className="pointer-events-none">
                              <td colSpan={6} className="p-0 border-0" style={{ height: padTop }} />
                            </tr>
                          ) : null}
                          {vItems.map((vr) => {
                            const order = purchaseOrders[vr.index];
                            const index = vr.index;
                            return (
                              <tr key={vr.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} style={{ height: vr.size }}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(order.purchase_date || order.order_date || order.created_at || order.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {order.purchase_order_number || order.poNumber || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {safeRender(order.supplier) || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <StatusBadge status={order.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {Math.round(order.total || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => handlePrint(order)}
                                      className="text-gray-600 hover:text-gray-900"
                                      title="Print"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </button>
                                    {(order.status === 'draft' || order.status === 'confirmed' || order.status === 'partially_received' || order.status === 'cancelled') && (
                                      <button
                                        onClick={() => handleEdit(order)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                        title="Edit"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                    )}
                                    {order.status === 'draft' && (
                                      <>
                                        <button
                                          onClick={() => handleConfirm(order)}
                                          className="text-green-600 hover:text-green-900"
                                          title="Confirm Order"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleCancel(order.id || order._id)}
                                          className="text-red-600 hover:text-red-900"
                                          title="Cancel Order"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </button>
                                      </>
                                    )}
                                    {(order.status === 'draft' || order.status === 'cancelled' || order.status === 'confirmed' || order.status === 'partially_received' || !order.supplier) && (
                                      <button
                                        onClick={() => handleDelete(order)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {padBottom > 0 ? (
                            <tr aria-hidden className="pointer-events-none">
                              <td colSpan={6} className="p-0 border-0" style={{ height: padBottom }} />
                            </tr>
                          ) : null}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                page={Number(paginationInfo.current ?? pagination.page) || 1}
                totalPages={Math.max(1, Number(paginationInfo.pages) || 1)}
                onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
                totalItems={paginationInfo.total}
                limit={pagination.limit}
              />
            </>
          )}
        </div>
      </div>

      <BaseModal
      isOpen={showViewModal && !!viewOrder}
      onClose={() => {
        setShowViewModal(false);
        setSelectedOrder(null);
        setViewOrderFresh(null);
        setSelectedItemIndices([]);
      }}
      title={`Purchase Order: ${viewOrder.poNumber}`}
      maxWidth="5xl"
    >
      <div className="p-8 space-y-10">
        {/* Order Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Supplier Entity</label>
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 group hover:border-primary-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600 border border-gray-100">
                  <Building className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate leading-tight">
                    {safeRender(viewOrder.supplier)}
                  </p>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">Active Supplier</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Order Logistics</label>
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Order Date</span>
                <span className="text-xs font-bold text-gray-900">{formatDate(viewOrder.orderDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Expected</span>
                <span className="text-xs font-bold text-primary-600">{formatDate(viewOrder.expectedDelivery)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">System Audit</label>
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Status</span>
                <StatusBadge status={viewOrder.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Creator</span>
                <span className="text-xs font-bold text-gray-900">
                  {viewOrder.createdBy?.firstName} {viewOrder.createdBy?.lastName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Ordered Products ({viewOrder.items?.length})</h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inventory Values in PKR</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 grid grid-cols-[minmax(0,1fr)_100px_120px_140px] gap-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Quantity</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Unit Cost</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Line Total</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {viewOrder.items?.map((item, index) => {
                const product = item.productData || (typeof item.product === 'object' ? item.product : null);
                return (
                  <div key={index} className="px-6 py-5 grid grid-cols-[minmax(0,1fr)_100px_120px_140px] gap-6 items-center hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors border border-gray-100">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                          {getProductDisplayName(product)}
                        </p>
                        {product?.sku && <p className="text-[10px] font-mono text-gray-400 uppercase mt-0.5">SKU: {product.sku}</p>}
                      </div>
                    </div>
                    <div className="text-center font-mono font-bold text-gray-900 bg-gray-50 py-1.5 rounded-lg border border-gray-100">
                      {item.quantity}
                    </div>
                    <div className="text-center font-mono font-bold text-gray-600">
                      {item.costPerUnit?.toLocaleString()}
                    </div>
                    <div className="text-right font-mono font-bold text-gray-900">
                      {(item.quantity * item.costPerUnit)?.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Order Notes</label>
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 h-full min-h-[120px]">
              <p className="text-sm text-gray-600 leading-relaxed italic">
                {viewOrder.notes || 'No specific notes recorded for this order.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Calculation Summary</label>
            <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-600/20 transition-all duration-700" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="font-mono font-bold">PKR {viewOrder.subtotal?.toLocaleString()}</span>
                </div>
                {viewOrder.tax > 0 && (
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-widest">Total Tax</span>
                    <span className="font-mono font-bold">PKR {viewOrder.tax?.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-1">Final Payable</p>
                    <p className="text-3xl font-mono font-bold text-white leading-none">PKR {viewOrder.total?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="h-8 w-8 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-400 mb-2 ml-auto">
                      <Receipt className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-100">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
            Audit Ref: {viewOrder._id}
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => handlePrint(viewOrder)}
              className="px-8 rounded-xl shadow-lg shadow-primary-500/20 font-bold"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button
              onClick={() => {
                setShowViewModal(false);
                setSelectedOrder(null);
                setViewOrderFresh(null);
                setSelectedItemIndices([]);
              }}
              variant="outline"
              className="px-8 rounded-xl border-gray-200 font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>

      <PrintModal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setPrintOrderData(null);
        }}
        orderData={printOrderData}
        documentTitle="Purchase Order"
        partyLabel="Supplier"
      />

      {showReceiptLabelPrinter && (
        <BarcodeLabelPrinter
          products={receiptLabelProducts}
          quantityMode
          modalTitle="Print labels — purchase order receipt"
          onClose={() => {
            setShowReceiptLabelPrinter(false);
            setReceiptLabelProducts([]);
          }}
        />
      )}

      <DuplicateLineItemMergeModal
        isOpen={!!poDuplicateMerge}
        onClose={() => {
          const src = poDuplicateMerge?.source;
          setPoDuplicateMerge(null);
          refocusPoProductSearch(src);
        }}
        onConfirm={handlePoDuplicateMergeConfirm}
        productName={poDuplicateMerge?.displayName ?? ''}
        currentQuantity={poDuplicateMerge?.currentQuantity ?? 0}
        quantityToAdd={poDuplicateMerge?.addQuantity ?? 0}
        newTotalQuantity={
          (poDuplicateMerge?.currentQuantity ?? 0) + (poDuplicateMerge?.addQuantity ?? 0)
        }
        title="Duplicate product"
        scopeLabel="purchase order"
        confirmText="Update quantity"
      />

      <ProductImagePreviewModal
        product={previewImageProduct}
        onClose={() => setPreviewImageProduct(null)}
      />

      <DeleteConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteConfirmation.message?.match(/"([^"]*)"/)?.[1] || ''}
        itemType="Purchase Order"
        isLoading={deleteConfirmation.isLoading}
      />

    </div>
  );
};


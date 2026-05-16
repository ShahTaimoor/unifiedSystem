import React, { useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Package,
  ArrowRight,
  Calendar,
  User,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle,
  Printer
} from 'lucide-react';
import {
  useGetTransformationsQuery,
  useCreateTransformationMutation,
  useCancelTransformationMutation,
} from '../store/services/productTransformationsApi';
import { useGetVariantsByBaseProductQuery, useLazyGetVariantQuery } from '../store/services/productVariantsApi';
import { useGetProductsQuery } from '../store/services/productsApi';
import { ProductSearchableSelect } from '../components/ProductSearchableSelect';
import { VariantSearchableSelect } from '../components/VariantSearchableSelect';
import { handleApiError, showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { LoadingSpinner, LoadingButton } from '../components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ValidatedInput, { ValidatedSelect } from '../components/ValidatedInput';
import BarcodeLabelPrinter from '../components/BarcodeLabelPrinter';
import BaseModal from '../components/BaseModal';

/** Rows for BarcodeLabelPrinter: base product + target variant (labels for both). */
function buildLabelPrinterRows(baseProduct, variant, options = {}) {
  const overrideBc =
    options.optionalVariantBarcode != null
      ? String(options.optionalVariantBarcode).trim()
      : '';
  const rows = [];
  if (baseProduct) rows.push(baseProduct);
  if (variant) {
    const rawP = variant.pricing;
    const pricing =
      rawP && typeof rawP === 'object' && !Array.isArray(rawP)
        ? rawP
        : {
            retail: Number(variant.retailPrice ?? variant.retail_price ?? 0),
            wholesale: Number(variant.wholesalePrice ?? variant.wholesale_price ?? 0),
            cost: Number(variant.cost ?? variant.costPrice ?? variant.cost_price ?? 0),
          };
    rows.push({
      _id: variant._id ?? variant.id,
      id: variant._id ?? variant.id,
      name:
        variant.displayName ??
        variant.display_name ??
        variant.variantName ??
        variant.variant_name ??
        'Variant',
      barcode: overrideBc || (variant.barcode ?? ''),
      sku: variant.sku ?? '',
      pricing,
    });
  }
  return rows;
}

function getTransformationBaseProductId(t) {
  return (
    t.base_product_id ??
    t.baseProductId ??
    t.baseProduct?.id ??
    t.base_product?.id ??
    (typeof t.baseProduct === 'string' ? t.baseProduct : null)
  );
}

function getTransformationTargetVariantId(t) {
  return (
    t.target_variant_id ??
    t.targetVariantId ??
    t.targetVariant?.id ??
    t.target_variant?.id ??
    (typeof t.targetVariant === 'string' ? t.targetVariant : null)
  );
}

/**
 * Unit transformation cost for UI defaults: uses DB `transformation_cost` when &gt; 0;
 * otherwise estimates from variant retail minus base product retail (how variants are priced in Product Variants).
 */
function getEffectiveVariantTransformationCost(variant, baseProduct) {
  if (!variant) return 0;
  const raw =
    variant.transformationCost ?? variant.transformation_cost;
  const stored = raw == null || raw === '' ? NaN : Number(raw);
  if (Number.isFinite(stored) && stored > 0) return stored;

  const vp = variant.pricing || {};
  const bp = baseProduct?.pricing || {};
  const vRetail = Number(vp.retail ?? vp.wholesale ?? 0);
  const bRetail = Number(bp.retail ?? 0);
  if (vRetail > 0 && bRetail >= 0 && vRetail > bRetail) {
    return Math.round((vRetail - bRetail) * 100) / 100;
  }
  return Number.isFinite(stored) ? stored : 0;
}

const ProductTransformations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBaseProduct, setSelectedBaseProduct] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barcodePrintQueue, setBarcodePrintQueue] = useState(null);

  // Fetch transformations
  const { data: transformationsData, isLoading: transformationsLoading, refetch } = useGetTransformationsQuery({
    baseProduct: selectedBaseProduct || undefined,
    status: statusFilter || undefined,
    search: searchTerm || undefined
  });
  const transformations = React.useMemo(() => {
    return transformationsData?.data?.transformations || transformationsData?.transformations || [];
  }, [transformationsData]);

  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery(
    {
      limit: 10000,
      listMode: 'minimal',
    },
    { refetchOnMountOrArgChange: true }
  );
  const products = React.useMemo(() => {
    return productsData?.data?.products || productsData?.products || [];
  }, [productsData]);


  const [cancelTransformation, { isLoading: isCancelling }] = useCancelTransformationMutation();
  const [fetchVariantById] = useLazyGetVariantQuery();
  const [printingLabelsRowId, setPrintingLabelsRowId] = useState(null);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCancelTransformation = async (id) => {
    try {
      await cancelTransformation(id).unwrap();
      showSuccessToast('Transformation cancelled');
      refetch();
    } catch (error) {
      handleApiError(error, 'ProductTransformations');
    }
  };

  const handlePrintLabelsFromRow = async (transformation) => {
    const rowId = transformation._id ?? transformation.id;
    const baseId = getTransformationBaseProductId(transformation);
    const variantId = getTransformationTargetVariantId(transformation);
    if (!variantId) {
      showErrorToast('This row has no variant id — cannot load labels.');
      return;
    }
    setPrintingLabelsRowId(rowId);
    try {
      const res = await fetchVariantById(variantId).unwrap();
      const variant = res?.variant ?? res?.data?.variant ?? res;
      const base = baseId
        ? products.find((p) => String(p._id ?? p.id) === String(baseId))
        : null;
      const rows = buildLabelPrinterRows(base, variant);
      if (rows.length === 0) {
        showErrorToast('No label data available for this transformation.');
        return;
      }
      setBarcodePrintQueue(rows);
    } catch (error) {
      handleApiError(error, 'ProductTransformations');
    } finally {
      setPrintingLabelsRowId(null);
    }
  };

  const getTransformationNumber = (t) => t.transformationNumber ?? t.transformation_number ?? '';
  const getBaseProductName = (t) => t.baseProduct?.name ?? t.base_product_name ?? '';
  const getTargetVariantName = (t) => t.targetVariant?.displayName ?? t.target_variant_name ?? '';
  const getBaseStockBefore = (t) => t.baseProductStockBefore ?? t.base_product_stock_before ?? 0;
  const getBaseStockAfter = (t) => t.baseProductStockAfter ?? t.base_product_stock_after ?? 0;
  const getVariantStockBefore = (t) => t.variantStockBefore ?? t.variant_stock_before ?? 0;
  const getVariantStockAfter = (t) => t.variantStockAfter ?? t.variant_stock_after ?? 0;
  const getUnitCost = (t) => t.unitTransformationCost ?? t.unit_transformation_cost ?? 0;
  const getTotalCost = (t) => t.totalTransformationCost ?? t.total_transformation_cost ?? 0;
  const getTransformationDate = (t) => t.transformationDate ?? t.created_at ?? t.updated_at;
  const getStatus = (t) => t.status ?? 'completed';
  const getPerformedBy = (t) => {
    const pb = t.performedBy;
    if (!pb) return '';
    return [pb.firstName, pb.lastName].filter(Boolean).join(' ').trim() || '-';
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="p-3 sm:p-5 xl:p-6 2xl:p-8">
      <div className="mb-4 xl:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold text-gray-900">Product Transformations</h1>
            <p className="mt-0.5 xl:mt-1 text-xs sm:text-sm xl:text-base text-gray-600">Convert base products to variants and track transformations</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="default"
            size="default"
            className="flex items-center justify-center gap-1.5 xl:gap-2 w-full sm:w-auto text-sm min-h-[2rem] xl:min-h-9"
          >
            <Plus className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
            New Transformation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 xl:p-4 mb-4 xl:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 xl:gap-3 2xl:gap-4">
          <div className="relative">
            <Search className="absolute left-2 xl:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 xl:h-4 xl:w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search transformations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 xl:pl-10 w-full text-sm min-h-[2rem] xl:min-h-9"
            />
          </div>
          <ProductSearchableSelect
            placeholder="All products — search to filter by base"
            products={products}
            value={selectedBaseProduct}
            onValueChange={setSelectedBaseProduct}
            loading={productsLoading}
            allowClear
            className="w-full"
          />
          <ValidatedSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="w-full"
          />
          <Button
            onClick={() => refetch()}
            variant="secondary"
            size="default"
            className="flex items-center justify-center gap-1.5 xl:gap-2 w-full sm:w-auto text-sm min-h-[2rem] xl:min-h-9"
          >
            <RefreshCw className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Transformations Table */}
      {transformationsLoading ? (
        <LoadingSpinner />
      ) : transformations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No transformations found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4">Get started by creating a new product transformation.</p>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="default"
            size="default"
          >
            New Transformation
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Transformation #</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Base Product</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Target Variant</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-left text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-2 py-1.5 xl:px-4 xl:py-2 2xl:px-6 2xl:py-3 text-right text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transformations.map((transformation) => {
                  const tStatus = getStatus(transformation);
                  const canCancel = tStatus === 'pending' || tStatus === 'in_progress';
                  return (
                  <tr key={transformation._id ?? transformation.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap">
                      <div className="text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-900">
                        {getTransformationNumber(transformation)}
                      </div>
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap">
                      <div className="text-[10px] xl:text-xs 2xl:text-sm text-gray-900">
                        {getBaseProductName(transformation)}
                      </div>
                      <div className="text-[10px] xl:text-xs text-gray-500">
                        Stock: {getBaseStockBefore(transformation)} → {getBaseStockAfter(transformation)}
                      </div>
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap">
                      <div className="text-[10px] xl:text-xs 2xl:text-sm text-gray-900">
                        {getTargetVariantName(transformation)}
                      </div>
                      <div className="text-[10px] xl:text-xs text-gray-500">
                        Stock: {getVariantStockBefore(transformation)} → {getVariantStockAfter(transformation)}
                      </div>
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap text-[10px] xl:text-xs 2xl:text-sm text-gray-900">
                      {transformation.quantity}
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap text-[10px] xl:text-xs 2xl:text-sm text-gray-900">
                      {Number(getUnitCost(transformation)).toFixed(2)}
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-900">
                      {Number(getTotalCost(transformation)).toFixed(2)}
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap text-[10px] xl:text-xs 2xl:text-sm text-gray-500">
                      {new Date(getTransformationDate(transformation)).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap text-[10px] xl:text-xs 2xl:text-sm text-gray-500">
                      {getPerformedBy(transformation)}
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap">
                      <span className={`px-1.5 xl:px-2 py-0.5 xl:py-1 text-[10px] xl:text-xs font-semibold rounded-full ${
                        tStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        tStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        tStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tStatus}
                      </span>
                    </td>
                    <td className="px-2 py-2 xl:px-4 xl:py-3 2xl:px-6 2xl:py-4 whitespace-nowrap text-right text-[10px] xl:text-xs 2xl:text-sm font-medium">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        {tStatus !== 'cancelled' && getTransformationTargetVariantId(transformation) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="Print barcode labels for base product and target variant"
                            onClick={() => handlePrintLabelsFromRow(transformation)}
                            disabled={printingLabelsRowId === (transformation._id ?? transformation.id)}
                            className="text-[10px] xl:text-xs min-h-[1.75rem] xl:min-h-8"
                          >
                            <Printer className="h-3 w-3 xl:h-3.5 xl:w-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Labels</span>
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelTransformation(transformation._id ?? transformation.id)}
                            disabled={isCancelling}
                            className="text-[10px] xl:text-xs min-h-[1.75rem] xl:min-h-8"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transformation Modal */}
      {isModalOpen && (
        <TransformationModal
          products={products}
          productsLoading={productsLoading}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={() => {
            refetch();
          }}
          onOpenBarcodePrint={(items) => setBarcodePrintQueue(items)}
        />
      )}

      {barcodePrintQueue && (
        <BarcodeLabelPrinter
          isOpen={!!barcodePrintQueue}
          products={barcodePrintQueue}
          onClose={() => setBarcodePrintQueue(null)}
          modalTitle="Print product / variant barcode labels"
        />
      )}
    </div>
  );
};

// Transformation Modal Component
const TransformationModal = ({ products, productsLoading, isOpen, onClose, onSuccess, onOpenBarcodePrint }) => {
  const [formData, setFormData] = useState({
    baseProduct: '',
    targetVariant: '',
    quantity: 1,
    unitTransformationCost: 0,
    notes: '',
    /** Not sent to API — used only for printed labels (variant row). */
    optionalBarcode: '',
  });
  const [selectedBaseProductData, setSelectedBaseProductData] = useState(null);
  const [selectedVariantData, setSelectedVariantData] = useState(null);
  /** Only reset variant when the user changes base product — not when `products` refetches (that was clearing state mid-request). */
  const prevBaseProductIdRef = React.useRef('');

  const { data: variantsData, isFetching: variantsForBaseLoading } = useGetVariantsByBaseProductQuery(
    formData.baseProduct,
    { skip: !formData.baseProduct }
  );

  const selectableVariants = React.useMemo(() => {
    const raw = variantsData?.data?.variants ?? variantsData?.variants ?? [];
    const list = Array.isArray(raw) ? [...raw] : [];
    list.sort((a, b) => {
      const la = (
        a.displayName ??
        a.display_name ??
        a.variantName ??
        a.variant_name ??
        ''
      )
        .toString()
        .toLowerCase();
      const lb = (
        b.displayName ??
        b.display_name ??
        b.variantName ??
        b.variant_name ??
        ''
      )
        .toString()
        .toLowerCase();
      return la.localeCompare(lb);
    });
    return list;
  }, [variantsData]);

  React.useEffect(() => {
    if (!formData.baseProduct) {
      setSelectedBaseProductData(null);
      prevBaseProductIdRef.current = '';
      return;
    }
    const product = products.find(
      (p) => String(p._id ?? p.id) === String(formData.baseProduct)
    );
    setSelectedBaseProductData(product);

    if (prevBaseProductIdRef.current !== formData.baseProduct) {
      const prevId = prevBaseProductIdRef.current;
      prevBaseProductIdRef.current = formData.baseProduct;
      if (prevId !== '') {
        setFormData((prev) => ({ ...prev, targetVariant: '', optionalBarcode: '' }));
      }
    }
  }, [formData.baseProduct, products]);

  React.useEffect(() => {
    if (formData.targetVariant) {
      const variant = selectableVariants.find(
        (v) => String(v._id ?? v.id) === String(formData.targetVariant)
      );
      setSelectedVariantData(variant);
      if (variant) {
        const cost = getEffectiveVariantTransformationCost(variant, selectedBaseProductData);
        setFormData(prev => ({ ...prev, unitTransformationCost: cost }));
      }
    } else {
      setSelectedVariantData(null);
    }
  }, [formData.targetVariant, selectableVariants, selectedBaseProductData]);

  const [createTransformation, { isLoading: isSubmitting }] = useCreateTransformationMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.baseProduct) {
        showErrorToast('Please select a base product.');
        return;
      }
      if (!formData.targetVariant) {
        showErrorToast('Please select a target variant.');
        return;
      }
      const baseSnap = selectedBaseProductData;
      const variantSnap = selectedVariantData;
      const labelOpts = { optionalVariantBarcode: formData.optionalBarcode };
      await createTransformation({
        baseProduct: formData.baseProduct,
        targetVariant: formData.targetVariant,
        quantity: formData.quantity,
        unitTransformationCost: formData.unitTransformationCost,
        notes: formData.notes,
      }).unwrap();
      let rows = buildLabelPrinterRows(baseSnap, variantSnap, labelOpts);
      if (rows.length === 0) {
        const p = products.find(
          (x) => String(x._id ?? x.id) === String(formData.baseProduct)
        );
        const v = selectableVariants.find(
          (x) => String(x._id ?? x.id) === String(formData.targetVariant)
        );
        rows = buildLabelPrinterRows(p, v, labelOpts);
      }
      if (rows.length > 0 && typeof onOpenBarcodePrint === 'function') {
        onOpenBarcodePrint(rows);
      }
      showSuccessToast('Transformation completed successfully');
      onClose();
      onSuccess();
      setFormData({
        baseProduct: '',
        targetVariant: '',
        quantity: 1,
        unitTransformationCost: 0,
        notes: '',
        optionalBarcode: '',
      });
    } catch (error) {
      handleApiError(error, 'ProductTransformations');
    }
  };

  // Calculate total cost
  const totalCost = formData.quantity * formData.unitTransformationCost;

  const availableStock = selectedBaseProductData?.inventory?.currentStock
    ?? selectedBaseProductData?.stockQuantity
    ?? selectedBaseProductData?.stock_quantity
    ?? 0;

  const labelPrinterProducts = React.useMemo(
    () =>
      buildLabelPrinterRows(selectedBaseProductData, selectedVariantData, {
        optionalVariantBarcode: formData.optionalBarcode,
      }),
    [selectedBaseProductData, selectedVariantData, formData.optionalBarcode]
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Product Transformation"
      maxWidth="2xl"
      variant="centered"
    >
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ProductSearchableSelect
            label="Base Product"
            placeholder="Search base product…"
            products={products}
            value={formData.baseProduct}
            onValueChange={(id) =>
              setFormData((prev) => ({ ...prev, baseProduct: id, optionalBarcode: '' }))
            }
            loading={productsLoading}
            className="w-full"
          />

          {formData.baseProduct && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-5 flex items-start space-x-4">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-primary-100">
                  <Package className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Available Inventory</p>
                  <p className="text-sm font-bold text-slate-900">
                    {availableStock} units available for transformation
                  </p>
                </div>
              </div>

              <VariantSearchableSelect
                label="Target Variant"
                placeholder="Search variant for this product…"
                variants={selectableVariants}
                value={formData.targetVariant}
                onValueChange={(id) =>
                  setFormData((prev) => ({ ...prev, targetVariant: id, optionalBarcode: '' }))
                }
                loading={!!formData.baseProduct && variantsForBaseLoading}
                className="w-full"
              />

              {!variantsForBaseLoading && selectableVariants.length === 0 && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 flex items-start space-x-4">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                    No variants found for this product. Please create a variant first in the Product Management module.
                  </p>
                </div>
              )}

              {formData.targetVariant && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ValidatedInput
                      name="transformationQuantity"
                      label="Quantity to Transform"
                      type="number"
                      value={formData.quantity < 1 ? 1 : formData.quantity}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setFormData({
                          ...formData,
                          quantity: Number.isFinite(n) && n >= 1 ? n : 1,
                        });
                      }}
                      min="1"
                      {...(availableStock > 0 ? { max: availableStock } : {})}
                      required
                    />

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Label Barcode (Optional)
                      </label>
                      <Input
                        type="text"
                        autoComplete="off"
                        value={formData.optionalBarcode}
                        onChange={(e) => setFormData({ ...formData, optionalBarcode: e.target.value })}
                        className="rounded-xl border-gray-200"
                        placeholder="Leave blank for default"
                      />
                    </div>
                  </div>

                  {formData.quantity > availableStock && availableStock >= 0 && (
                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 flex items-start space-x-4">
                      <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                      <p className="text-xs font-bold text-rose-700">
                        Insufficient stock. Available: {availableStock}, Requested: {formData.quantity}
                      </p>
                    </div>
                  )}

                  {selectedVariantData && labelPrinterProducts.length > 0 && (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identification Mapping</h3>
                        <button
                          type="button"
                          onClick={() => onOpenBarcodePrint?.(labelPrinterProducts)}
                          className="flex items-center space-x-2 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Generate Labels</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Base Identifier</p>
                          <p className="text-xs font-bold text-slate-900">
                            {selectedBaseProductData?.barcode ? `BC: ${selectedBaseProductData.barcode}` : 'No Barcode'}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Variant Identifier</p>
                          <p className="text-xs font-bold text-slate-900">
                            {formData.optionalBarcode?.trim() ? `BC: ${formData.optionalBarcode.trim()}` : selectedVariantData.barcode ? `BC: ${selectedVariantData.barcode}` : 'No Barcode'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ValidatedInput
              label="Unit Transformation Cost"
              type="number"
              value={formData.unitTransformationCost}
              onChange={(e) => setFormData({ ...formData, unitTransformationCost: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
            />
            <div className="bg-slate-900 p-5 rounded-2xl flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Batch Cost</p>
              <p className="text-xl font-black text-white">Rs. {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {selectedVariantData && (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Variant Reference Cost: Rs. {getEffectiveVariantTransformationCost(selectedVariantData, selectedBaseProductData).toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    unitTransformationCost: getEffectiveVariantTransformationCost(selectedVariantData, selectedBaseProductData),
                  })
                }
                className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
              >
                Apply Default
              </button>
            </div>
          )}

          <div className="pt-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Audit Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="rounded-2xl border-gray-200"
              placeholder="Record batch details or processing notes..."
            />
          </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || formData.quantity > availableStock || !formData.baseProduct || !formData.targetVariant}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {isSubmitting ? <LoadingSpinner size="sm" /> : 'Execute Transformation'}
                </Button>
              </div>
            </form>
          </div>
        </BaseModal>
      );
    };

export default ProductTransformations;


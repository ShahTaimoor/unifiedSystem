import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Tag,
  X,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import {
  useGetVariantsQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} from '../store/services/productVariantsApi';
import { useGetProductsQuery } from '../store/services/productsApi';
import { ProductSearchableSelect } from '../components/ProductSearchableSelect';
import { handleApiError, showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { LoadingSpinner, LoadingButton, LoadingInline } from '../components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmationDialog } from '../components/ConfirmationDialog';
import { useDeleteConfirmation } from '../hooks/useConfirmation';
import ValidatedInput, { ValidatedSelect } from '../components/ValidatedInput';
import { PageHeader } from '../components/layout/PageHeader';
import { useFormValidation } from '../hooks/useFormValidation';
import BaseModal from '../components/BaseModal';

const ProductVariants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBaseProduct, setSelectedBaseProduct] = useState('');
  const [variantTypeFilter, setVariantTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // Fetch variants
  const { data: variantsData, isLoading: variantsLoading, refetch } = useGetVariantsQuery({
    baseProduct: selectedBaseProduct || undefined,
    variantType: variantTypeFilter || undefined,
    search: searchTerm || undefined
  });

  // Full catalog for pickers (API default limit is 20 without explicit limit)
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery(
    {
      limit: 10000,
      listMode: 'minimal',
    },
    { refetchOnMountOrArgChange: true }
  );

  const variants = variantsData?.variants || variantsData?.data?.variants || [];
  const products = productsData?.products || productsData?.data?.products || [];

  const getBaseProductName = (variant) => {
    const baseProductId = variant.baseProduct?._id ?? variant.baseProduct ?? variant.base_product_id ?? variant.baseProductId;
    if (!baseProductId) return null;
    const product = products.find(
      (p) => String(p._id ?? p.id) === String(baseProductId)
    );
    return product?.name ?? product?.productName ?? null;
  };

  // Normalize variant fields (backend returns snake_case from Postgres)
  const getVariantDisplayName = (v) => v.displayName ?? v.display_name ?? '';
  const getVariantType = (v) => v.variantType ?? v.variant_type ?? '';
  const getVariantValue = (v) => v.variantValue ?? v.variant_value ?? '';
  const getVariantStatus = (v) => {
    if (v.status) return v.status;
    const isActive = v.is_active ?? v.isActive;
    return isActive === false ? 'inactive' : 'active';
  };
  const getVariantStock = (v) => v.inventory?.currentStock ?? v.inventory_data?.current_stock ?? v.inventory?.current_stock ?? v.inventory_data?.currentStock ?? 0;
  const getVariantRetail = (v) => v.pricing?.retail ?? v.pricing?.wholesale ?? 0;
  const getVariantTransformationCost = (v) => v.transformationCost ?? v.transformation_cost ?? 0;

  // Delete mutation
  const [deleteVariant, { isLoading: isDeleting }] = useDeleteVariantMutation();

  const handleDelete = async (id) => {
    try {
      await deleteVariant(id).unwrap();
      showSuccessToast('Variant deleted successfully');
      refetch();
    } catch (error) {
      handleApiError(error, 'ProductVariants');
    }
  };

  const { isDeleteDialogOpen, itemToDelete, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteConfirmation(
    handleDelete
  );

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVariant(null);
  };

  const variantTypes = [
    { value: '', label: 'All Types' },
    { value: 'color', label: 'Color' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'size', label: 'Size' },
    { value: 'finish', label: 'Finish' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        className="mb-6"
        title="Product Variants"
        subtitle="Manage product variants and transformations"
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="default"
            size="default"
            className="flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search variants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
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
            value={variantTypeFilter}
            onChange={(e) => setVariantTypeFilter(e.target.value)}
            options={variantTypes}
            className="w-full"
          />
        </div>
      </div>

      {/* Variants Table */}
      {variantsLoading ? (
        <LoadingSpinner />
      ) : variants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No variants found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4">Get started by creating a new product variant.</p>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="default"
            size="default"
          >
            Add Variant
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Product</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant Name</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retail Price</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transformation Cost</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variants.map((variant) => (
                  <tr key={variant._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {getBaseProductName(variant) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">{getVariantDisplayName(variant)}</div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getVariantType(variant)}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {getVariantValue(variant)}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {getVariantStock(variant)}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {Number(getVariantRetail(variant)).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {Number(getVariantTransformationCost(variant)).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        getVariantStatus(variant) === 'active' ? 'bg-green-100 text-green-800' :
                        getVariantStatus(variant) === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getVariantStatus(variant)}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(variant)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(variant._id || variant.id, getVariantDisplayName(variant))}
                          className="text-red-600 hover:text-red-900 p-1"
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
        </div>
      )}

      {/* Variant Modal */}
      {isModalOpen && (
        <VariantModal
          variant={editingVariant}
          products={products}
          productsLoading={productsLoading}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.name || ''}
        itemType="variant"
      />
    </div>
  );
};

// Variant Modal Component
const VariantModal = ({ variant, products, productsLoading, isOpen, onClose, onSuccess }) => {
  const [createVariant, { isLoading: isCreating }] = useCreateVariantMutation();
  const [updateVariant, { isLoading: isUpdating }] = useUpdateVariantMutation();
  const [formData, setFormData] = useState({
    baseProduct: '',
    variantName: '',
    variantType: 'color',
    variantValue: '',
    displayName: '',
    description: '',
    pricing: {
      cost: 0,
      retail: 0,
      wholesale: 0,
      distributor: 0
    },
    transformationCost: 0,
    sku: '',
    status: 'active'
  });

  React.useEffect(() => {
    if (variant) {
      const status = variant.status ?? (variant.is_active === false ? 'inactive' : 'active');
      setFormData({
        baseProduct: variant.baseProduct?._id ?? variant.base_product_id ?? variant.baseProductId ?? variant.baseProduct ?? '',
        variantName: variant.variantName ?? variant.variant_name ?? '',
        variantType: variant.variantType ?? variant.variant_type ?? 'color',
        variantValue: variant.variantValue ?? variant.variant_value ?? '',
        displayName: variant.displayName ?? variant.display_name ?? '',
        description: variant.description ?? '',
        pricing: variant.pricing ?? { cost: 0, retail: 0, wholesale: 0, distributor: 0 },
        transformationCost: variant.transformationCost ?? variant.transformation_cost ?? 0,
        sku: variant.sku ?? '',
        status
      });
    } else {
      setFormData({
        baseProduct: '',
        variantName: '',
        variantType: 'color',
        variantValue: '',
        displayName: '',
        description: '',
        pricing: { cost: 0, retail: 0, wholesale: 0, distributor: 0 },
        transformationCost: 0,
        sku: '',
        status: 'active'
      });
    }
  }, [variant, isOpen]);

  // Auto-generate variant name from variantValue when creating new variant
  React.useEffect(() => {
    if (formData.variantValue && !variant) {
      const trimmedValue = formData.variantValue.trim();
      const trimmedName = formData.variantName?.trim() || '';
      if (trimmedValue && (!trimmedName || trimmedName === '')) {
        setFormData(prev => ({ ...prev, variantName: trimmedValue }));
      }
    }
  }, [formData.variantValue, variant]);

  React.useEffect(() => {
    if (formData.baseProduct && formData.variantValue) {
      const baseProduct = products.find(p => String(p._id ?? p.id) === String(formData.baseProduct));
      if (baseProduct && !variant) {
        setFormData(prev => ({ ...prev, displayName: `${baseProduct.name} - ${formData.variantValue}` }));
      }
    }
  }, [formData.baseProduct, formData.variantValue, products, variant]);

  React.useEffect(() => {
    if (formData.baseProduct && !variant) {
      const baseProduct = products.find(p => String(p._id ?? p.id) === String(formData.baseProduct));
      if (baseProduct) {
        setFormData(prev => ({
          ...prev,
          pricing: {
            cost: baseProduct.pricing.cost + prev.transformationCost,
            retail: baseProduct.pricing.retail + prev.transformationCost,
            wholesale: baseProduct.pricing.wholesale + prev.transformationCost,
            distributor: baseProduct.pricing.distributor ? baseProduct.pricing.distributor + prev.transformationCost : 0
          }
        }));
      }
    }
  }, [formData.baseProduct, formData.transformationCost, products, variant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.baseProduct) {
        showErrorToast('Please select a base product.');
        return;
      }
      const finalVariantName = (formData.variantName || '').trim() || (formData.variantValue || '').trim();
      if (!finalVariantName) {
        showErrorToast('Variant name is required.');
        return;
      }

      const submitData = { ...formData, variantName: finalVariantName };

      if (variant) {
        await updateVariant({ id: variant._id, ...submitData }).unwrap();
        showSuccessToast('Variant updated successfully');
      } else {
        await createVariant(submitData).unwrap();
        showSuccessToast('Variant created successfully');
      }
      onClose();
      onSuccess();
    } catch (error) {
      handleApiError(error, 'ProductVariants');
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={variant ? 'Refine Variant' : 'Engineer New Variant'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-2 w-6 bg-primary-600 rounded-full" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Base Integration</h3>
          </div>
          
          <div className="space-y-4">
            <ProductSearchableSelect
              label="Parent Product Catalog"
              placeholder="Select base identity..."
              products={products}
              value={formData.baseProduct}
              onValueChange={(id) => setFormData({ ...formData, baseProduct: id })}
              loading={productsLoading}
              disabled={!!variant}
              className="w-full"
            />

            <div className="grid grid-cols-2 gap-4">
              <ValidatedSelect
                label="Variant Schema"
                value={formData.variantType}
                onChange={(e) => setFormData({ ...formData, variantType: e.target.value })}
                options={[
                  { value: 'color', label: 'Color' },
                  { value: 'warranty', label: 'Warranty' },
                  { value: 'size', label: 'Size' },
                  { value: 'finish', label: 'Finish' },
                  { value: 'custom', label: 'Custom' }
                ]}
                required
                disabled={!!variant}
              />
              <ValidatedInput
                label="Attribute Value"
                type="text"
                value={formData.variantValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData(prev => {
                    const shouldUpdateName = !prev.variantName || prev.variantName === prev.variantValue;
                    return { ...prev, variantValue: newValue, variantName: shouldUpdateName ? newValue : prev.variantName };
                  });
                }}
                placeholder="e.g. Matte Black"
                required
                disabled={!!variant}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-2 w-6 bg-gray-400 rounded-full" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Naming & Identity</h3>
          </div>
          
          <div className="space-y-4">
            <ValidatedInput
              label="System Name"
              type="text"
              value={formData.variantName}
              onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
              placeholder="Internal reference name"
              required
            />
            <ValidatedInput
              label="Customer Display Label"
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="What customers see on receipt/portal"
              required
            />
            <ValidatedInput
              label="Asset SKU (Global Identifier)"
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="Leave blank for auto-generation"
              className="font-mono"
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-6 text-white space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="grid grid-cols-2 gap-6 relative z-10">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Retail Valuation</label>
              <Input
                type="number"
                value={formData.pricing.retail}
                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, retail: parseFloat(e.target.value) || 0 }})}
                className="rounded-xl h-12 bg-white/10 border-white/20 text-white font-mono font-bold"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Wholesale Valuation</label>
              <Input
                type="number"
                value={formData.pricing.wholesale}
                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, wholesale: parseFloat(e.target.value) || 0 }})}
                className="rounded-xl h-12 bg-white/10 border-white/20 text-white font-mono font-bold"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="relative z-10">
            <label className="block text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2 px-1">Transformation Overhead (Per Unit)</label>
            <div className="relative">
              <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
              <Input
                type="number"
                value={formData.transformationCost}
                onChange={(e) => setFormData({ ...formData, transformationCost: parseFloat(e.target.value) || 0 })}
                className="pl-11 rounded-xl h-14 bg-primary-600/20 border-primary-500/30 text-white font-mono font-bold text-lg"
                step="0.01"
                required
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic px-1">Added to base cost to calculate final valuation.</p>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button type="button" onClick={onClose} variant="outline" className="flex-1 h-14 rounded-2xl border-gray-200 font-bold text-gray-600" disabled={isSubmitting}>Discard</Button>
          <Button type="submit" className="flex-[2] h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-500/20 font-bold" disabled={isSubmitting}>
            {isSubmitting ? <LoadingInline className="text-white" /> : (variant ? 'Commit Updates' : 'Initialize Variant')}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default ProductVariants;


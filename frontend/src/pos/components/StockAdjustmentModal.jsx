import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Package, AlertTriangle } from 'lucide-react';
import BaseModal from './BaseModal';
import { useFormValidation } from '../hooks/useFormValidation';
import { validateRequired, validatePositiveNumber } from '../utils/validation';
import { LoadingButton } from './LoadingSpinner';
import { handleApiError, showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { useGetProductsQuery } from '../store/services/productsApi';
import { useCreateStockAdjustmentMutation } from '../store/services/inventoryApi';
import { SearchableDropdown } from './SearchableDropdown';
import { formatCurrency } from '../utils/formatters';
import { Button } from '@/pos/components/ui/button';
import { Input } from '@/pos/components/ui/input';
import { Textarea } from '@/pos/components/ui/textarea';

const StockAdjustmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState('physical_count');
  const [adjustments, setAdjustments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setError,
    clearError
  } = useFormValidation(
    {
      reason: '',
      warehouse: 'Main Warehouse',
      notes: '',
    },
    {
      reason: (value) => validateRequired(value, 'Reason') || null,
    }
  );

  // Fetch products for search
  const { data: productsResponse, isLoading: productsLoading } = useGetProductsQuery(
    { search: productSearchTerm, limit: 20 },
    {
      skip: productSearchTerm.length === 0,
    }
  );

  const products = productsResponse?.data?.products || productsResponse?.products || [];

  // Create stock adjustment mutation
  const [createStockAdjustment, { isLoading: creating }] = useCreateStockAdjustmentMutation();

  const resetModal = () => {
    resetForm();
    setAdjustmentType('physical_count');
    setAdjustments([]);
    setSelectedProduct(null);
    setProductSearchTerm('');
    setIsAddingProduct(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setIsAddingProduct(true);
    
    // Check if product already exists in adjustments
    const existingAdjustment = adjustments.find(adj => adj.product._id === product._id);
    if (existingAdjustment) {
      showErrorToast('Product is already in the adjustment list');
      setIsAddingProduct(false);
      return;
    }
  };

  const addProductToAdjustment = (currentStock, adjustedStock) => {
    if (!selectedProduct) return;
    
    const variance = adjustedStock - currentStock;
    
    const newAdjustment = {
      product: selectedProduct,
      currentStock,
      adjustedStock,
      variance,
      cost: selectedProduct.pricing?.cost || 0,
      notes: '',
    };
    
    setAdjustments(prev => [...prev, newAdjustment]);
    setSelectedProduct(null);
    setIsAddingProduct(false);
    setProductSearchTerm('');
  };

  const removeAdjustment = (productId) => {
    setAdjustments(prev => prev.filter(adj => adj.product._id !== productId));
  };

  const updateAdjustment = (productId, field, value) => {
    setAdjustments(prev => prev.map(adj => {
      if (adj.product._id === productId) {
        const updated = { ...adj, [field]: value };
        if (field === 'adjustedStock') {
          updated.variance = value - adj.currentStock;
        }
        return updated;
      }
      return adj;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (adjustments.length === 0) {
      showErrorToast('Please add at least one product to adjust');
      return;
    }
    
    const formErrors = validateForm();
    if (Object.values(formErrors).some(e => e !== null)) {
      showErrorToast('Please correct the form errors');
      return;
    }
    
    const adjustmentData = {
      type: adjustmentType,
      reason: values.reason,
      warehouse: values.warehouse,
      notes: values.notes,
      adjustments: adjustments.map(adj => ({
        product: adj.product._id,
        currentStock: adj.currentStock,
        adjustedStock: adj.adjustedStock,
        cost: adj.cost,
        notes: adj.notes,
      })),
    };
    
    createStockAdjustment(adjustmentData)
      .unwrap()
      .then(() => {
        showSuccessToast('Stock adjustment request created successfully');
        onSuccess();
        resetModal();
      })
      .catch((error) => {
        handleApiError(error, 'Stock Adjustment Creation');
      });
  };

  const normalizeCategoryLabel = (category) => {
    if (!category) return 'N/A';
    if (typeof category === 'string') return category;
    if (typeof category === 'object') {
      if (React.isValidElement(category)) {
        return 'N/A';
      }

      const candidateFields = [
        'label',
        'name',
        'displayName',
        'title',
        'fullName',
        'code',
        'id',
        '_id'
      ];

      for (const field of candidateFields) {
        if (category[field]) {
          const value = category[field];
          if (typeof value === 'string') {
            return value;
          }
        }
      }
    }

    return 'N/A';
  };

  const getProductPrice = (product) => {
    if (!product) return null;

    const candidates = [
      product.price,
      product.defaultPrice,
      product.sellingPrice,
      product.cost,
      product.pricing?.retail,
      product.pricing?.sellingPrice,
      product.pricing?.wholesale,
      product.pricing?.price,
      product.pricing?.cost
    ];

    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined) continue;
      if (typeof candidate === 'number' && !Number.isNaN(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string') {
        const parsed = parseFloat(candidate);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  };

  const formatProductPrice = (product) => {
    const price = getProductPrice(product);
    if (price === null) return 'Price: —';
    const formatted = formatCurrency(price) || '';
    return `Price: ${formatted || '—'}`;
  };

  const productDisplayKey = (product) => (
    <div className="flex items-center gap-3 text-sm text-gray-700 w-full">
      <span className="font-semibold text-gray-900 truncate">{product.name}</span>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 text-xs text-gray-500 text-right">
        <span>Category: {normalizeCategoryLabel(product.category)}</span>
        <span className="text-gray-300">•</span>
        <span>Stock: {product.inventory?.currentStock ?? 0}</span>
        <span className="text-gray-300">•</span>
        <span>{formatProductPrice(product)}</span>
      </div>
    </div>
  );

  const totalVariance = adjustments.reduce((sum, adj) => sum + adj.variance, 0);
  const totalCostImpact = adjustments.reduce((sum, adj) => sum + (adj.variance * adj.cost), 0);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Stock Adjustment"
      maxWidth="4xl"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <LoadingButton
            type="button"
            onClick={handleSubmit}
            isLoading={creating}
            variant="default"
          >
            Create Adjustment Request
          </LoadingButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Adjustment Type and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="select bg-white/50 backdrop-blur-sm border-gray-200/50"
            >
              <option value="physical_count">Physical Count</option>
              <option value="damage">Damage</option>
              <option value="theft">Theft</option>
              <option value="transfer">Transfer</option>
              <option value="correction">Correction</option>
              <option value="return">Return</option>
              <option value="write_off">Write Off</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse
            </label>
            <Input
              type="text"
              name="warehouse"
              value={values.warehouse}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Warehouse location"
              className="bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="reason"
            value={values.reason}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${errors.reason ? 'border-red-500 bg-red-50/20' : 'bg-white/50 backdrop-blur-sm'}`}
            placeholder="Enter reason for adjustment"
          />
          {errors.reason && <p className="text-red-600 text-xs mt-1">{errors.reason}</p>}
        </div>

        {/* Add Products */}
        <div className="bg-blue-50/30 backdrop-blur-sm rounded-xl p-4 border border-blue-100/50 shadow-sm">
          <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Products
          </label>
          <SearchableDropdown
            placeholder="Search products to adjust..."
            items={products}
            onSelect={handleProductSelect}
            onSearch={setProductSearchTerm}
            displayKey={productDisplayKey}
            loading={productsLoading}
            emptyMessage="No products found"
            className="bg-white/50"
          />
        </div>

        {/* Product Adjustment Form */}
        {isAddingProduct && selectedProduct && (
          <div className="bg-orange-50/40 backdrop-blur-md p-5 rounded-xl border border-orange-200/40 shadow-inner animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-orange-900 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Adjust Stock: {selectedProduct.name}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setIsAddingProduct(false);
                }}
                className="text-orange-400 hover:text-orange-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1 uppercase tracking-wider">
                  Current Stock
                </label>
                <Input
                  type="number"
                  value={selectedProduct.inventory?.currentStock || 0}
                  className="bg-white/30 border-orange-200/30 text-orange-900 font-bold"
                  disabled
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1 uppercase tracking-wider">
                  New Stock Level
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter new level"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const adjustedStock = parseFloat(e.target.value) || 0;
                      addProductToAdjustment(
                        selectedProduct.inventory?.currentStock || 0,
                        adjustedStock
                      );
                    }
                  }}
                  autoFocus
                  className="bg-white border-orange-300 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="mt-5 flex space-x-3">
              <Button
                type="button"
                onClick={() => {
                  const adjustedStock = document.querySelector('input[placeholder="Enter new level"]').value;
                  addProductToAdjustment(
                    selectedProduct.inventory?.currentStock || 0,
                    parseFloat(adjustedStock) || 0
                  );
                }}
                variant="default"
                className="flex-1 bg-orange-600 hover:bg-orange-700 shadow-md"
              >
                Add to List
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setIsAddingProduct(false);
                }}
                variant="secondary"
                className="bg-white/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Adjustments List */}
        {adjustments.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center px-1">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
              Pending Adjustments ({adjustments.length})
            </h4>
            <div className="space-y-3">
              {adjustments.map((adjustment) => (
                <div key={adjustment.product._id} className="bg-white/40 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100/50 rounded-lg group-hover:bg-blue-50/50 transition-colors">
                        <Package className="h-5 w-5 text-gray-500 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block leading-tight">
                          {adjustment.product.name}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                          {normalizeCategoryLabel(adjustment.product.category)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdjustment(adjustment.product._id)}
                      className="text-gray-300 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Current</label>
                      <div className="p-2 bg-gray-50/50 rounded-lg text-sm font-medium border border-gray-100/50">
                        {adjustment.currentStock}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Adjusted</label>
                      <Input
                        type="number"
                        min="0"
                        value={adjustment.adjustedStock}
                        onChange={(e) => updateAdjustment(adjustment.product._id, 'adjustedStock', parseFloat(e.target.value) || 0)}
                        className="h-9 text-sm font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Variance</label>
                      <div className={`p-2 rounded-lg text-sm font-bold border ${
                        adjustment.variance >= 0 
                          ? 'text-green-600 bg-green-50/50 border-green-100/50' 
                          : 'text-red-600 bg-red-50/50 border-red-100/50'
                      }`}>
                        {adjustment.variance >= 0 ? '+' : ''}{adjustment.variance}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Impact</label>
                      <div className={`p-2 rounded-lg text-sm font-bold border ${
                        adjustment.variance * adjustment.cost >= 0 
                          ? 'text-green-600 bg-green-50/50 border-green-100/50' 
                          : 'text-red-600 bg-red-50/50 border-red-100/50'
                      }`}>
                        ${(adjustment.variance * adjustment.cost).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Card */}
        {adjustments.length > 0 && (
          <div className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-2xl text-white shadow-xl border border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Total Impact Summary</h4>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Products</div>
                <div className="text-2xl font-bold">{adjustments.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Variance</div>
                <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalVariance >= 0 ? '+' : ''}{totalVariance}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cost Impact</div>
                <div className={`text-2xl font-bold ${totalCostImpact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${Math.abs(totalCostImpact).toFixed(2)}
                  <span className="text-xs ml-1 font-normal opacity-60">
                    {totalCostImpact >= 0 ? 'Gain' : 'Loss'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Additional Notes
          </label>
          <Textarea
            name="notes"
            value={values.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={2}
            placeholder="Optional comments for this adjustment request..."
            className="bg-white/50 border-gray-200/50 focus:bg-white transition-all"
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default StockAdjustmentModal;

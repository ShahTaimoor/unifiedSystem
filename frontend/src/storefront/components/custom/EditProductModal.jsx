import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Edit, Star, Upload as UploadIcon, Trash2 } from 'lucide-react';

const EditProductModal = ({
  showEditModal,
  selectedProduct,
  editFormData,
  editCategorySearch,
  filteredCategories,
  editPreviewImage,
  isUpdating,
  onClose,
  onSubmit,
  onFormDataChange,
  onCategoryChange,
  onCategorySearchChange,
  onFileChange,
  onPreviewImageChange
}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate on change
  useEffect(() => {
    const validateForm = async () => {
      if (Object.keys(touched).length > 0) {
        try {
          const { productSchema } = await import('@/storefront/schemas/productSchemas');
          if (productSchema && typeof productSchema.safeParse === 'function') {
            // Ensure price and stock are strings for validation (schema expects strings)
            const validationData = {
              ...editFormData,
              price: String(editFormData.price || ''),
              stock: String(editFormData.stock || ''),
              picture: editFormData.picture || editPreviewImage || ''
            };
            
            const result = productSchema.safeParse(validationData);
            if (result && !result.success) {
              const newErrors = {};
              // Safely access error.errors
              if (result.error && result.error.errors) {
                const errors = result.error.errors;
                if (Array.isArray(errors) && errors.length > 0) {
                  for (let i = 0; i < errors.length; i++) {
                    const err = errors[i];
                    if (err && err.path && Array.isArray(err.path) && err.path.length > 0 && err.message) {
                      newErrors[err.path[0]] = err.message;
                    }
                  }
                }
              }
              setErrors(newErrors);
            } else if (result && result.success) {
              setErrors({});
            }
          }
        } catch (error) {
          setErrors({});
        }
      }
    };
    
    validateForm();
  }, [editFormData, editPreviewImage, touched]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange({ ...editFormData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Mark all fields as touched
    setTouched({
      title: true,
      description: true,
      price: true,
      stock: true,
      category: true
    });

    try {
      // Dynamically import schema to ensure it's loaded
      const { productSchema } = await import('@/storefront/schemas/productSchemas');
      
      if (!productSchema || typeof productSchema.safeParse !== 'function') {
        // If schema is not available, proceed with submission (backend will validate)
        onSubmit(e);
        return;
      }

      // Ensure price and stock are strings for validation (schema expects strings)
      const validationData = {
        ...editFormData,
        price: String(editFormData.price || ''),
        stock: String(editFormData.stock || ''),
        picture: editFormData.picture || editPreviewImage || ''
      };
      
      const result = productSchema.safeParse(validationData);
      
      if (result && !result.success) {
        const newErrors = {};
        // Safely access error.errors
        if (result.error && result.error.errors) {
          const errors = result.error.errors;
          if (Array.isArray(errors) && errors.length > 0) {
            for (let i = 0; i < errors.length; i++) {
              const err = errors[i];
              if (err && err.path && Array.isArray(err.path) && err.path.length > 0 && err.message) {
                newErrors[err.path[0]] = err.message;
              }
            }
          }
        }
        setErrors(newErrors);
        // Still proceed with submission - backend will validate
        // User can see errors but can still try to submit
        onSubmit(e);
        return;
      }

      // Validation passed, proceed with submission
      onSubmit(e);
    } catch (error) {
      // If validation fails, still try to submit (let backend handle validation)
      onSubmit(e);
    }
  };

  if (!showEditModal || !selectedProduct) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-100 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Product</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Update product details</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 rounded-full h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-sm font-semibold text-gray-700">
                  Product Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={editFormData.title}
                  onChange={handleChange}
                  onBlur={() => handleBlur('title')}
                  placeholder="Enter product title"
                  className={`h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg ${
                    errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                />
                {errors.title && touched.title && (
                  <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-sm font-semibold text-gray-700">
                  Price (PKR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  value={editFormData.price}
                  onChange={handleChange}
                  onBlur={() => handleBlur('price')}
                  placeholder="0.00"
                  className={`h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg ${
                    errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                />
                {errors.price && touched.price && (
                  <p className="text-xs text-red-500 mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-sm font-semibold text-gray-700">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={editFormData.category} onValueChange={(value) => {
                onCategoryChange(value);
                if (errors.category) {
                  setErrors((prev) => ({ ...prev, category: '' }));
                }
                handleBlur('category');
              }}>
                <SelectTrigger className={`h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 ${
                  errors.category ? 'border-red-500' : ''
                }`}>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search categories..."
                      value={editCategorySearch}
                      onChange={(e) => onCategorySearchChange(e.target.value)}
                      className="mb-2 h-8 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {Array.isArray(filteredCategories) && filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id} className="py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No categories available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.category && touched.category && (
                <p className="text-xs text-red-500 mt-1">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={editFormData.description}
                onChange={handleChange}
                onBlur={() => handleBlur('description')}
                placeholder="Describe your product..."
                rows={4}
                className={`border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg resize-none min-h-[100px] ${
                  errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                }`}
              />
              {errors.description && touched.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit-stock" className="text-sm font-semibold text-gray-700">
                  Stock Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-stock"
                  name="stock"
                  type="number"
                  value={editFormData.stock}
                  onChange={handleChange}
                  onBlur={() => handleBlur('stock')}
                  placeholder="Enter stock quantity"
                  className={`h-10 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg ${
                    errors.stock ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                />
                {errors.stock && touched.stock && (
                  <p className="text-xs text-red-500 mt-1">{errors.stock}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-picture" className="text-sm font-semibold text-gray-700">
                  Product Image
                </Label>
                <label
                  htmlFor="edit-picture"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition duration-200 group"
                >
                  <div className="flex flex-col items-center gap-1 group-hover:scale-105 transition-transform">
                    <UploadIcon className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
                    <span className="text-gray-500 text-xs font-medium group-hover:text-blue-600">Click to upload</span>
                  </div>
                  <Input
                    type="file"
                    id="edit-picture"
                    name="picture"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </label>
                {editPreviewImage && (
                  <div className="relative mt-2 w-full h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={editPreviewImage}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...editFormData, picture: '' };
                        onFormDataChange(updated);
                        if (onPreviewImageChange) {
                          onPreviewImageChange('');
                        }
                      }}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-full p-1.5 shadow-sm transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <input
                type="checkbox"
                id="edit-isFeatured"
                name="isFeatured"
                checked={editFormData.isFeatured || false}
                onChange={(e) => onFormDataChange({ ...editFormData, isFeatured: e.target.checked })}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <Label htmlFor="edit-isFeatured" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
                <Star className={`h-4 w-4 ${editFormData.isFeatured ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                <span>Mark as Featured Product</span>
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Update Product
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;


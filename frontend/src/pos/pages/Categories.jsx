import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  X,
  UploadCloud
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner, LoadingButton, LoadingCard, LoadingGrid, LoadingPage } from '../components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DeleteConfirmationDialog } from '../components/ConfirmationDialog';
import { useDeleteConfirmation } from '../hooks/useConfirmation';

import {
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUploadCategoryImageMutation,
} from '../store/services/categoriesApi';
import PaginationControls from '../components/PaginationControls';
import { flattenCategoryApiTree } from '../utils/categoryTree';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import PageShell from '../components/PageShell';

import BaseModal from '../components/BaseModal';

const CategoryModal = ({ category, isOpen, onClose, onSave, isSubmitting, categories = [], categoryType = 'parent' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    sortOrder: 0,
    isActive: true,
    image: ''
  });

  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parentCategory: category.parentCategory?._id || '',
        sortOrder: category.sortOrder || 0,
        isActive: category.isActive !== undefined ? category.isActive : true,
        image: category.image || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parentCategory: '',
        sortOrder: 0,
        isActive: true,
        image: ''
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const [uploadImage, { isLoading: isUploading }] = useUploadCategoryImageMutation();
  const fileInputRef = React.useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await uploadImage(formData).unwrap();
      if (response.success) {
        setFormData(prev => ({ ...prev, image: response.data.urls.optimized }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to upload image');
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Category name is required';
    if (!category && categoryType === 'child' && !formData.parentCategory) newErrors.parentCategory = 'Parent category is required for child categories';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : (categoryType === 'parent' ? 'Add New Parent Category' : 'Add New Child Category')}
      maxWidth="md"
      variant="centered"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Primary Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase px-1">Category Name *</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
                  className={`pl-11 py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 transition-all ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                />
              </div>
              {errors.name && <p className="text-[10px] font-bold text-red-500 px-1 uppercase tracking-tighter">{errors.name}</p>}
            </div>

            {/* Image Upload Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase px-1">Category Image</label>
              <div className="flex items-center space-x-4">
                <div 
                  className={`relative w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all overflow-hidden bg-gray-50 group ${
                    formData.image ? 'border-primary-500' : 'border-gray-200 hover:border-primary-400'
                  }`}
                >
                  {formData.image ? (
                    <>
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button" 
                          onClick={removeImage}
                          className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center space-y-1 text-gray-400 group-hover:text-primary-500"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <UploadCloud className="h-6 w-6" />
                          <span className="text-[10px] font-bold uppercase">Upload</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-bold text-gray-700">Category Visualization</p>
                  <p className="text-[10px] text-gray-400 font-medium">Recommended: Square image, max 10MB.</p>
                  {!formData.image && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase"
                    >
                      Select Image
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase px-1">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description..."
                className="bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 transition-all resize-none p-4 h-24"
              />
            </div>

            {/* Parent Selection Logic */}
            {(!category && categoryType === 'child') || category ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Parent Category {categoryType === 'child' && '*'}</label>
                <div className="relative">
                  <Folder className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="parentCategory"
                    value={formData.parentCategory}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
                  >
                    <option value="">{category ? 'No parent (Top level)' : 'Select a parent category'}</option>
                    {categories
                      .filter(cat => !category || cat._id !== category._id)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                  </select>
                </div>
                {errors.parentCategory && <p className="text-[10px] font-bold text-red-500 px-1 uppercase tracking-tighter">{errors.parentCategory}</p>}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Sort Order</label>
                <Input
                  name="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={handleChange}
                  className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-bold text-center"
                />
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center group cursor-pointer">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    formData.isActive ? 'bg-primary-600 border-primary-600' : 'border-gray-200 bg-white group-hover:border-primary-400'
                  }`}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="hidden"
                      id="isActive"
                    />
                    {formData.isActive && <FolderOpen className="h-4 w-4 text-white" />}
                  </div>
                  <label htmlFor="isActive" className="ml-3 cursor-pointer">
                    <p className="text-sm font-bold text-gray-700">Active</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Visibility Status</p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-end space-x-4">
          <button type="button" variant="ghost" className="px-8 font-bold text-gray-400 hover:text-gray-600" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <Button type="submit" variant="default" className="px-10 rounded-2xl font-bold shadow-lg shadow-primary-600/20 active:scale-95 transition-all" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner size="sm" /> : (category ? 'Update Category' : 'Create Category')}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryType, setCategoryType] = useState('parent'); // 'parent' or 'child'
  const [searchParams] = useSearchParams();

  // Auto-open modal if URL has action=add parameter
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsModalOpen(true);
      // Clean up the URL parameter
      const url = new URL(window.location);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams]);

  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch } = useGetCategoriesQuery(
    { search: debouncedSearch, page, limit: 50 },
    { refetchOnMountOrArgChange: 120 }
  );

  const { data: modalTree } = useGetCategoryTreeQuery(undefined, {
    skip: !isModalOpen,
    refetchOnMountOrArgChange: 300,
  });

  const modalCategoryList = useMemo(() => {
    const roots = Array.isArray(modalTree) ? modalTree : [];
    return flattenCategoryApiTree(roots);
  }, [modalTree]);

  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const { confirmation, confirmDelete, handleConfirm, handleCancel } = useDeleteConfirmation();

  const handleDelete = (category) => {
    confirmDelete(category.name, 'Category', async () => {
      try {
        await deleteCategory(category._id).unwrap();
        toast.success('Category deleted successfully');
        refetch();
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to delete category');
      }
    });
  };

  const handleSave = (data) => {
    // Clean the data before sending to API
    const cleanData = {
      ...data,
      parentCategory: data.parentCategory === '' ? undefined : data.parentCategory,
      sortOrder: parseInt(data.sortOrder) || 0,
      isActive: Boolean(data.isActive)
    };
    
    if (selectedCategory) {
      updateCategory({ id: selectedCategory._id, ...cleanData })
        .unwrap()
        .then(() => {
          toast.success('Category updated successfully');
          setIsModalOpen(false);
          setSelectedCategory(null);
          refetch();
        })
        .catch((error) => {
          toast.error(error?.data?.message || 'Failed to update category');
        });
    } else {
      createCategory(cleanData)
        .unwrap()
        .then(() => {
          toast.success('Category created successfully');
          setIsModalOpen(false);
          setSelectedCategory(null);
          refetch();
        })
        .catch((error) => {
          const validationErrors = error?.data?.errors;
          if (validationErrors) {
            toast.error(`Validation failed: ${Object.values(validationErrors).join(', ')}`);
          } else {
            toast.error(error?.data?.message || 'Failed to create category');
          }
        });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setCategoryType('parent'); // Reset to default
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger-600">Failed to load categories</p>
      </div>
    );
  }

  // Backend returns: { categories: [], pagination: {} }
  const categories = data?.categories || data?.data?.categories || [];
  const pagination = data?.pagination || data?.data?.pagination || {};

  if (isLoading && !data) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header with Add Category Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage your product categories</p>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setCategoryType('parent');
                setIsModalOpen(true);
              }}
              variant="default"
              size="lg"
              className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
            >
              <FolderOpen className="h-5 w-5 mr-2" />
              Add Parent Category
            </Button>
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setCategoryType('child');
                setIsModalOpen(true);
              }}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
            >
              <Folder className="h-5 w-5 mr-2" />
              Add Child Category
            </Button>
          </div>
        </div>
      </div>



      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-red-600">Error loading categories: {error.message}</p>
          <Button
            onClick={() => refetch()}
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Tag className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No categories found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first category.'}
          </p>
          <p className="mt-2 text-xs text-gray-400">Total in database: {pagination?.total || 0}</p>
          <Button
            onClick={() => refetch()}
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Refresh
          </Button>
          {!searchTerm && (
            <div className="mt-6">
              <Button
                onClick={() => {
                  setCategoryType('parent');
                  setIsModalOpen(true);
                }}
                variant="default"
                size="lg"
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <FolderOpen className="h-5 w-5 mr-2" />
                Add Your First Parent Category
              </Button>
              <p className="mt-3 text-xs text-gray-400">
                💡 Tip: Start with parent categories (like "Electronics"), then add subcategories
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Image</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-3">Category Name</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Parent</div>
              <div className="col-span-1">Sort</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Image */}
                  <div className="col-span-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                      {category.image ? (
                        <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Type Icon */}
                  <div className="col-span-1">
                    {category.parentCategory ? (
                      <Folder className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FolderOpen className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                  
                  {/* Category Name */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{category.name}</h3>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="col-span-3">
                    <p className="text-sm text-gray-600 truncate">
                      {category.description || '-'}
                    </p>
                  </div>
                  
                  {/* Parent Category */}
                  <div className="col-span-1">
                    <span className="text-xs text-gray-500">
                      {category.parentCategory ? category.parentCategory.name : '-'}
                    </span>
                  </div>
                  
                  {/* Sort Order */}
                  <div className="col-span-1">
                    <span className="text-xs text-gray-500">{category.sortOrder}</span>
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      category.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-primary-600 hover:text-primary-800 p-1"
                        title="Edit category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-danger-600 hover:text-danger-800 p-1"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <PaginationControls
            page={page}
            totalPages={Math.max(1, pagination?.pages || 1)}
            onPageChange={setPage}
            totalItems={pagination?.total}
            limit={pagination?.limit || 50}
            className="rounded-b-lg"
          />
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        category={selectedCategory}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        isSubmitting={creating || updating}
        categories={modalCategoryList}
        categoryType={categoryType}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        itemName={confirmation.message?.match(/"([^"]*)"/)?.[1] || ''}
        itemType={confirmation.message?.split(' ')[1] || ''}
      />
    </div>
  );
};

export default Categories;

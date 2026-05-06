import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { usePagination } from '@/storefront/hooks/use-pagination';
import { useDebounce } from '@/storefront/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import OneLoader from '../ui/OneLoader';
import Pagination from './Pagination';
import ProductHeader from './ProductHeader';
import ProductStats from './ProductStats';
import ProductFilters from './ProductFilters';
import BulkActionsBar from './BulkActionsBar';
import ProductCardAdmin from './ProductCardAdmin';
import EmptyProductsState from './EmptyProductsState';
import ImagePreviewModal from './ImagePreviewModal';
import CreateProductModal from './CreateProductModal';
import EditProductModal from './EditProductModal';

import { AddProduct, deleteSingleProduct, fetchProducts, updateProductStock, getSingleProduct, updateSingleProduct, bulkUpdateFeatured, searchProducts, clearSearchResults, importProductsFromExcel } from '@/storefront/redux/slices/products/productSlice';
import { AllCategory } from '@/storefront/redux/slices/categories/categoriesSlice';
import { useToast } from '@/storefront/hooks/use-toast';

const AllProducts = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { products, status, totalItems, searchResults, searchStatus, searchQuery: reduxSearchQuery } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const toast = useToast();

  // Get page number from URL params if available
  const searchParams = new URLSearchParams(location.search);
  const urlPage = searchParams.get('page');
  const initialPage = urlPage ? parseInt(urlPage, 10) : 1;

  // Local state for filters
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('az'); // Default to alphabetical (A-Z) sorting, same as user side
  const [limit, setLimit] = useState(24);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Use pagination hook
  const pagination = usePagination({
    initialPage: initialPage,
    initialLimit: limit,
    totalItems,
    onPageChange: (page) => {
      setCurrentPage(page);
    }
  });

  const pageSizeOptions = [24, 48, 72, 100];

  // Local state for UI-specific functionality
  const [categorySearch, setCategorySearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [gridType, setGridType] = useState('grid2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    picture: '',
    isFeatured: false,
  });
  const [editPreviewImage, setEditPreviewImage] = useState('');
  const [editCategorySearch, setEditCategorySearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProductFromSearch, setSelectedProductFromSearch] = useState(null);
  
  // Ref for file input
  const excelFileImportRef = useRef(null);

  // Debounce category search to avoid too many API calls
  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  const debouncedEditCategorySearch = useDebounce(editCategorySearch, 300);

  // Memoized combined categories - backend handles filtering, so we just combine with "All"
  const combinedCategories = useMemo(() => [
    { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
    ...(Array.isArray(categories) ? categories : [])
  ], [categories]);

  // Categories are now filtered by backend - no client-side filtering needed
  // Ensure filteredCategories is always an array
  const filteredCategories = Array.isArray(combinedCategories) ? combinedCategories : [];

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: ''
  });

  
  // Fetch categories - initial load
  useEffect(() => {
    dispatch(AllCategory(''));
  }, [dispatch]);


  // Fetch categories from backend when search term changes (debounced)
  useEffect(() => {
    dispatch(AllCategory(debouncedCategorySearch));
  }, [dispatch, debouncedCategorySearch]);


  // Fetch categories for edit modal when search term changes (debounced)
  useEffect(() => {
    if (showEditModal) {
      dispatch(AllCategory(debouncedEditCategorySearch));
    }
  }, [dispatch, debouncedEditCategorySearch, showEditModal]);


  // Fetch products when filters change
  useEffect(() => {
    dispatch(fetchProducts({ category, page: currentPage, limit, stockFilter, sortBy }));
  }, [dispatch, category, currentPage, limit, stockFilter, sortBy]);


  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);


  // Products are fully filtered and sorted on the backend
  // Show search results if searching, otherwise show regular products
  const sortedProducts = useMemo(() => {
    let productList = [];
    

    // If a specific product was selected from search suggestions, show only that product
    if (selectedProductFromSearch) {
      productList = [selectedProductFromSearch].filter(product => product && product._id);
    } else if (hasSearched && searchResults && searchResults.length > 0) {
      productList = searchResults.filter(product => product && product._id);
    } else {
      productList = products.filter(product => product && product._id);
    }
    

    // Remove duplicates by _id to prevent React key warnings
    const uniqueProducts = [];
    const seenIds = new Set();
    

    for (const product of productList) {
      const productId = product._id?.toString();
      if (productId && !seenIds.has(productId)) {
        seenIds.add(productId);
        uniqueProducts.push(product);
      }
    }
  
    
    return uniqueProducts;
  }, [products, searchResults, hasSearched, selectedProductFromSearch]);


  // Get deduplicated search results count for accurate display
  const uniqueSearchResultsCount = useMemo(() => {
    if (!hasSearched || !searchResults || searchResults.length === 0) return 0;
    

    const seenIds = new Set();
    let count = 0;
    

    for (const product of searchResults) {
      const productId = product._id?.toString();
      if (productId && !seenIds.has(productId)) {
        seenIds.add(productId);
        count++;
      }
    }
  
    
    return count;
  }, [searchResults, hasSearched]);


  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    

    // Validate with Zod
    const { productSchema } = await import('@/storefront/schemas/productSchemas');
    const result = productSchema.safeParse({
      ...formData,
      category: 'all', // Default category for now
      picture: '',
      isFeatured: false
    });
    

    if (!result.success) {
      const errors = {};
      // Safely access error.errors
      if (result.error && result.error.errors && Array.isArray(result.error.errors)) {
        result.error.errors.forEach((err) => {
          if (err && err.path && Array.isArray(err.path) && err.path.length > 0 && err.message) {
            errors[err.path[0]] = err.message;
          }
        });
      }
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }
    

    setIsSubmitting(true);
    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataObj.append(key, formData[key]);
        }
      });

      await dispatch(AddProduct(formDataObj)).unwrap();
      setShowCreateForm(false);


      setFormData({ title: '', description: '', price: '', stock: '' });
      toast.success('Product created successfully!');
    } catch (error) {
      toast.error(error || 'Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, formData, isSubmitting, toast]);


  // Handle product deletion
  const handleDelete = useCallback(async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteSingleProduct(productId)).unwrap();
        toast.success('Product deleted successfully!');
      } catch (error) {
        toast.error(error || 'Failed to delete product. Please try again.');
      }
    }
  }, [dispatch, toast]);


  // Handle edit product - open modal instead of navigating
  const handleEdit = useCallback(async (product) => {
    try {
      setSelectedProduct(product);
      setShowEditModal(true);
      // Fetch full product details
      const result = await dispatch(getSingleProduct(product._id)).unwrap();
      if (result?.product) {
        const prod = result.product;
        setEditFormData({
          title: prod.title || '',
          description: prod.description || '',
          // Convert numbers to strings for form inputs
          price: prod.price !== undefined && prod.price !== null ? String(prod.price) : '',
          stock: prod.stock !== undefined && prod.stock !== null ? String(prod.stock) : '',
          category: prod.category?._id || prod.category || '',
          picture: '',
          isFeatured: prod.isFeatured || false,
        });
        setEditPreviewImage(prod.picture?.secure_url || prod.image || '');
      }
    } catch (error) {
    }
  }, [dispatch]);


  // Handle edit form submission
  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUpdating) {
      return;
    }
    
    if (!selectedProduct) {
      toast.error('No product selected');
      return;
    }
    
    // Validation is already done in EditProductModal, so we can proceed directly
    setIsUpdating(true);
    try {
      // Create FormData for file upload
      const formDataObj = new FormData();
      
      // Always append required fields - ensure proper data types
      if (editFormData.title) {
        formDataObj.append('title', String(editFormData.title).trim());
      }
      if (editFormData.description) {
        formDataObj.append('description', String(editFormData.description).trim());
      }
      if (editFormData.price !== '' && editFormData.price !== null && editFormData.price !== undefined) {
        // Ensure price is a number
        const price = parseFloat(editFormData.price);
        if (!isNaN(price)) {
          formDataObj.append('price', price);
        }
      }
      if (editFormData.stock !== '' && editFormData.stock !== null && editFormData.stock !== undefined) {
        // Ensure stock is an integer
        const stock = parseInt(editFormData.stock, 10);
        if (!isNaN(stock)) {
          formDataObj.append('stock', stock);
        }
      }
      if (editFormData.category) {
        formDataObj.append('category', String(editFormData.category));
      }
      if (editFormData.isFeatured !== undefined && editFormData.isFeatured !== null) {
        formDataObj.append('isFeatured', Boolean(editFormData.isFeatured));
      }
      
      // Handle picture - only append if it's a File object (new image uploaded)
      if (editFormData.picture instanceof File) {
        formDataObj.append('picture', editFormData.picture);
      }

      await dispatch(updateSingleProduct({ 
        id: selectedProduct._id, 
        inputValues: formDataObj 
      })).unwrap();

      // Redux slice will update the product in the state automatically
      // No need to refetch - the update happens immediately
      // Force a small delay to ensure Redux state is updated before closing modal
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setShowEditModal(false);
      setSelectedProduct(null);
      setEditFormData({
        title: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        picture: '',
        isFeatured: false,
      });
      setEditPreviewImage('');
    
      toast.success('Product updated successfully!');
    } catch (error) {
      // Extract error message properly
      const errorMessage = error?.response?.data?.message || error?.message || error || 'Failed to update product. Please try again.';
      toast.error(errorMessage);
      // Don't close modal on error so user can fix and retry
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch, editFormData, editPreviewImage, isUpdating, selectedProduct, pagination, category, limit, stockFilter, sortBy, hasSearched, searchQuery, toast]);


  // Handle edit form change

  const handleEditChange = useCallback((e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === 'file') {
      const file = files[0];
      setEditFormData((prev) => ({ ...prev, [name]: file }));
      setEditPreviewImage(URL.createObjectURL(file));
    } else if (type === 'checkbox') {
      setEditFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // Handle edit category change
  const handleEditCategoryChange = useCallback((value) => {
    setEditFormData((prev) => ({ ...prev, category: value }));
    setEditCategorySearch('');
  }, []);

  // Handle stock toggle
  const handleStockToggle = useCallback(async (product) => {
    try {
      const newStock = product.stock > 0 ? 0 : 1;
      await dispatch(updateProductStock({ 
        id: product._id, 
        stock: newStock 
      })).unwrap();
      toast.success(`Product stock updated to ${newStock}`);
    } catch (error) {
      toast.error(error || 'Failed to update product stock');
    }
  }, [dispatch, toast]);


  // Handle page change using pagination hook
  const handlePageChange = useCallback((page) => {
    pagination.setCurrentPage(page);
  }, [pagination]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    // Clear category search
    setCategorySearch('');
    
    // Clear search results and search query when category changes
    dispatch(clearSearchResults());
    setSearchQuery('');
    setHasSearched(false);
    
    // Update category and reset page
    setCategory(categoryId);
    setCurrentPage(1);
  }, [dispatch]);


  const handleGridTypeChange = useCallback((type) => {
    setGridType(type);
  }, []);

  const handlePreviewImage = useCallback((image) => {
    setPreviewImage(image);
  }, []);

  // Handle product selection
  const handleProductSelect = useCallback((productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === sortedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(sortedProducts.map(p => p._id));
    }
  }, [selectedProducts.length, sortedProducts]);


  // Handle bulk mark as featured
  const handleBulkMarkFeatured = useCallback(async (isFeatured) => {
    if (selectedProducts.length === 0) {
      return;
    }

    setIsBulkUpdating(true);
    try {
      await dispatch(bulkUpdateFeatured({ 
        productIds: selectedProducts, 
        isFeatured 
      })).unwrap();
      
      setSelectedProducts([]);
      
      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({ 
        category, 
        page: currentPage, 
        limit, 
        stockFilter, 
        sortBy 
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }

      toast.success(`${selectedProducts.length} product(s) ${isFeatured ? 'marked as featured' : 'unmarked as featured'} successfully!`);
    } catch (error) {
      toast.error(error || 'Failed to update products');
    } finally {
      setIsBulkUpdating(false);
    }
  }, [dispatch, selectedProducts, pagination.currentPage, category, limit, stockFilter, sortBy, toast, hasSearched, searchQuery]);

  const handleBulkStockUpdate = useCallback(async (stockValue) => {
    if (selectedProducts.length === 0) {
      return;
    }

    setIsBulkUpdating(true);
    try {
      await Promise.all(
        selectedProducts.map((productId) =>
          dispatch(updateProductStock({ id: productId, stock: stockValue })).unwrap()
        )
      );

      setSelectedProducts([]);

      const currentPage = pagination.currentPage;
      
      // Refetch products
      await dispatch(fetchProducts({
        category,
        page: currentPage, 
        limit,
        stockFilter,
        sortBy
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }

      toast.success(`Stock updated for ${selectedProducts.length} product(s)!`);
    } catch (error) {
      toast.error(error || 'Failed to update stock');
    } finally {
      setIsBulkUpdating(false);
    }
  }, [dispatch, pagination.currentPage, selectedProducts, category, limit, stockFilter, sortBy, toast, hasSearched, searchQuery]);

  // Get category display name
  const getCategoryDisplayName = useCallback(() => {
    if (category === 'all') return 'All';
    const selectedCategory = categories?.find(cat => cat._id === category);
    return selectedCategory?.name || 'Category';
  }, [category, categories]);

  // Get sort display name
  const getSortDisplayName = useCallback(() => {
    const sortLabels = {
      'az': 'Name A-Z',
      'za': 'Name Z-A',
      'price-low': 'Price Low-High',
      'price-high': 'Price High-Low',
      'newest': 'Newest First',
      'oldest': 'Oldest First',
      'stock-high': 'Stock High-Low',
      'stock-low': 'Stock Low-High'
    };
    return sortLabels[sortBy] || 'Sort';
  }, [sortBy]);

  // Get stock filter display name
  const getStockDisplayName = useCallback(() => {
    if (stockFilter === 'all') return 'All Products';
    if (stockFilter === 'active') return 'In Stock';
    return 'Out of Stock';
  }, [stockFilter]);

  // Handle export products to CSV
  const handleExportProducts = useCallback(() => {
    try {
      // Get products to export - use sortedProducts which includes search results if in search mode
      let productsToExport = [];
      
      if (hasSearched && searchResults && searchResults.length > 0) {
        productsToExport = searchResults.filter(product => product && product._id);
      } else {
        productsToExport = products.filter(product => product && product._id);
      }

      if (productsToExport.length === 0) {
        toast.error('No products to export');
        return;
      }

      // Create CSV headers
      const headers = ['Title', 'Description', 'Price', 'Stock', 'Category', 'Featured', 'Image URL'];
      
      // Create CSV rows
      const csvRows = productsToExport.map(product => {
        const row = [
          product.title || '',
          (product.description || '').replace(/"/g, '""'), // Escape quotes in CSV
          product.price || '0',
          product.stock || '0',
          product.category?.name || '',
          product.isFeatured ? 'Yes' : 'No',
          product.picture?.secure_url || product.image || ''
        ];
        // Wrap each field in quotes and join with commas
        return row.map(field => `"${field}"`).join(',');
      });

      // Combine headers and rows
      const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...csvRows
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${productsToExport.length} product(s) successfully!`);
    } catch (error) {
      toast.error('Failed to export products. Please try again.');
    }
  }, [products, searchResults, hasSearched, toast]);

  // Handle import products from Excel
  const handleExcelImport = useCallback(async (file) => {
    if (!file) {
      toast.error('Please select an Excel file to import');
      return;
    }

    setImportLoading(true);
    try {
      const result = await dispatch(importProductsFromExcel(file)).unwrap();
      
      if (result.success) {
        setExcelFile(null);
        // Reset file input using ref
        if (excelFileImportRef.current) {
          excelFileImportRef.current.value = '';
        }
        
        // Refresh products list
        const currentPage = pagination.currentPage;
        await dispatch(fetchProducts({ 
          category, 
          page: currentPage, 
          limit, 
          stockFilter,
          sortBy
        }));

        toast.success(`Successfully imported ${result.count || 0} product(s) from Excel`);
      }
    } catch (error) {
      toast.error(error || 'Failed to import products from Excel');
    } finally {
      setImportLoading(false);
    }
  }, [dispatch, pagination.currentPage, category, limit, stockFilter, sortBy, toast]);

  // Handle file selection for import
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
      // Automatically trigger import when file is selected
      handleExcelImport(file);
    }
  }, [handleExcelImport]);

  // Handle inline price edit
  const handleStartEditPrice = useCallback((product) => {
    setEditingPriceId(product._id);
    setEditingPriceValue(product.price?.toString() || '');
  }, []);

  const handleCancelEditPrice = useCallback(() => {
    setEditingPriceId(null);
    setEditingPriceValue('');
  }, []);

  const handleSavePrice = useCallback(async (productId) => {
    if (!editingPriceValue || isNaN(editingPriceValue) || parseFloat(editingPriceValue) < 0) {
      return;
    }

    setIsUpdatingPrice(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('price', editingPriceValue);

      await dispatch(updateSingleProduct({ 
        id: productId, 
        inputValues: formDataObj 
      })).unwrap();
      
      setEditingPriceId(null);
      setEditingPriceValue('');
      
      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({ 
        category, 
        page: currentPage, 
        limit, 
        stockFilter,
        sortBy
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }
    } catch (error) {
    } finally {
      setIsUpdatingPrice(false);
    }
  }, [dispatch, editingPriceValue, pagination.currentPage, category, limit, stockFilter, sortBy, hasSearched, searchQuery]);

  // Handle inline stock edit
  const handleStartEditStock = useCallback((product) => {
    setEditingStockId(product._id);
    setEditingStockValue(product.stock?.toString() || '');
  }, []);

  const handleCancelEditStock = useCallback(() => {
    setEditingStockId(null);
    setEditingStockValue('');
  }, []);

  const handleSaveStock = useCallback(async (productId) => {
    if (
      editingStockValue === '' ||
      isNaN(editingStockValue) ||
      parseInt(editingStockValue, 10) < 0
    ) {
      return;
    }

    setIsUpdatingStock(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('stock', editingStockValue);

      await dispatch(
        updateSingleProduct({
          id: productId,
          inputValues: formDataObj,
        })
      ).unwrap();

      setEditingStockId(null);
      setEditingStockValue('');

      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({
        category,
        page: currentPage, 
        limit,
        stockFilter,
        sortBy,
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }
    } catch (error) {
    } finally {
      setIsUpdatingStock(false);
    }
  }, [dispatch, editingStockValue, currentPage, category, limit, stockFilter, sortBy, hasSearched, searchQuery]);

  // Handle toggle featured status
  const handleToggleFeatured = useCallback(async (product) => {
    setIsUpdatingFeatured(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('isFeatured', !product.isFeatured);

      await dispatch(updateSingleProduct({ 
        id: product._id, 
        inputValues: formDataObj 
      })).unwrap();
      
      // Refresh products list
      const currentPage = pagination.currentPage;
      await dispatch(fetchProducts({ 
        category, 
        page: currentPage, 
        limit, 
        stockFilter,
        sortBy
      }));

      // If in search mode, also refresh search results
      if (hasSearched && searchQuery) {
        await dispatch(searchProducts({ query: searchQuery, limit: 100 }));
      }

      toast.success(`Product ${!product.isFeatured ? 'marked as featured' : 'unmarked as featured'} successfully!`);
    } catch (error) {
      toast.error(error || 'Failed to update featured status');
    } finally {
      setIsUpdatingFeatured(false);
    }
  }, [dispatch, pagination.currentPage, category, limit, stockFilter, sortBy, hasSearched, searchQuery, toast]);

  const handleLimitChange = useCallback((value) => {
    const newLimit = parseInt(value, 10);
    if (!Number.isNaN(newLimit)) {
      setLimit(newLimit);
      setCurrentPage(1);
    }
  }, []);

  // Search handlers
  const handleSearch = useCallback((query) => {
    const trimmedQuery = query ? query.trim() : searchQuery.trim();
    if (trimmedQuery.length === 0) {
      setHasSearched(false);
      return;
    }
    setSearchQuery(trimmedQuery);
    setHasSearched(true);
    dispatch(searchProducts({ query: trimmedQuery, limit: 100 }));
  }, [searchQuery, dispatch]);

  const handleSearchSelect = useCallback((product) => {
    setSearchQuery(product.title);
    setHasSearched(true);
    setSelectedProductFromSearch(product); // Set the selected product to show only this one
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setSearchQuery(value);
    // Clear selected product and search state when value is empty
    if (!value || value.trim() === '') {
      setSelectedProductFromSearch(null);
      setHasSearched(false);
      dispatch(clearSearchResults());
    } else if (selectedProductFromSearch) {
      setSelectedProductFromSearch(null);
    }
  }, [selectedProductFromSearch, dispatch]);
  
  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setHasSearched(false);
    setSelectedProductFromSearch(null);
    dispatch(clearSearchResults());
    // Also trigger onChange to update SearchSuggestions component
    if (handleSearchChange) {
      handleSearchChange({ target: { value: '' } });
    }
  }, [dispatch, handleSearchChange]);

  const handleSearchTrigger = useCallback((query) => {
    setHasSearched(true);
    setSelectedProductFromSearch(null); // Clear selected product when doing a new search
    dispatch(searchProducts({ query, limit: 100 }));
  }, [dispatch]);

  // Only show main loader for initial loading, not for search/filter operations
  if (status === 'loading' && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <OneLoader size="large" text="Loading Products..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <ProductHeader
          onImportClick={handleFileChange}
          onExportClick={handleExportProducts}
          importLoading={importLoading}
          fileInputRef={excelFileImportRef}
        />
        
        <ProductStats
          totalItems={totalItems}
          products={products}
          categories={categories}
        />
        
        <ProductFilters
          category={category}
          stockFilter={stockFilter}
          sortBy={sortBy}
          gridType={gridType}
          categorySearch={categorySearch}
          searchQuery={searchQuery}
          filteredCategories={filteredCategories}
          onCategoryChange={handleCategorySelect}
          onStockFilterChange={(value) => { setStockFilter(value); setCurrentPage(1); }}
          onSortChange={(value) => { setSortBy(value); setCurrentPage(1); }}
          onGridTypeChange={handleGridTypeChange}
          onCategorySearchChange={setCategorySearch}
          onSearchChange={handleSearchChange}
          onSearchSelect={handleSearchSelect}
          onSearchTrigger={handleSearchTrigger}
          getCategoryDisplayName={getCategoryDisplayName}
          getStockDisplayName={getStockDisplayName}
          getSortDisplayName={getSortDisplayName}
          hasSearched={hasSearched}
          searchStatus={searchStatus}
          uniqueSearchResultsCount={uniqueSearchResultsCount}
        />
      
        <div className="space-y-4">
          <BulkActionsBar
            selectedProducts={selectedProducts}
            sortedProducts={sortedProducts}
            isBulkUpdating={isBulkUpdating}
            onSelectAll={handleSelectAll}
            onBulkStockUpdate={handleBulkStockUpdate}
            onBulkMarkFeatured={handleBulkMarkFeatured}
            onClearSelection={() => setSelectedProducts([])}
          />

          <div className={`grid gap-3 ${
            gridType === 'grid2' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {sortedProducts.map((product, index) => (
              <ProductCardAdmin
                key={product._id || `product-${index}`}
                product={product}
                index={index}
                gridType={gridType}
                isSelected={selectedProducts.includes(product._id)}
                editingPriceId={editingPriceId}
                editingPriceValue={editingPriceValue}
                editingStockId={editingStockId}
                editingStockValue={editingStockValue}
                isUpdatingPrice={isUpdatingPrice}
                isUpdatingStock={isUpdatingStock}
                isUpdatingFeatured={isUpdatingFeatured}
                onSelect={handleProductSelect}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFeatured={handleToggleFeatured}
                onStockToggle={handleStockToggle}
                onStartEditPrice={handleStartEditPrice}
                onCancelEditPrice={handleCancelEditPrice}
                onSavePrice={handleSavePrice}
                onStartEditStock={handleStartEditStock}
                onCancelEditStock={handleCancelEditStock}
                onSaveStock={handleSaveStock}
                onPreviewImage={handlePreviewImage}
                onPriceValueChange={setEditingPriceValue}
                onStockValueChange={setEditingStockValue}
              />
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white rounded border border-gray-200 p-3 sm:p-4 mt-4 sm:mt-6">
          <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-medium text-gray-900">{pagination.startItem}</span> to{' '}
              <span className="font-medium text-gray-900">{pagination.endItem}</span> of{' '}
              <span className="font-medium text-gray-900">{totalItems}</span> products
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <span>Rows:</span>
                <Select value={String(limit)} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-[80px] sm:w-[100px] h-8 sm:h-9 border-gray-200 rounded-lg text-xs sm:text-sm">
                    <SelectValue placeholder="24 items" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>

        {sortedProducts.length === 0 && (
          <EmptyProductsState
            stockFilter={stockFilter}
            onClearFilters={() => {
              setStockFilter('all');
              setCurrentPage(1);
            }}
            onCreateProduct={() => setShowCreateForm(true)}
          />
        )}

        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />

        <CreateProductModal
          showCreateForm={showCreateForm}
          formData={formData}
          isSubmitting={isSubmitting}
          onClose={() => {
            setShowCreateForm(false);
            setFormData({ title: '', description: '', price: '', stock: '' });
          }}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />

        <EditProductModal
          showEditModal={showEditModal}
          selectedProduct={selectedProduct}
          editFormData={editFormData}
          editCategorySearch={editCategorySearch}
          filteredCategories={filteredCategories}
          editPreviewImage={editPreviewImage}
          isUpdating={isUpdating}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
            setEditFormData({
              title: '',
              description: '',
              price: '',
              stock: '',
              category: '',
              picture: '',
              isFeatured: false,
            });
            setEditPreviewImage('');
          }}
          onSubmit={handleEditSubmit}
          onFormDataChange={setEditFormData}
          onCategoryChange={handleEditCategoryChange}
          onCategorySearchChange={setEditCategorySearch}
          onFileChange={(e) => {
            handleEditChange(e);
            if (e.target.files && e.target.files[0]) {
              setEditPreviewImage(URL.createObjectURL(e.target.files[0]));
            }
          }}
          onPreviewImageChange={setEditPreviewImage}
        />

      </div>
    </div>
  );
};

export default React.memo(AllProducts);

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '@/storefront/hooks/use-debounce';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import OneLoader from '../ui/OneLoader';
import { useDispatch, useSelector } from 'react-redux';
import { AllCategory } from '@/storefront/redux/slices/categories/categoriesSlice';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AddProduct, importProductsFromExcel, fetchProducts } from '@/storefront/redux/slices/products/productSlice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  FileSpreadsheet,
  Upload,
  Download,
  ImageIcon,
  X,
  Search,
  Eye,
  Zap,
  Plus,
  Package,
  DollarSign,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import LazyImage from '../ui/LazyImage';
import Pagination from '../custom/Pagination';
import { convertToWebP, getImageInfo, createPreviewUrl, revokePreviewUrl, isWebPSupported } from '@/storefront/utils/imageConverter';
import { useMedia } from '@/storefront/hooks/use-media';
import { imageService } from '@/storefront/services/imageService';
import { useToast } from '@/storefront/hooks/use-toast';

const CreateProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector((state) => state.categories);
  const { products } = useSelector((state) => state.products);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
  const [selectedMediaImage, setSelectedMediaImage] = useState(null);
  const [mediaCurrentPage, setMediaCurrentPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);
  const [mediaTotalItems, setMediaTotalItems] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionInfo, setConversionInfo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const {
    uploadedMedia,
    mediaLoading,
    fetchMedia,
  } = useMedia();

  // Refs for file inputs
  const pictureInputRef = useRef(null);
  const excelFileInputRef = useRef(null);

  // Initial input values
  const initialValues = {
    title: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    picture: null,
    isFeatured: false,
  };

  const [inputValues, setInputValues] = useState(initialValues);
  const [categorySearch, setCategorySearch] = useState('');

  // Debounce category search to avoid too many API calls
  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  // Debounce media search to avoid too many API calls
  const debouncedMediaSearchTerm = useDebounce(mediaSearchTerm, 400);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputValues((values) => ({
      ...values,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (value) => {
    setInputValues((values) => ({ ...values, category: value }));
    setCategorySearch(''); // Clear search when category is selected
  };

  const handleCategorySearch = (e) => {
    setCategorySearch(e.target.value);
  };


  // Handle image file selection and conversion
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's a supported image format
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      return;
    }

    setIsConverting(true);
    setConversionInfo(null);

    try {
      // Get original image info
      const originalInfo = await getImageInfo(file);

      // Convert to WebP if it's JPEG or PNG
      let processedFile = file;
      if (file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        processedFile = await convertToWebP(file, {
          quality: 0.85,
          maxWidth: 1200,
          maxHeight: 1200,
          maintainAspectRatio: true
        });

        // Show conversion info
        const compressionRatio = ((1 - processedFile.size / file.size) * 100).toFixed(1);
        setConversionInfo({
          original: {
            size: (file.size / 1024).toFixed(2),
            type: file.type.split('/')[1].toUpperCase()
          },
          converted: {
            size: (processedFile.size / 1024).toFixed(2),
            type: 'WEBP'
          },
          compression: compressionRatio
        });
      }

      // Create preview URL
      const newPreviewUrl = createPreviewUrl(processedFile);
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
      setPreviewUrl(newPreviewUrl);

      // Update form state
      setInputValues(prev => ({
        ...prev,
        picture: processedFile
      }));

    } catch (error) {
      // Image conversion error - handled silently, user can retry
    } finally {
      setIsConverting(false);
    }
  };

  // Categories are now filtered by backend - no client-side filtering needed
  const filteredCategories = categories || [];

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      return;
    }

    setImportLoading(true);
    try {
      const result = await dispatch(importProductsFromExcel(excelFile)).unwrap();

      if (result.success) {
        setExcelFile(null);
        // Reset file input using ref
        if (excelFileInputRef.current) {
          excelFileInputRef.current.value = '';
        }
        toast.success(`Successfully imported ${result.count || 0} products from Excel`);
      }
    } catch (error) {
      toast.error(error || 'Failed to import products from Excel');
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template with only name, stock, price
    const csvContent = "name,stock,price\nSample Product 1,10,29.99\nSample Product 2,5,15.50\nSample Product 3,20,9.99";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', inputValues.title);
    formData.append('description', inputValues.description);
    formData.append('price', inputValues.price);
    formData.append('category', inputValues.category);
    formData.append('stock', inputValues.stock);
    formData.append('isFeatured', inputValues.isFeatured);
    if (inputValues.picture) {
      formData.append('picture', inputValues.picture);
    }

    dispatch(AddProduct(formData))
      .unwrap()
      .then((response) => {
        if (response?.success) {
          setInputValues(initialValues);
          setConversionInfo(null);
          if (previewUrl) {
            revokePreviewUrl(previewUrl);
            setPreviewUrl(null);
          }
          // Reset file input to allow re-uploading using ref
          if (pictureInputRef.current) {
            pictureInputRef.current.value = '';
          }
          toast.success('Product created successfully!');
        }
        setLoading(false);
      })
      .catch((error) => {
        toast.error(error || 'Failed to create product. Please try again.');
        setLoading(false);
      });
  };

  // Fetch categories - initial load
  useEffect(() => {
    dispatch(AllCategory(''));
  }, [dispatch]);

  // Fetch categories from backend when search term changes (debounced)
  useEffect(() => {
    dispatch(AllCategory(debouncedCategorySearch));
  }, [dispatch, debouncedCategorySearch]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch products and media for media picker with pagination (debounced)
  useEffect(() => {
    if (showMediaPicker) {
      // Fetch ALL products for media picker (no limit)
      dispatch(fetchProducts({
        category: 'all',
        searchTerm: debouncedMediaSearchTerm,
        page: 1,
        limit: 1000, // Fetch all products
        stockFilter: 'active'
      }));
      // Also fetch uploaded media
      fetchMedia(1000);
    }
  }, [dispatch, showMediaPicker, debouncedMediaSearchTerm, fetchMedia]);

  // Filter products for media picker - only show products with images
  const allProductsWithImages = products?.filter(product =>
    product &&
    product._id &&
    (product.picture?.secure_url || product.image)
  ) || [];

  // Add uploaded media to the filtered results
  const mediaItems = uploadedMedia.map(media => ({
    _id: media._id || media.id,
    title: media.name || media.originalName,
    picture: { secure_url: media.url },
    isUploadedMedia: true,
    uploadedAt: media.createdAt
  }));

  // Combine product images with uploaded media
  const allMedia = [...allProductsWithImages, ...mediaItems];

  // Apply search filter
  const searchFilteredProducts = allMedia.filter(item => {
    if (!mediaSearchTerm) return true;
    const searchLower = mediaSearchTerm.toLowerCase();
    return (
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      (item.isUploadedMedia && item.title?.toLowerCase().includes(searchLower))
    );
  });

  // Apply client-side pagination
  const itemsPerPage = 20;
  const startIndex = (mediaCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredMediaProducts = searchFilteredProducts.slice(startIndex, endIndex);

  // Update pagination info when products or media change
  useEffect(() => {
    if (showMediaPicker && (products || uploadedMedia.length > 0)) {
      const totalPages = Math.max(1, Math.ceil(searchFilteredProducts.length / itemsPerPage));
      setMediaTotalPages(totalPages);
      setMediaTotalItems(searchFilteredProducts.length);
    }
  }, [products, uploadedMedia, showMediaPicker, mediaSearchTerm, mediaCurrentPage, searchFilteredProducts.length]);


  const handleMediaPageChange = (page) => {
    setMediaCurrentPage(page);
  };

  const handleMediaSearchChange = (e) => {
    setMediaSearchTerm(e.target.value);
    setMediaCurrentPage(1); // Reset to first page when searching
  };

  const handleMediaSelect = async (product) => {
    setSelectedMediaImage(product);
    setShowMediaPicker(false);

    const imageUrl = product.picture?.secure_url || product.image;
    if (imageUrl) {
      setIsConverting(true);
      setConversionInfo(null);

      try {
        // Fetch the image
        const blob = await imageService.fetchImageBlob(imageUrl);
        const file = new File([blob], `${product.title}.jpg`, { type: blob.type });

        // Convert to WebP if it's not already
        let processedFile = file;
        if (file.type.match(/^image\/(jpeg|jpg|png)$/)) {
          processedFile = await convertToWebP(file, {
            quality: 0.85,
            maxWidth: 1200,
            maxHeight: 1200,
            maintainAspectRatio: true
          });

          // Show conversion info
          const compressionRatio = ((1 - processedFile.size / file.size) * 100).toFixed(1);
          setConversionInfo({
            original: {
              size: (file.size / 1024).toFixed(2),
              type: file.type.split('/')[1].toUpperCase()
            },
            converted: {
              size: (processedFile.size / 1024).toFixed(2),
              type: 'WEBP'
            },
            compression: compressionRatio
          });
        }

        // Create preview URL
        const newPreviewUrl = createPreviewUrl(processedFile);
        if (previewUrl) {
          revokePreviewUrl(previewUrl);
        }
        setPreviewUrl(newPreviewUrl);

        // Update form state
        setInputValues(prev => ({ ...prev, picture: processedFile }));

      } catch (error) {
        // Error processing selected image - handled silently, user can retry
      } finally {
        setIsConverting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-2 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full">

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <Tabs defaultValue="single" className="w-full">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="whitespace-nowrap">Create New Products</span>
                </CardTitle>
                <TabsList className="grid grid-cols-2 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                  <TabsTrigger
                    value="single"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sm:hidden">Single</span>
                    <span className="hidden sm:inline">Single Product</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="excel"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sm:hidden">Bulk</span>
                    <span className="hidden sm:inline">Bulk Import</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-2">

              <TabsContent value="single" className="mt-4">
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Left Side - Basic Information Section */}
                    <div className="lg:col-span-2 bg-gray-50 rounded-xl p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        Basic Information
                      </h3>

                      {/* Title */}
                      <div className="space-y-2 mb-3 sm:mb-4">
                        <Label htmlFor="title" className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                          Product Title *
                        </Label>
                        <Input
                          value={inputValues.title}
                          onChange={handleChange}
                          id="title"
                          name="title"
                          placeholder="Enter product title"
                          className="h-10 sm:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                          required
                        />
                      </div>

                      {/* Price, Category, Stock, Featured in one row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_2fr_1.2fr_1.8fr] gap-3">
                        {/* Price */}
                        <div className="space-y-2">
                          <Label htmlFor="price" className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">

                            Price
                          </Label>
                          <Input
                            value={inputValues.price}
                            onChange={handleChange}
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="h-10 sm:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            required
                          />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-xs sm:text-sm font-medium text-gray-700">
                            Category *
                          </Label>
                          <Select
                            onValueChange={handleCategoryChange}
                            value={inputValues.category}
                          >
                            <SelectTrigger className="!h-10 sm:!h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-60">
                              {/* Search Input */}
                              <div className="p-2 border-b bg-gray-50">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                  <Input
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onChange={handleCategorySearch}
                                    className="pl-10 h-9"
                                  />
                                </div>
                              </div>

                              {/* Category List */}
                              <div className="max-h-48 overflow-y-auto">
                                {filteredCategories.length > 0 ? (
                                  filteredCategories.map((category) => (
                                    <SelectItem key={category._id} value={category._id} className="py-2">
                                      {category.name
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                        .join(' ')
                                      }
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-3 text-sm text-gray-500 text-center">
                                    No categories found
                                  </div>
                                )}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Stock */}
                        <div className="space-y-2">
                          <Label htmlFor="stock" className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">

                            Quantity *
                          </Label>
                          <Input
                            value={inputValues.stock}
                            onChange={handleChange}
                            id="stock"
                            name="stock"
                            type="number"
                            placeholder="0"
                            className="h-10 sm:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            required
                          />
                        </div>

                        {/* Featured Checkbox */}
                        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                          <Label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">

                            Featured
                          </Label>
                          <div className="flex items-center h-10 sm:h-11 px-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <input
                              type="checkbox"
                              id="isFeatured"
                              name="isFeatured"
                              checked={inputValues.isFeatured}
                              onChange={handleChange}
                              className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                            <Label htmlFor="isFeatured" className="text-[11px] sm:text-[12px] font-medium text-gray-700 ml-2 sm:ml-3 cursor-pointer">
                              Mark as Featured
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mt-3 sm:mt-4 space-y-2">
                        <Label htmlFor="description" className="text-xs sm:text-sm font-medium text-gray-700">
                          Product Description
                        </Label>
                        <textarea
                          value={inputValues.description}
                          onChange={handleChange}
                          id="description"
                          name="description"
                          placeholder="Describe your product..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Right Side - Image Upload Buttons */}
                    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mt-3 lg:mt-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        Product Image
                      </h3>

                      <div className="space-y-2 sm:space-y-3">
                        {/* Upload File Button */}
                        <div className="block w-full">
                          <input
                            ref={pictureInputRef}
                            id="picture"
                            name="picture"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="sr-only"
                            onChange={handleImageChange}
                            disabled={isConverting}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (pictureInputRef.current && !isConverting) {
                                pictureInputRef.current.click();
                              }
                            }}
                            className="w-full h-10 sm:h-12 flex items-center justify-center gap-2 sm:gap-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer text-sm"
                            disabled={isConverting}
                          >
                            <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            <span className="font-medium text-xs sm:text-sm">Upload File</span>
                          </Button>
                        </div>

                        {/* Choose Existing Image Button */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowMediaPicker(true);
                            setMediaCurrentPage(1);
                            setMediaSearchTerm('');
                          }}
                          className="w-full h-10 sm:h-12 flex items-center justify-center gap-2 sm:gap-3 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-sm"
                        >
                          <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <span className="font-medium text-xs sm:text-sm">Choose Existing Image</span>
                        </Button>
                      </div>

                      {/* Image Preview and Status Section */}
                      <div className="space-y-3 mt-3">
                        {/* Conversion Status */}
                        {isConverting && (
                          <div className="p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-spin" />
                              <span className="text-xs sm:text-sm font-medium text-primary">Optimizing image...</span>
                            </div>
                          </div>
                        )}

                        {/* Conversion Info */}
                        {conversionInfo && (
                          <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                              <span className="text-xs sm:text-sm font-semibold text-green-800">Image Optimized!</span>
                            </div>
                            <div className="bg-white rounded-lg p-2 space-y-1.5 sm:space-y-2">
                              <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600">Original:</span>
                                <span className="font-medium text-[10px] sm:text-sm">{conversionInfo.original.size}KB ({conversionInfo.original.type})</span>
                              </div>
                              <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-gray-600">Optimized:</span>
                                <span className="font-medium text-green-600 text-[10px] sm:text-sm">{conversionInfo.converted.size}KB ({conversionInfo.converted.type})</span>
                              </div>
                              <div className="text-center text-xs sm:text-sm font-semibold text-green-700 bg-green-100 rounded px-2 sm:px-3 py-1">
                                {conversionInfo.compression}% size reduction
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Preview */}
                        {inputValues.picture && (
                          <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={previewUrl || URL.createObjectURL(inputValues.picture)}
                                  alt="Preview"
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border"
                                  crossOrigin="anonymous"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  loading="eager"
                                  decoding="async"
                                  onError={(e) => {
                                    e.target.src = '/placeholder-product.jpg';
                                  }}
                                />
                                {inputValues.picture.type === 'image/webp' && (
                                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-green-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                                    WebP
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm font-medium text-gray-800">Image ready</span>
                                  {inputValues.picture.type === 'image/webp' && (
                                    <span className="text-[10px] sm:text-xs text-green-600 font-medium bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Optimized</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInputValues((v) => ({ ...v, picture: null }));
                                    setConversionInfo(null);
                                    if (previewUrl) {
                                      revokePreviewUrl(previewUrl);
                                      setPreviewUrl(null);
                                    }
                                    // Reset file input to allow re-uploading the same file using ref
                                    if (pictureInputRef.current) {
                                      pictureInputRef.current.value = '';
                                    }
                                  }}
                                  className="text-xs sm:text-sm font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
                                >
                                  Remove Image
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      className="h-10 sm:h-12 px-6 sm:px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="hidden sm:inline">Adding Product...</span>
                          <span className="sm:hidden">Adding...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Add Product</span>
                          <span className="sm:hidden">Add</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="excel" className="mt-4">
                <div className="space-y-3 sm:space-y-4">
                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      Import Instructions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-800">Required Columns</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            <strong>name</strong> - Product title
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            <strong>stock</strong> - Quantity available
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            <strong>price</strong> - Product price
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-800">Important Notes</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            All columns are optional
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Auto-assigned to "General" category
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Empty rows are skipped
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Template Download */}
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                          <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Excel Template</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Download our pre-formatted template</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 h-9 sm:h-11 px-3 sm:px-4 border-green-200 text-green-700 hover:bg-green-50 text-xs sm:text-sm w-full sm:w-auto"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        Download Template
                      </Button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <form onSubmit={handleExcelImport} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Upload Excel File
                    </h3>

                    <div className="space-y-3 sm:space-y-4">
                      {/* Upload Area */}
                      <div className="flex justify-center px-3 sm:px-4 pt-4 sm:pt-6 pb-4 sm:pb-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 group">
                        <div className="space-y-2 sm:space-y-3 text-center">
                          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
                            <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-blue-500" />
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex flex-wrap text-xs sm:text-sm text-gray-600 justify-center items-center gap-1 sm:gap-0">
                              <label
                                htmlFor="excelFile"
                                className="relative cursor-pointer font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                              >
                                <span className="underline">Upload Excel file</span>
                                <input
                                  ref={excelFileInputRef}
                                  id="excelFile"
                                  name="excelFile"
                                  type="file"
                                  accept=".xlsx,.xls,.csv"
                                  className="sr-only"
                                  onChange={(e) => setExcelFile(e.target.files[0])}
                                />
                              </label>
                              <span className="mx-1 sm:mx-2">or</span>
                              <span className="text-gray-500">drag and drop</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 px-2">
                              Excel files (.xlsx, .xls, .csv) up to 10MB
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* File Preview */}
                      {excelFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                              <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-medium text-green-800 truncate">
                                  {excelFile.name}
                                </span>
                                <span className="text-[10px] sm:text-xs text-green-600 bg-green-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
                                  {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                              <p className="text-[10px] sm:text-xs text-green-700 mt-0.5 sm:mt-1">Ready to import</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setExcelFile(null);
                                // Reset file input using ref
                                if (excelFileInputRef.current) {
                                  excelFileInputRef.current.value = '';
                                }
                              }}
                              className="text-red-600 hover:text-red-500 transition-colors duration-200 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Import Button */}
                      <Button
                        type="submit"
                        className="w-full h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                        disabled={importLoading || !excelFile}
                      >
                        {importLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="hidden sm:inline">Importing Products...</span>
                            <span className="sm:hidden">Importing...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span className="hidden sm:inline">Import Products</span>
                            <span className="sm:hidden">Import</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Media Picker Modal */}
        {showMediaPicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <ImageIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl font-semibold text-gray-800 truncate">Choose from Existing Images</h2>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Select an image from your media library</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMediaPicker(false)}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder="Search images..."
                    value={mediaSearchTerm}
                    onChange={handleMediaSearchChange}
                    className="pl-9 sm:pl-12 h-10 sm:h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-sm"
                  />
                </div>
              </div>



              {/* Media Grid */}
              <div className="p-2 sm:p-4 flex-1 overflow-y-auto">
                {mediaLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-spin" />
                      <span className="text-sm sm:text-base text-gray-600 font-medium">Loading media...</span>
                    </div>
                  </div>
                ) : filteredMediaProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                    {filteredMediaProducts.map((product) => (
                      <div
                        key={product._id}
                        className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white"
                        onClick={() => handleMediaSelect(product)}
                      >
                        <div className="aspect-square bg-gray-50 relative">
                          <LazyImage
                            src={product.picture?.secure_url || product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            fallback="/logo.jpeg"
                            quality={85}
                            loading="eager"
                          />

                          {/* Uploaded Media Indicator */}
                          {product.isUploadedMedia && (
                            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                              <Upload className="h-3 w-3" />
                              Uploaded
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Product title */}
                        <div className="p-2 sm:p-3 bg-white">
                          <p className="text-[10px] sm:text-xs text-gray-700 truncate font-medium" title={product.title}>
                            {product.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No images found</h3>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto px-4">
                      {mediaSearchTerm
                        ? 'Try adjusting your search criteria or browse all available images'
                        : 'No product images available in your media library'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination - Bottom */}
              {mediaTotalPages > 1 && (
                <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-center">
                    <Pagination
                      currentPage={mediaCurrentPage}
                      totalPages={mediaTotalPages}
                      onPageChange={handleMediaPageChange}
                    />
                  </div>
                </div>
              )}


            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProducts;

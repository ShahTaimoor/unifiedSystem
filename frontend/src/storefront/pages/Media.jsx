import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, searchProducts } from '@/storefront/redux/slices/products/productSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import LazyImage from '../components/ui/LazyImage';
import Pagination from '../components/custom/Pagination';
import { usePagination } from '@/storefront/hooks/use-pagination';
import { useMedia } from '@/storefront/hooks/use-media';
import { imageService } from '@/storefront/services/imageService';
import jsPDF from 'jspdf';
import { Eye, Download, Filter, FileDown, Plus, X, Upload, Trash2, CheckSquare, Square, Image, Upload as UploadIcon, Search, Loader2, Share2 } from 'lucide-react';

const Media = () => {
  const dispatch = useDispatch();
  const { products, status, totalItems, searchResults, searchStatus, searchQuery: reduxSearchQuery } = useSelector((state) => state.products);

  // Local state for filters
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [stockFilter] = useState('all');
  const [sortBy] = useState('relevance');

  // Use pagination hook to eliminate pagination duplication
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 24,
    totalItems,
    onPageChange: (newPage) => {
      setPage(newPage);
    }
  });

  // Local state for UI-specific functionality
  const [activeTab, setActiveTab] = useState('gallery');
  const [previewImage, setPreviewImage] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const {
    uploadedMedia,
    mediaLoading,
    isDeleting,
    isImporting,
    fetchMedia,
    uploadMedia,
    deleteMedia,
    bulkDeleteMedia,
  } = useMedia();
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Separate state for uploaded media display in Upload tab
  const [filteredUploadedMedia, setFilteredUploadedMedia] = useState([]);
  const [uploadSearchTerm, setUploadSearchTerm] = useState(''); // Search term for uploaded media
  const [searchQuery, setSearchQuery] = useState(''); // Search term for gallery products
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state for Upload tab
  const [uploadCurrentPage, setUploadCurrentPage] = useState(1);
  const [uploadPageSize, setUploadPageSize] = useState(24); // Set back to 24 per page as requested
  const [uploadTotalPages, setUploadTotalPages] = useState(1);
  const [showAllImages, setShowAllImages] = useState(false); // Option to show all images without pagination

  // Fetch media on component mount
  useEffect(() => {
    fetchMedia(2000);
  }, [fetchMedia]);

  // Fetch products when filters change
  useEffect(() => {
    dispatch(fetchProducts({ category, page, limit, stockFilter, sortBy }));
  }, [dispatch, category, page, limit, stockFilter, sortBy]);

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

  // Filter products to show only those with images (backend handles all search filtering)
  useEffect(() => {
    // For Gallery tab: Show only product images (no uploaded media)
    // Use search results if searching, otherwise use regular products
    const productsToFilter = hasSearched && searchResults && searchResults.length > 0
      ? searchResults
      : products;

    let filtered = productsToFilter.filter(product =>
      product &&
      product._id &&
      (product.picture?.secure_url || product.image)
    );

    // Remove duplicates by _id to prevent React key warnings
    const uniqueProducts = [];
    const seenIds = new Set();

    for (const product of filtered) {
      const productId = product._id?.toString();
      if (productId && !seenIds.has(productId)) {
        seenIds.add(productId);
        uniqueProducts.push(product);
      }
    }

    setFilteredProducts(uniqueProducts);
  }, [products, searchResults, hasSearched]);

  // Filter uploaded media for Upload tab with pagination and search
  useEffect(() => {

    // First apply search filter
    let searchFiltered = uploadedMedia;
    if (uploadSearchTerm && uploadSearchTerm.trim()) {
      const searchLower = uploadSearchTerm.toLowerCase();
      searchFiltered = uploadedMedia.filter(media =>
        media.name?.toLowerCase().includes(searchLower) ||
        media.originalName?.toLowerCase().includes(searchLower) ||
        media.url?.toLowerCase().includes(searchLower)
      );
    }

    // Remove duplicates by _id to prevent React key warnings
    const uniqueMedia = [];
    const seenIds = new Set();

    for (const media of searchFiltered) {
      const mediaId = media._id?.toString();
      if (mediaId && !seenIds.has(mediaId)) {
        seenIds.add(mediaId);
        uniqueMedia.push(media);
      }
    }

    if (showAllImages) {
      // Show all filtered images without pagination
      setFilteredUploadedMedia(uniqueMedia);
      setUploadTotalPages(1);
    } else {
      // Calculate pagination
      const totalPages = Math.ceil(uniqueMedia.length / uploadPageSize);
      setUploadTotalPages(totalPages);

      // Get current page items
      const startIndex = (uploadCurrentPage - 1) * uploadPageSize;
      const endIndex = startIndex + uploadPageSize;
      const paginatedMedia = uniqueMedia.slice(startIndex, endIndex);

      setFilteredUploadedMedia(paginatedMedia);
    }
  }, [uploadedMedia, uploadCurrentPage, uploadPageSize, showAllImages, uploadSearchTerm]);

  const handlePreviewImage = useCallback((imageUrl) => {
    setPreviewImage(imageUrl);
  }, []);

  // Search handlers for gallery
  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length === 0) {
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    dispatch(searchProducts({ query: trimmedQuery, limit: 100 }));
  }, [searchQuery, dispatch]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setHasSearched(false);
  }, []);

  const handleDownloadImage = useCallback(async (imageUrl, productTitle) => {
    try {
      const filename = `${productTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      await imageService.downloadImage(imageUrl, filename);
    } catch (error) {
      // Download error handled silently
    }
  }, []);


  // Upload tab search handlers
  const handleUploadSearchChange = useCallback((value) => {
    setUploadSearchTerm(value);
    setUploadCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleUploadSearchSubmit = useCallback((term) => {
    setUploadSearchTerm(term);
    setUploadCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((page) => {
    pagination.setCurrentPage(page);
  }, [pagination]);

  const handleUploadPageChange = useCallback((page) => {
    setUploadCurrentPage(page);
  }, []);

  // Reset upload page when switching to upload tab
  useEffect(() => {
    if (activeTab === 'upload') {
      setUploadCurrentPage(1);
      setShowAllImages(false); // Reset to paginated view when switching to upload tab
    }
  }, [activeTab]);

  // Reset selection when switching modes
  useEffect(() => {
    if (!selectMode && !deleteMode) {
      setSelectedItems([]);
    }
  }, [selectMode, deleteMode]);

  // Delete functionality
  const handleDeleteSingle = useCallback(async (itemId) => {
    const result = await deleteMedia(itemId);
    if (result.success) {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  }, [deleteMedia]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      return;
    }

    const result = await bulkDeleteMedia(selectedItems);
    if (result.success) {
      setSelectedItems([]);
      setDeleteMode(false);
      setShowDeleteModal(false);
    }
  }, [selectedItems, bulkDeleteMedia]);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === filteredUploadedMedia.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredUploadedMedia.map(item => item._id));
    }
  }, [selectedItems.length, filteredUploadedMedia]);

  const handleSelectAllGallery = useCallback(() => {
    if (selectedItems.length === filteredProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredProducts.map(item => item._id));
    }
  }, [selectedItems.length, filteredProducts]);

  const toggleDeleteMode = useCallback(() => {
    setDeleteMode(prev => !prev);
    if (deleteMode) {
      setSelectedItems([]);
    }
  }, [deleteMode]);

  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => !prev);
    if (selectMode) {
      setSelectedItems([]);
    }
  }, [selectMode]);

  const handleShare = useCallback(async () => {
    if (selectedItems.length === 0) {
      return;
    }

    // Get the URLs and names of selected items
    let imageData = [];

    if (activeTab === 'gallery') {
      // For gallery, get product image URLs
      const selectedProducts = filteredProducts.filter(product =>
        selectedItems.includes(product._id)
      );
      imageData = selectedProducts.map(product => ({
        url: product.picture?.secure_url || product.image,
        name: product.title || 'product'
      })).filter(item => item.url);
    } else {
      // For upload tab, get uploaded media URLs
      const selectedMedia = filteredUploadedMedia.filter(media =>
        selectedItems.includes(media._id)
      );
      imageData = selectedMedia.map(media => ({
        url: media.url,
        name: media.name || 'image'
      })).filter(item => item.url);
    }

    if (imageData.length === 0) {
      return;
    }

    try {
      // Fetch all images as blobs
      const imageFiles = await Promise.all(
        imageData.map(async (item, index) => {
          try {
            const blob = await imageService.fetchImageBlob(item.url, 30000);
            // Ensure we have a valid MIME type
            let mimeType = blob.type || 'image/jpeg';
            if (!mimeType.startsWith('image/')) {
              mimeType = 'image/jpeg';
            }

            // Convert blob to File object with proper MIME type
            const fileName = `${item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${index + 1}.${mimeType.split('/')[1] || 'jpg'}`;
            const file = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now()
            });

            return file;
          } catch (error) {
            console.error(`Failed to fetch image ${item.url}:`, error);
            return null;
          }
        })
      );

      // Filter out any failed fetches
      const validFiles = imageFiles.filter(file => file !== null);

      if (validFiles.length === 0) {
        alert('Failed to load images for sharing. Please try again.');
        return;
      }

      // Use Web Share API with files (works on mobile and desktop if app is installed)
      // On Windows, try sharing files directly - sometimes canShare check is too strict
      if (navigator.share) {
        // First, try to share files directly (Windows Share dialog should show WhatsApp if installed)
        try {
          // Limit files to 10 for better compatibility with Windows Share
          const filesToShare = validFiles.slice(0, 10);

          // Ensure files are valid File objects
          console.log('Attempting to share files:', filesToShare.length, 'files');
          console.log('File types:', filesToShare.map(f => ({ name: f.name, type: f.type, size: f.size })));

          // Try sharing with files - Windows Share API should show all available apps including WhatsApp
          // Note: WhatsApp must be installed from Microsoft Store and registered as a share target
          await navigator.share({
            files: filesToShare,
            title: `Sharing ${filesToShare.length} image${filesToShare.length > 1 ? 's' : ''}`,
          });
          return;
        } catch (error) {
          // User cancelled - don't show error
          if (error.name === 'AbortError') {
            return;
          }

          console.error('Share error:', error);
          console.log('Error details:', {
            name: error.name,
            message: error.message,
            canShare: navigator.canShare ? navigator.canShare({ files: validFiles }) : 'not supported'
          });

          // If sharing files failed, check if canShare says it's not supported
          const canShareFiles = navigator.canShare && navigator.canShare({ files: validFiles });

          if (!canShareFiles) {
            // Try sharing text with links as fallback
            try {
              const linksText = imageData.map(item => item.url).join('\n');
              await navigator.share({
                title: `Sharing ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}`,
                text: linksText,
              });
              return;
            } catch (textError) {
              if (textError.name === 'AbortError') {
                return;
              }
              console.error('Error sharing text:', textError);
            }
          }
        }
      } else {
        console.log('Web Share API not available');
      }

      // Fallback: For desktop/WhatsApp Web, download images and open WhatsApp
      // Since WhatsApp Web doesn't support file sharing via URL, we'll download
      // the images and open WhatsApp Web so user can manually attach them
      try {
        // Create a ZIP file with all images
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        validFiles.forEach((file) => {
          zip.file(file.name, file);
        });

        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });

        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `images_to_share_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Wait a bit for download to start, then open WhatsApp
        setTimeout(() => {
          URL.revokeObjectURL(url);
          // Open WhatsApp Web
          window.open('https://web.whatsapp.com', '_blank');
          alert(`Images downloaded as ZIP file. Please extract and attach them in WhatsApp.\n\nSelected ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}.`);
        }, 500);
      } catch (zipError) {
        // If ZIP fails, just open WhatsApp with links
        const linksText = imageData.map(item => item.url).join('\n');
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(linksText)}`;
        window.open(whatsappUrl, '_blank');
        alert('Note: Sharing links instead of images. For image files, please use the share dialog on mobile devices.');
      }

    } catch (error) {
      console.error('Error in share process:', error);
      alert('Failed to share images. Please try again.');
    }
  }, [selectedItems, activeTab, filteredProducts, filteredUploadedMedia]);

  // Helper function to convert image URL to base64
  const getImageBase64 = useCallback(async (imageUrl) => {
    try {
      const blob = await imageService.fetchImageBlob(imageUrl, 30000);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  }, []);

  // Download selected images as PDF with titles
  const handleDownloadPDF = useCallback(async () => {
    if (selectedItems.length === 0) {
      return;
    }

    setIsDownloadingPDF(true);
    try {
      // Get the image data for selected items
      let imageData = [];

      if (activeTab === 'gallery') {
        // For gallery, get product image URLs and titles
        const selectedProducts = filteredProducts.filter(product =>
          selectedItems.includes(product._id)
        );
        imageData = selectedProducts.map(product => ({
          url: product.picture?.secure_url || product.image,
          name: product.title || 'Product'
        })).filter(item => item.url);
      } else {
        // For upload tab, get uploaded media URLs and names
        const selectedMedia = filteredUploadedMedia.filter(media =>
          selectedItems.includes(media._id)
        );
        imageData = selectedMedia.map(media => ({
          url: media.url,
          name: media.name || media.originalName || 'Image'
        })).filter(item => item.url);
      }

      if (imageData.length === 0) {
        alert('No images to download.');
        setIsDownloadingPDF(false);
        return;
      }

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 7); // Left and right margins
      const imageWidth = contentWidth;
      const imageHeight = 100; // Fixed height for images
      let yPosition = margin;

      // Process images one by one
      for (let i = 0; i < imageData.length; i++) {
        const item = imageData[i];

        // Add new page if needed (except for first item)
        if (i > 0 && yPosition + imageHeight + 30 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        try {
          // Get image as base64
          const imageBase64 = await getImageBase64(item.url);

          if (imageBase64) {
            // Add title with border, ID number (wrap after 80 characters)
            const maxCharsPerLine = 80;
            let titleText = `${i + 1}. ${item.name}`;

            // Split title into lines if longer than 80 characters
            const titleLines = [];
            if (titleText.length > maxCharsPerLine) {
              let remainingText = titleText;
              while (remainingText.length > 0) {
                if (remainingText.length <= maxCharsPerLine) {
                  titleLines.push(remainingText);
                  break;
                }
                // Find the last space before maxCharsPerLine to break at word boundary
                let breakPoint = maxCharsPerLine;
                for (let j = maxCharsPerLine; j > 0; j--) {
                  if (remainingText[j] === ' ') {
                    breakPoint = j;
                    break;
                  }
                }
                titleLines.push(remainingText.substring(0, breakPoint));
                remainingText = remainingText.substring(breakPoint + 1).trim();
              }
            } else {
              titleLines.push(titleText);
            }

            doc.setFontSize(12);

            // Calculate title dimensions (for multi-line)
            const titlePadding = 2; // Reduced padding
            const lineHeight = 7;

            // Calculate the maximum width needed for all lines
            let maxLineWidth = 0;
            titleLines.forEach(line => {
              const lineWidth = doc.getTextWidth(line);
              if (lineWidth > maxLineWidth) {
                maxLineWidth = lineWidth;
              }
            });

            // Add title text with ID number (bold, no border, centered)
            doc.setFont('helvetica', 'bold'); // Bold font
            doc.setTextColor(0, 0, 0); // Black color
            titleLines.forEach((line, lineIndex) => {
              // Center the text horizontally
              const textY = yPosition + (lineIndex * lineHeight);
              const textWidth = doc.getTextWidth(line);
              const textX = (pageWidth - textWidth) / 2; // Center horizontally
              doc.text(line, textX, textY);
            });

            // Move position below the title text
            yPosition += (titleLines.length * lineHeight) + 5;

            // Center the image horizontally
            const imageXPosition = (pageWidth - imageWidth) / 2;

            // Add image below the title (centered)
            doc.addImage(imageBase64, 'JPEG', imageXPosition, yPosition, imageWidth, imageHeight);

            // Draw border below the image - full width from margin to page edge
            doc.setDrawColor(0, 0, 0); // Black border
            doc.setLineWidth(0.3); // Thicker line for visibility
            const borderY = yPosition + imageHeight;
            const borderStartX = margin;
            const borderEndX = pageWidth - margin; // Full width from left margin to right margin
            doc.line(borderStartX, borderY, borderEndX, borderY);

            yPosition += imageHeight + 15; // Add spacing after image
          }
        } catch (error) {
          console.error(`Failed to add image ${item.name}:`, error);
          // Continue with next image even if one fails
        }
      }

      // Save PDF
      const fileName = `media_images_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  }, [selectedItems, activeTab, filteredProducts, filteredUploadedMedia, getImageBase64]);

  // Import functionality
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  }, []);

  const handleImport = useCallback(async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    // Check for duplicate names before uploading
    const duplicateNames = [];
    const existingNames = uploadedMedia.map((media) => media.name?.toLowerCase());

    selectedFiles.forEach((file) => {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      if (existingNames.includes(sanitizedName)) {
        duplicateNames.push(file.name);
      }
    });

    if (duplicateNames.length > 0) {
      return;
    }

    const result = await uploadMedia(selectedFiles);
    if (result.success) {
      setShowImportModal(false);
      setSelectedFiles([]);
    }
  }, [selectedFiles, uploadMedia, uploadedMedia]);

  // Export functionality for uploaded media
  const handleUploadExport = useCallback(async () => {
    setIsExporting(true);
    try {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        // Fetch images in parallel batches for better performance
        const batchSize = 5; // Process 5 images at a time
        let processedCount = 0;

        for (let i = 0; i < filteredUploadedMedia.length; i += batchSize) {
          const batch = filteredUploadedMedia.slice(i, i + batchSize);

          // Process batch in parallel
          const batchPromises = batch.map(async (media, batchIndex) => {
            const imageUrl = media.url;

            if (imageUrl) {
              try {
                const blob = await imageService.fetchImageBlob(imageUrl, 30000);
                const fileName = `${media.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || `uploaded_${i + batchIndex + 1}`}.jpg`;
                return { fileName, blob, success: true };
              } catch (error) {
                // Failed to fetch image - skip this image and continue with others
                return { fileName: null, blob: null, success: false };
              }
            }
            return { fileName: null, blob: null, success: false };
          });

          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);

          // Add successful results to zip
          batchResults.forEach(({ fileName, blob, success }) => {
            if (success && fileName && blob) {
              zip.file(fileName, blob);
            }
          });

          processedCount += batch.length;

          // Update progress
        }

        // Generate zip
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 } // Balanced compression
        });

        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `uploaded_media_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (zipError) {
        // ZIP creation failed - fallback to individual downloads
        // Fallback: download images individually

        for (let i = 0; i < filteredUploadedMedia.length; i++) {
          const media = filteredUploadedMedia[i];
          const imageUrl = media.url;

          if (imageUrl) {
            try {
              const blob = await imageService.fetchImageBlob(imageUrl, 5000);
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              const fileName = `${media.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || `uploaded_${i + 1}`}.jpg`;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              // Show progress for individual downloads
            } catch (error) {
              // Failed to fetch image - skip and continue
            }
          }
        }
      }

      setShowExportModal(false);
    } catch (error) {
      // Export error handled - user will see error if critical
    } finally {
      setIsExporting(false);
    }
  }, [filteredUploadedMedia]);

  // Export functionality
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        // Fetch images in parallel batches for better performance
        const batchSize = 5; // Process 5 images at a time
        let processedCount = 0;

        for (let i = 0; i < filteredProducts.length; i += batchSize) {
          const batch = filteredProducts.slice(i, i + batchSize);

          // Process batch in parallel
          const batchPromises = batch.map(async (product, batchIndex) => {
            const imageUrl = product.picture?.secure_url || product.image;

            if (imageUrl) {
              try {
                const blob = await imageService.fetchImageBlob(imageUrl, 30000);
                const fileName = `${product.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || `product_${i + batchIndex + 1}`}.jpg`;
                return { fileName, blob, success: true };
              } catch (error) {
                // Failed to fetch image - skip this image and continue with others
                return { fileName: null, blob: null, success: false };
              }
            }
            return { fileName: null, blob: null, success: false };
          });

          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);

          // Add successful results to zip
          batchResults.forEach(({ fileName, blob, success }) => {
            if (success && fileName && blob) {
              zip.file(fileName, blob);
            }
          });

          processedCount += batch.length;

          // Update progress
        }

        // Generate zip
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 } // Balanced compression
        });

        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `media_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (zipError) {
        // ZIP creation failed - fallback to individual downloads
        // Fallback: download images individually

        for (let i = 0; i < filteredProducts.length; i++) {
          const product = filteredProducts[i];
          const imageUrl = product.picture?.secure_url || product.image;

          if (imageUrl) {
            try {
              const blob = await imageService.fetchImageBlob(imageUrl, 5000);
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              const fileName = `${product.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || `product_${i + 1}`}.jpg`;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              // Show progress for individual downloads
            } catch (error) {
              // Failed to fetch image - skip and continue
            }
          }
        }
      }

      setShowExportModal(false);
    } catch (error) {
      // Export error handled - user will see error if critical
    } finally {
      setIsExporting(false);
    }
  }, [filteredProducts]);

  // Only show main loader for initial loading, not for search/filter operations
  if (status === 'loading' && products.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Gallery</h1>
        <p className="text-gray-600">Browse and manage all product images</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <UploadIcon className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          {/* Enhanced Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Input Row */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-9 sm:pl-10 pr-20 sm:pr-10 h-9 sm:h-10 text-sm sm:text-base"
                  />
                  {/* Mobile: Search icon button inside input */}
                  <button
                    onClick={handleSearch}
                    disabled={searchStatus === 'loading' || !searchQuery.trim()}
                    className="absolute right-2 sm:hidden top-1/2 transform -translate-y-1/2 p-1.5 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {searchStatus === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                  {/* Clear button - positioned differently on mobile vs desktop */}
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 right-11 sm:right-3 transition-colors"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>
                {/* Desktop: Separate search button */}
                <Button
                  onClick={handleSearch}
                  disabled={searchStatus === 'loading' || !searchQuery.trim()}
                  className="hidden sm:flex h-9 sm:h-10 px-4 sm:px-6 bg-primary hover:bg-primary/90 text-sm sm:text-base whitespace-nowrap items-center justify-center"
                >
                  {searchStatus === 'loading' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Searching...</span>
                      <span className="sm:hidden">Search...</span>
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {/* Search Results Info */}
              {hasSearched && searchQuery && (
                <div className="text-xs sm:text-sm text-gray-600">
                  {searchStatus === 'loading' ? (
                    'Searching...'
                  ) : uniqueSearchResultsCount > 0 ? (
                    `Found ${uniqueSearchResultsCount} result${uniqueSearchResultsCount !== 1 ? 's' : ''} for "${searchQuery}"`
                  ) : (
                    `No results found for "${searchQuery}"`
                  )}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectMode ? "default" : "outline"}
                  onClick={toggleSelectMode}
                  className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                >
                  <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{selectMode ? 'Cancel Select' : 'Select'}</span>
                  <span className="sm:hidden">{selectMode ? 'Cancel' : 'Select'}</span>
                </Button>

                {selectMode && selectedItems.length > 0 && (
                  <>
                    <Button
                      variant="default"
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPDF}
                      className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                    >
                      {isDownloadingPDF ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">Generating PDF...</span>
                          <span className="sm:hidden">PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Download PDF ({selectedItems.length})</span>
                          <span className="sm:hidden">PDF ({selectedItems.length})</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleShare}
                      className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                    >
                      <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Share ({selectedItems.length})</span>
                      <span className="sm:hidden">Share ({selectedItems.length})</span>
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                >
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-600">
                  Showing {filteredProducts.length} product images
                  {mediaLoading && (
                    <span className="ml-2 text-blue-600 animate-pulse">
                      Loading images...
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Product images from your inventory
                </p>
              </div>
              {selectMode && filteredProducts.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-2">
                  <button
                    onClick={handleSelectAllGallery}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                  >
                    {selectedItems.length === filteredProducts.length ? (
                      <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    ) : (
                      <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                    <span className="whitespace-nowrap">
                      {selectedItems.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                    </span>
                  </button>
                  {selectedItems.length > 0 && (
                    <span className="text-xs sm:text-sm text-blue-600 font-medium whitespace-nowrap">
                      {selectedItems.length} selected
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Media Grid - Image Only */}
          {filteredProducts.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
              {filteredProducts.map((product, index) => (
                <div
                  key={product._id || `product-${index}`}
                  className="relative group transition-all duration-300 hover:scale-105"
                >
                  {/* Selection Checkbox */}
                  {selectMode && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectItem(product._id);
                        }}
                        className="bg-white/90 hover:bg-white rounded-full p-1 shadow-md transition-all"
                      >
                        {selectedItems.includes(product._id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Product Image Only */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105 cursor-pointer w-full"
                    onClick={() => {
                      if (!selectMode) {
                        handlePreviewImage(product.picture?.secure_url || product.image);
                      }
                    }}
                  >
                    <LazyImage
                      src={product.picture?.secure_url || product.image}
                      alt={product.title || 'Product Image'}
                      className="w-full h-full object-cover"
                      fallback="/logo.jpeg"
                      quality={85}
                      loading="eager"
                    />

                    {/* Product Image Indicator */}
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      Product
                    </div>

                    {/* Hover overlay with actions */}
                    {!selectMode && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewImage(product.picture?.secure_url || product.image);
                          }}
                          className="bg-white/90 hover:bg-white text-black"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(product.picture?.secure_url || product.image, product.title || 'product');
                          }}
                          className="bg-white/90 hover:bg-white text-black"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Filter className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
              <p className="text-gray-500">
                No product images available
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upload Images</h2>
                <p className="text-sm sm:text-base text-gray-600">Upload new images to your media library</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectMode ? "default" : "outline"}
                  onClick={toggleSelectMode}
                  className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                >
                  <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{selectMode ? 'Cancel Select' : 'Select'}</span>
                  <span className="sm:hidden">{selectMode ? 'Cancel' : 'Select'}</span>
                </Button>

                {selectMode && selectedItems.length > 0 && (
                  <>
                    <Button
                      variant="default"
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPDF}
                      className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                    >
                      {isDownloadingPDF ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">Generating PDF...</span>
                          <span className="sm:hidden">PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Download PDF ({selectedItems.length})</span>
                          <span className="sm:hidden">PDF ({selectedItems.length})</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleShare}
                      className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                    >
                      <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Share ({selectedItems.length})</span>
                      <span className="sm:hidden">Share ({selectedItems.length})</span>
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                >
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Export</span>
                </Button>

                <Button
                  variant={deleteMode ? "destructive" : "outline"}
                  onClick={toggleDeleteMode}
                  className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 hover:bg-red-50 hover:border-red-300 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{deleteMode ? 'Cancel Delete' : 'Delete Mode'}</span>
                  <span className="sm:hidden">{deleteMode ? 'Cancel' : 'Delete'}</span>
                </Button>

                {deleteMode && selectedItems.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Delete Selected ({selectedItems.length})</span>
                    <span className="sm:hidden">Delete ({selectedItems.length})</span>
                  </Button>
                )}

                <Button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                >
                  <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Upload Images</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </div>
            </div>


            {/* Upload Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Upload Guidelines</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                    <li>• Images will be automatically converted to WebP for optimization</li>
                    <li>• Maximum file size: 10MB per image</li>
                    <li>• Images are uploaded to Cloudinary for fast delivery</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => setShowImportModal(true)}>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-blue-100 rounded-full p-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Drop images here or click to upload</h3>
                  <p className="text-gray-600">Select multiple images to upload at once</p>
                </div>
              </div>
            </div>

            {/* Uploaded Media Grid */}
            {filteredUploadedMedia.length > 0 ? (
              <div className="mt-6 sm:mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-0">Uploaded Images</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 sm:mt-0">
                      <span className="text-xs sm:text-sm text-gray-500">
                        Showing {filteredUploadedMedia.length} of {uploadedMedia.length} images
                        {uploadSearchTerm && ` for "${uploadSearchTerm}"`}
                      </span>
                      {!showAllImages && uploadTotalPages > 1 && (
                        <span className="text-xs sm:text-sm text-gray-500">
                          Page {uploadCurrentPage} of {uploadTotalPages}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={showAllImages ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setShowAllImages(!showAllImages);
                        setUploadCurrentPage(1);
                      }}
                      className="text-xs h-7 sm:h-8 px-2 sm:px-3"
                    >
                      {showAllImages ? 'Show Paginated' : 'Show All'}
                    </Button>
                    {!showAllImages && (
                      <select
                        value={uploadPageSize}
                        onChange={(e) => {
                          setUploadPageSize(Number(e.target.value));
                          setUploadCurrentPage(1);
                        }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 h-7 sm:h-8"
                      >
                        <option value={12}>12 per page</option>
                        <option value={24}>24 per page</option>
                        <option value={48}>48 per page</option>
                        <option value={96}>96 per page</option>
                      </select>
                    )}
                    {(selectMode || deleteMode) && filteredUploadedMedia.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                        >
                          {selectedItems.length === filteredUploadedMedia.length ? (
                            <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                          ) : (
                            <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                          <span className="whitespace-nowrap">
                            {selectedItems.length === filteredUploadedMedia.length ? 'Deselect All' : 'Select All'}
                          </span>
                        </button>
                        {selectedItems.length > 0 && (
                          <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${selectMode ? 'text-blue-600' : 'text-red-600'
                            }`}>
                            {selectedItems.length} selected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredUploadedMedia.map((media, index) => (
                    <div key={media._id || `media-${index}`} className="relative group">
                      {/* Selection Checkbox */}
                      {(selectMode || deleteMode) && (
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectItem(media._id);
                            }}
                            className="bg-white/90 hover:bg-white rounded-full p-1 shadow-md transition-all"
                          >
                            {selectedItems.includes(media._id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}

                      <div className="aspect-square bg-gray-50 overflow-hidden rounded-lg cursor-pointer"
                        onClick={() => {
                          if (!selectMode && !deleteMode) {
                            handlePreviewImage(media.url);
                          }
                        }}>
                        <LazyImage
                          src={media.url}
                          alt={media.name || 'Uploaded Image'}
                          className="w-full h-full object-cover"
                          fallback="/logo.jpeg"
                          quality={85}
                        />
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Upload className="h-3 w-3" />
                          Uploaded
                        </div>

                        {/* Hover overlay with actions */}
                        {!selectMode && !deleteMode && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewImage(media.url);
                              }}
                              className="bg-white/90 hover:bg-white text-black"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadImage(media.url, media.name || 'uploaded-image');
                              }}
                              className="bg-white/90 hover:bg-white text-black"
                            >
                              <Download className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this uploaded image?')) {
                                  handleDeleteSingle(media._id);
                                }
                              }}
                              className="bg-red-500/90 hover:bg-red-500 text-white"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload Pagination */}
                {!showAllImages && uploadTotalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={uploadCurrentPage}
                      totalPages={uploadTotalPages}
                      onPageChange={handleUploadPageChange}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Upload className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {uploadSearchTerm ? 'No images found' : 'No uploaded images yet'}
                </h3>
                <p className="text-gray-500">
                  {uploadSearchTerm
                    ? 'Try adjusting your search criteria'
                    : 'Upload your first images to get started'
                  }
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="rounded-lg shadow-lg object-contain w-full h-auto max-h-[90vh]"
              loading="eager"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer-when-downgrade"
              decoding="async"
              fetchPriority="high"
              onError={(e) => {
                if (e.target.src !== '/logo.jpeg') {
                  e.target.src = '/logo.jpeg';
                }
              }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 lg:right-24 xl:right-24 bg-black/70 hover:bg-red-500 text-white rounded-full p-1 px-2 text-sm md:text-base"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Images</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFiles([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Images will be automatically converted to WebP and uploaded to Cloudinary
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Selected {selectedFiles.length} files:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, index) => {
                      const fileName = file.name.replace(/\.[^/.]+$/, '');
                      const sanitizedName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                      const existingNames = uploadedMedia.map(media => media.name?.toLowerCase());
                      const isDuplicate = existingNames.includes(sanitizedName);

                      return (
                        <div key={index} className={`text-xs truncate flex items-center gap-2 ${isDuplicate ? 'text-red-600' : 'text-gray-500'
                          }`}>
                          {isDuplicate && <span className="text-red-500">⚠️</span>}
                          <span className={isDuplicate ? 'font-medium' : ''}>{file.name}</span>
                          {isDuplicate && <span className="text-red-500 text-xs">(already exists)</span>}
                        </div>
                      );
                    })}
                  </div>
                  {selectedFiles.some(file => {
                    const fileName = file.name.replace(/\.[^/.]+$/, '');
                    const sanitizedName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    const existingNames = uploadedMedia.map(media => media.name?.toLowerCase());
                    return existingNames.includes(sanitizedName);
                  }) && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        ⚠️ Some files have names that already exist. Please rename them or remove them from selection.
                      </div>
                    )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={
                    isImporting ||
                    selectedFiles.length === 0 ||
                    selectedFiles.some((file) => {
                      const fileName = file.name.replace(/\.[^/.]+$/, '');
                      const sanitizedName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                      const existingNames = uploadedMedia.map((media) => media.name?.toLowerCase());
                      return existingNames.includes(sanitizedName);
                    })
                  }
                  className="flex-1 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Uploading...' : 'Upload to Cloudinary'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFiles([]);
                  }}
                  className="transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Export {activeTab === 'gallery' ? 'Product Images' : 'Uploaded Images'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>
                  Export all {activeTab === 'gallery' ? filteredProducts.length : filteredUploadedMedia.length}
                  {activeTab === 'gallery' ? ' product images' : ' uploaded images'} as a ZIP file.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Images will be named based on {activeTab === 'gallery' ? 'product titles' : 'uploaded file names'} and downloaded as a single ZIP file.
                </p>
                {isExporting && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700">Processing images in batches for faster export...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={activeTab === 'gallery' ? handleExport : handleUploadExport}
                  disabled={
                    isExporting ||
                    (activeTab === 'gallery' ? filteredProducts.length === 0 : filteredUploadedMedia.length === 0)
                  }
                  className="flex-1 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? 'Exporting...' : `Export All ${activeTab === 'gallery' ? 'Product' : 'Uploaded'} Images`}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                  className="transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-600">Confirm Bulk Delete</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Are you sure you want to delete <strong>{selectedItems.length}</strong> media items?</p>
                <p className="mt-2 text-red-600 font-medium">This action cannot be undone.</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete {selectedItems.length} Items
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Media;

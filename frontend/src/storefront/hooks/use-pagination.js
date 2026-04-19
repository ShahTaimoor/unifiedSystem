import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing pagination state and logic
 * Eliminates pagination duplication across components
 */
export const usePagination = ({
  initialPage = 1,
  initialLimit = 24,
  totalItems = 0,
  onPageChange = null,
  onLimitChange = null
} = {}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / limit);
  }, [totalItems, limit]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalItems);
    
    return {
      startItem,
      endItem,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
  }, [currentPage, limit, totalItems, totalPages]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    const pageNumber = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(pageNumber);
    
    // Call custom page change handler if provided
    if (onPageChange && typeof onPageChange === 'function') {
      onPageChange(pageNumber);
    }
  }, [totalPages, onPageChange]);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, paginationInfo.hasNextPage, handlePageChange]);

  // Navigate to previous page
  const goToPreviousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, paginationInfo.hasPreviousPage, handlePageChange]);

  // Navigate to first page
  const goToFirstPage = useCallback(() => {
    handlePageChange(1);
  }, [handlePageChange]);

  // Navigate to last page
  const goToLastPage = useCallback(() => {
    handlePageChange(totalPages);
  }, [handlePageChange, totalPages]);

  // Reset to first page
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Update total items and reset if current page is invalid
  const updateTotalItems = useCallback((newTotalItems) => {
    const newTotalPages = Math.ceil(newTotalItems / limit);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  }, [currentPage, limit]);

  // Update page size and reset pagination
  const handleLimitChange = useCallback((newLimit) => {
    const parsedLimit = Math.max(1, parseInt(newLimit, 10) || initialLimit);
    setLimit(parsedLimit);
    setCurrentPage(1);
    if (onLimitChange && typeof onLimitChange === 'function') {
      onLimitChange(parsedLimit);
    }
  }, [initialLimit, onLimitChange]);

  // Generate visible page numbers for pagination component
  const getVisiblePages = useCallback((maxVisible = 5) => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages = [];
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed
    if (start > 1) {
      pages.unshift(1);
      if (start > 2) {
        pages.splice(1, 0, '...');
      }
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  return {
    // State
    currentPage,
    limit,
    totalPages,
    totalItems,
    
    // Computed values
    ...paginationInfo,
    
    // Actions
    setCurrentPage: handlePageChange,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    resetPagination,
    updateTotalItems,
    getVisiblePages,
    setLimit: handleLimitChange
  };
};

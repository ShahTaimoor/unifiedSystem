import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchSearchSuggestions } from '@/redux/slices/products/productSlice';
import { Input } from '../ui/input';
import { Search, X, Loader2 } from 'lucide-react';
import LazyImage from '../ui/LazyImage';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Capitalize first letter of each word
 */
const capitalizeWords = (text) => {
    if (!text) return text;
    return text.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
};

/**
 * Highlight keywords in text
 */
const highlightKeywords = (text, keywords) => {
    if (!text || !keywords || keywords.length === 0) return text;
    
    const lowerText = text.toLowerCase();
    const parts = [];
    let lastIndex = 0;
    
    // Sort keywords by length (longest first) to avoid partial matches
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    
    // Find all matches
    const matches = [];
    sortedKeywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        let index = lowerText.indexOf(lowerKeyword, lastIndex);
        while (index !== -1) {
            matches.push({ start: index, end: index + lowerKeyword.length, keyword });
            index = lowerText.indexOf(lowerKeyword, index + 1);
        }
    });
    
    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);
    
    // Merge overlapping matches
    const mergedMatches = [];
    for (const match of matches) {
        if (mergedMatches.length === 0) {
            mergedMatches.push(match);
        } else {
            const lastMatch = mergedMatches[mergedMatches.length - 1];
            if (match.start <= lastMatch.end) {
                // Merge overlapping matches
                lastMatch.end = Math.max(lastMatch.end, match.end);
            } else {
                mergedMatches.push(match);
            }
        }
    }
    
    // Build highlighted text
    if (mergedMatches.length === 0) {
        return text;
    }
    
    const result = [];
    let currentIndex = 0;
    
    mergedMatches.forEach(match => {
        // Add text before match
        if (match.start > currentIndex) {
            result.push(text.substring(currentIndex, match.start));
        }
        // Add highlighted match
        result.push(
            <mark key={match.start} className="bg-yellow-200 font-semibold px-0.5 rounded">
                {text.substring(match.start, match.end)}
            </mark>
        );
        currentIndex = match.end;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
        result.push(text.substring(currentIndex));
    }
    
    return result;
};

const SearchSuggestions = ({ 
  placeholder = "Search products...", 
  onSelectProduct,
  onSearch,
  className = "",
  inputClassName = "",
  showButton = false,
  buttonText = "Search",
  value,
  onChange
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  // Initialize state from URL if not controlled
  const initialSearchValue = value !== undefined ? value : (searchParams.get('search') || '');
  const [internalSearchQuery, setInternalSearchQuery] = useState(initialSearchValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const suggestionsRef = useRef(null);
  const prevUrlSearchRef = useRef(initialSearchValue);

  // Get current search value from URL (as string for dependency tracking)
  const urlSearchValue = searchParams.get('search') || '';

  // Sync internal state with URL search param if not controlled
  useEffect(() => {
    if (value === undefined) {
      // Only update if URL value actually changed
      if (urlSearchValue !== prevUrlSearchRef.current) {
        prevUrlSearchRef.current = urlSearchValue;
        setInternalSearchQuery(urlSearchValue);
        // Hide suggestions when search is cleared or when navigating to search results
        if (!urlSearchValue) {
          setShowSuggestions(false);
          setSelectedIndex(-1);
        } else {
          // Hide suggestions when URL changes to search results (navigation happened)
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
      }
    }
  }, [urlSearchValue, value]);

  // Use controlled value if provided, otherwise use internal state
  const searchQuery = value !== undefined ? value : internalSearchQuery;

  const { suggestions, suggestionsStatus, suggestionsQuery } = useSelector((state) => state.products);
  
  // Extract keywords from query for highlighting
  const keywords = useMemo(() => {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from']);
    return searchQuery
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0 && !stopWords.has(word));
  }, [searchQuery]);
  
  // Get unique products from suggestions
  const uniqueSuggestions = useMemo(() => {
    if (!suggestions?.products || suggestions.products.length === 0) return [];
    
    const uniqueResults = [];
    const seenIds = new Set();
    
    for (const product of suggestions.products) {
      const productId = product._id?.toString();
      if (productId && !seenIds.has(productId)) {
        seenIds.add(productId);
        uniqueResults.push(product);
      }
    }
    
    return uniqueResults;
  }, [suggestions]);
  
  // Debounce search query for API calls (300-500ms as per requirements)
  const debouncedQuery = useDebounce(searchQuery, 400);

  // Fetch suggestions when debounced query changes (only if 2+ characters)
  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();
    if (trimmedQuery.length >= 2) {
      dispatch(fetchSearchSuggestions({ query: trimmedQuery, limit: 8 }));
    }
  }, [debouncedQuery, dispatch]);

  // Show suggestions when user types (only if 2+ characters as per requirements)
  // But don't show if the query matches the URL search param (meaning we're on search results page)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    const urlSearch = searchParams.get('search') || '';
    
    // Only show suggestions if:
    // 1. There's a query with 2+ characters (as per requirements)
    // 2. The query doesn't match the URL search param (meaning user is typing, not viewing results)
    if (trimmedQuery.length >= 2 && trimmedQuery !== urlSearch) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, searchParams]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const trimmedValue = newValue.trim();
    
    // If onChange is provided, it expects the value directly, not an event
    if (onChange && typeof onChange === 'function') {
      onChange(newValue);
    } else {
      setInternalSearchQuery(newValue);
    }
    setSelectedIndex(-1);
    
    // Show suggestions when typing (only if 2+ characters as per requirements)
    // Set this immediately based on the new value, not waiting for state to update
    if (trimmedValue.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    // Clear internal state
    setInternalSearchQuery('');
    
    // If onChange is provided (controlled mode), call it to clear the controlled value
    if (onChange && typeof onChange === 'function') {
      onChange('');
    }
    
    // Hide suggestions
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onChange]);

  // Handle product selection
  const handleSelectProduct = useCallback((product) => {
    // Update internal state always
    setInternalSearchQuery(product.title);
    // If onChange is provided (controlled mode), also call it
    if (onChange && typeof onChange === 'function') {
      onChange(product.title);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Scroll to top when selecting a product
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      // Navigate to product detail page by ID
      if (product._id) {
        navigate(`/product/${product._id}`);
      } else {
        // Fallback: navigate to products page with search
        navigate(`/products?search=${encodeURIComponent(product.title)}`);
      }
    }
  }, [navigate, onSelectProduct, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const totalItems = uniqueSuggestions.length + (suggestions?.categories?.length || 0);
    
    if (!showSuggestions || totalItems === 0) {
      if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < uniqueSuggestions.length) {
          handleSelectProduct(uniqueSuggestions[selectedIndex]);
        } else if (selectedIndex >= uniqueSuggestions.length) {
          // Category selected
          const categoryIndex = selectedIndex - uniqueSuggestions.length;
          const category = suggestions?.categories?.[categoryIndex];
          if (category) {
            handleSearch();
          }
        } else if (searchQuery.trim().length >= 2) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle search button click
  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) {
      return;
    }
    setShowSuggestions(false);
    
    // Scroll to top when searching
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (onSearch) {
      onSearch(trimmedQuery);
    } else if (!onSelectProduct) {
      navigate(`/products?search=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [searchQuery, navigate, onSelectProduct, onSearch]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const isLoading = suggestionsStatus === 'loading' && searchQuery.trim().length >= 2;
  const hasProducts = uniqueSuggestions && uniqueSuggestions.length > 0;
  const hasCategories = suggestions?.categories && suggestions.categories.length > 0;
  const hasResults = hasProducts || hasCategories;
  const showDropdown = showSuggestions && searchQuery.trim().length >= 2;

  return (
    <div className={`relative ${className}`} ref={searchContainerRef}>
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          {/* Search icon on left for desktop, hidden on mobile */}
          {!isMobile && (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
          )}
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              const trimmedQuery = searchQuery.trim();
              if (trimmedQuery.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            className={`${isMobile ? (searchQuery ? 'pl-3 pr-24' : 'pl-3 pr-12') : 'pl-10 pr-10'} ${isMobile ? 'border-primary focus-visible:border-primary' : ''} ${inputClassName}`}
          />
          {/* Right side buttons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {/* Clear button - shown when there's text */}
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            )}
            {/* Search icon button on right for mobile */}
            {isMobile && (
              <button
                onClick={handleSearch}
                disabled={suggestionsStatus === 'loading' || !searchQuery.trim()}
                className="bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-2 rounded-md"
                aria-label="Search"
              >
                {suggestionsStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Search className="h-4 w-4 md:h-5 md:w-5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
        {showButton && !isMobile && (
          <button
            onClick={handleSearch}
            disabled={suggestionsStatus === 'loading' || !searchQuery.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {suggestionsStatus === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              buttonText
            )}
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-gray-600">Searching...</span>
            </div>
          ) : hasResults ? (
            <div ref={suggestionsRef} className="py-1">
              {/* Product Suggestions */}
              {uniqueSuggestions.map((product, index) => {
                const productImage = product.image || product.picture?.secure_url || '/logo.jpeg';
                const isSelected = index === selectedIndex;
                
                return (
                  <div
                    key={product._id}
                    onClick={() => handleSelectProduct(product)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                      <LazyImage
                        src={productImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        fallback="/logo.jpeg"
                        quality={80}
                      />
                    </div>
                    
                    {/* Product Info with Highlighted Keywords */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm md:text-base text-gray-900 line-clamp-2">
                        {highlightKeywords(capitalizeWords(product.title), keywords)}
                      </h4>
                      {product.category?.name && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          in {highlightKeywords(capitalizeWords(product.category.name), keywords)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Category Suggestions */}
              {hasCategories && (
                <>
                  {uniqueSuggestions.length > 0 && (
                    <div className="border-t border-gray-200 my-1"></div>
                  )}
                  {suggestions.categories.map((category, index) => {
                    const categoryIndex = uniqueSuggestions.length + index;
                    const isSelected = categoryIndex === selectedIndex;
                    
                    return (
                      <div
                        key={`category-${category}`}
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/products?category=${encodeURIComponent(category.toLowerCase())}`);
                        }}
                        className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-l-4 border-primary'
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 font-medium">
                            <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                            Category: {highlightKeywords(capitalizeWords(category), keywords)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No products found matching all keywords &quot;{debouncedQuery}&quot;
            </div>
          )}
          
          {/* View All Results Link */}
          {hasResults && debouncedQuery.trim().length >= 2 && (
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  setShowSuggestions(false);
                  // Scroll to top when viewing all results
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  if (onSearch) {
                    onSearch(debouncedQuery.trim());
                  } else if (!onSelectProduct) {
                    navigate(`/products?search=${encodeURIComponent(debouncedQuery.trim())}`);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors flex items-center justify-between"
              >
                <span>View all results for &quot;{debouncedQuery}&quot;</span>
                <Search className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;

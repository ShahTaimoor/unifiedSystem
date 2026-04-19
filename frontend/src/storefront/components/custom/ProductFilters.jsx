import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Filter, SortAsc, Grid3X3, List, TrendingUp } from 'lucide-react';
import SearchSuggestions from './SearchSuggestions';

const ProductFilters = ({
  category,
  stockFilter,
  sortBy,
  gridType,
  categorySearch,
  searchQuery,
  filteredCategories,
  onCategoryChange,
  onStockFilterChange,
  onSortChange,
  onGridTypeChange,
  onCategorySearchChange,
  onSearchChange,
  onSearchSelect,
  onSearchTrigger,
  getCategoryDisplayName,
  getStockDisplayName,
  getSortDisplayName,
  hasSearched,
  searchStatus,
  uniqueSearchResultsCount
}) => {
  return (
    <div className="bg-white rounded border border-gray-200 p-2 sm:p-3 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
        <div className="relative flex-1 min-w-0 flex items-center gap-2">
          <div className="relative flex-1 min-w-0 [&>div>div>div>svg[class*='left']]:hidden">
            <SearchSuggestions
              placeholder="Search products..."
              onSelectProduct={onSearchSelect}
              onSearch={onSearchTrigger}
              value={searchQuery}
              onChange={onSearchChange}
              showButton={false}
              inputClassName="h-8 sm:h-9 text-xs sm:text-sm pl-3 pr-10 border-gray-300 rounded"
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGridTypeChange('grid2')}
              className={`h-8 w-8 p-0 rounded ${
                gridType === 'grid2' 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGridTypeChange('grid3')}
              className={`h-8 w-8 p-0 rounded ${
                gridType === 'grid3' 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            onClick={() => onSearchTrigger(searchQuery)}
            className="hidden sm:flex h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded whitespace-nowrap text-sm flex-shrink-0"
          >
            Search
          </Button>
        </div>
        
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGridTypeChange('grid2')}
            className={`h-9 w-9 p-0 rounded ${
              gridType === 'grid2' 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGridTypeChange('grid3')}
            className={`h-9 w-9 p-0 rounded ${
              gridType === 'grid3' 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm rounded flex-1 sm:flex-initial sm:min-w-[120px] overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 min-w-0 flex-1">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                <SelectValue className="flex-1 min-w-0">
                  <span className="truncate block">{getCategoryDisplayName()}</span>
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => onCategorySearchChange(e.target.value)}
                  className="mb-2 h-8 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id} className="text-sm">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={stockFilter} onValueChange={onStockFilterChange}>
            <SelectTrigger className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm rounded flex-1 sm:flex-initial sm:min-w-[140px] overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 min-w-0 flex-1">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                <SelectValue className="flex-1 min-w-0">
                  <span className="truncate block">{getStockDisplayName()}</span>
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="active">In Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-8 sm:h-9 border-gray-300 text-xs sm:text-sm rounded flex-1 sm:flex-initial sm:min-w-[140px] overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 min-w-0 flex-1">
                <SortAsc className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                <SelectValue className="flex-1 min-w-0">
                  <span className="truncate block">{getSortDisplayName()}</span>
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="az">Name A-Z</SelectItem>
              <SelectItem value="za">Name Z-A</SelectItem>
              <SelectItem value="price-low">Price Low-High</SelectItem>
              <SelectItem value="price-high">Price High-Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="stock-high">Stock High-Low</SelectItem>
              <SelectItem value="stock-low">Stock Low-High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {hasSearched && searchQuery && (
        <div className="mt-2 text-[10px] sm:text-xs text-gray-600">
          {searchStatus === 'loading' ? (
            'Searching...'
          ) : uniqueSearchResultsCount > 0 ? (
            `Found ${uniqueSearchResultsCount} result${uniqueSearchResultsCount !== 1 ? 's' : ''} for "${searchQuery}"`
          ) : (
            `No results found for "${searchQuery}"`
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFilters;


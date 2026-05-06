import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckSquare, Square, Star } from 'lucide-react';

const BulkActionsBar = ({
  selectedProducts,
  sortedProducts,
  isBulkUpdating,
  onSelectAll,
  onBulkStockUpdate,
  onBulkMarkFeatured,
  onClearSelection
}) => {
  if (selectedProducts.length === 0) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          onClick={onSelectAll}
          className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title={selectedProducts.length === sortedProducts.length ? 'Deselect all' : 'Select all'}
        >
          {selectedProducts.length === sortedProducts.length && sortedProducts.length > 0 ? (
            <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
          ) : (
            <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
          )}
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Products ({sortedProducts.length})
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          onClick={onSelectAll}
          className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title={selectedProducts.length === sortedProducts.length ? 'Deselect all' : 'Select all'}
        >
          {selectedProducts.length === sortedProducts.length && sortedProducts.length > 0 ? (
            <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
          ) : (
            <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
          )}
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Products ({sortedProducts.length})
        </h2>
        <Badge variant="default" className="px-1.5 sm:px-2 py-0.5 bg-blue-600 text-[10px] sm:text-xs">
          {selectedProducts.length} selected
        </Badge>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkStockUpdate(0)}
          disabled={isBulkUpdating}
          className="border-gray-300 text-red-600 hover:bg-red-50 h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
        >
          <span className="hidden sm:inline">Mark Out of Stock</span>
          <span className="sm:hidden">Out Stock</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkStockUpdate(1)}
          disabled={isBulkUpdating}
          className="border-gray-300 text-green-600 hover:bg-green-50 h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
        >
          <span className="hidden sm:inline">Mark In Stock</span>
          <span className="sm:hidden">In Stock</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onBulkMarkFeatured(true)}
          disabled={isBulkUpdating}
          className="bg-blue-600 hover:bg-blue-700 text-white h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
        >
          <Star className="h-3 w-3 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          <span className="hidden sm:inline">Featured</span>
          <span className="sm:hidden">Star</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkMarkFeatured(false)}
          disabled={isBulkUpdating}
          className="border-gray-300 h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
        >
          <span className="hidden sm:inline">Remove Featured</span>
          <span className="sm:hidden">Remove</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-gray-600 h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-1 sm:flex-initial"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;


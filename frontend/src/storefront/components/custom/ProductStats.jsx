import React from 'react';
import { PackageSearch, TrendingUp, BarChart3, Star } from 'lucide-react';

const ProductStats = ({ totalItems, products, categories }) => {
  const inStockCount = products.filter(p => p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const categoriesCount = categories?.length || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      <div className="bg-white rounded border border-gray-200 p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <PackageSearch className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{totalItems}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 truncate">Total Products</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded border border-gray-200 p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{inStockCount}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 truncate">In Stock</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded border border-gray-200 p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{outOfStockCount}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 truncate">Out of Stock</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded border border-gray-200 p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{categoriesCount}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 truncate">Categories</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductStats;


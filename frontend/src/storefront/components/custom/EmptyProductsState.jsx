import React from 'react';
import { Button } from '../ui/button';
import { PackageSearch, Plus } from 'lucide-react';

const EmptyProductsState = ({ stockFilter, onClearFilters, onCreateProduct }) => {
  return (
    <div className="bg-white rounded border border-gray-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageSearch className="h-8 w-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {stockFilter !== 'all' 
            ? 'No matching products' 
            : 'No products found'
          }
        </h3>
        
        <p className="text-gray-600 text-sm mb-6">
          {stockFilter !== 'all'
            ? 'Try adjusting your filters.'
            : 'Get started by creating your first product.'
          }
        </p>
        
        <div className="flex justify-center gap-2">
          {stockFilter !== 'all' ? (
            <>
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="px-4 border-gray-300 hover:bg-gray-100"
              >
                Clear Filters
              </Button>
              <Button
                onClick={onCreateProduct}
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </>
          ) : (
            <Button
              onClick={onCreateProduct}
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyProductsState;


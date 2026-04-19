import React from 'react';
import ProductList from '@/components/custom/ProductList';

/**
 * Public Products Page - Shows all products with search and filtering
 * Accessible at /products route
 */
const Products = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ProductList />
    </div>
  );
};

export default Products;


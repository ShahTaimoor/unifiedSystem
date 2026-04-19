import React, { useMemo } from 'react';
import ProductCard from './ProductCard';
import OneLoader from '../ui/OneLoader';

const ProductGrid = React.memo(({ 
  products, 
  loading, 
  gridType, 
  quantities, 
  onQuantityChange, 
  onAddToCart, 
  addingProductId, 
  cartItems, 
  onPreviewImage
}) => {
  const isInCartMap = useMemo(() => {
    const map = new Map();
    cartItems.forEach(item => {
      const productId = item.product?._id || item.product;
      if (productId) {
        map.set(productId, true);
      }
    });
    return map;
  }, [cartItems]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <OneLoader size="large" text="Loading Products..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </p>
          <p className="text-sm text-gray-500 mb-4">
            We couldn't find any products matching your search.
          </p>
          <p className="text-xs text-gray-400">
            Try adjusting your search terms or browse our categories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-2 sm:px-0 ${
      gridType === 'grid2' 
        ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2' 
        : 'flex flex-col space-y-0.5'
    }`}>
      {products.filter(product => product && product._id).map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          quantity={quantities[product._id] ?? 0}
          onQuantityChange={onQuantityChange}
          onAddToCart={onAddToCart}
          isAddingToCart={addingProductId === product._id}
          isInCart={isInCartMap.get(product._id) || false}
          gridType={gridType}
          setPreviewImage={onPreviewImage}
        />
      ))}
    </div>
  );
});

export default ProductGrid;


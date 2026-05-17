import React from 'react';

const ProductSkeleton = ({ gridType }) => {
  return (
    <div
      className={`border border-gray-200/80 rounded-xl overflow-hidden shadow-sm flex h-full bg-white ${
        gridType === 'grid3' ? 'flex-row items-stretch' : 'flex-col'
      }`}
    >
      {/* Image Skeleton */}
      <div
        className={`relative overflow-hidden bg-gray-200 animate-pulse ${
          gridType === 'grid3'
            ? 'w-1/4 sm:w-1/8 aspect-square'
            : 'aspect-square w-full'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* Content Skeleton */}
      <div
        className={`p-4 flex flex-col flex-grow ${
          gridType === 'grid3' ? 'w-3/4 sm:w-7/8' : 'w-full'
        }`}
      >
        {/* Title Placeholder */}
        <div className="relative overflow-hidden h-4 bg-gray-200 rounded w-3/4 mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
        <div className="relative overflow-hidden h-4 bg-gray-200 rounded w-1/2 mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>

        <div className="flex-grow" />

        {/* Action Controls Placeholder */}
        <div className="flex flex-row gap-2.5 mt-auto">
          {/* Quantity selector placeholder */}
          <div className="relative overflow-hidden h-10 sm:h-9 bg-gray-100 border border-gray-200/60 rounded-lg w-[63%] lg:w-1/2">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
          {/* Add-to-cart button placeholder */}
          <div className="relative overflow-hidden h-10 sm:h-9 bg-gray-200 rounded-lg w-[37%] lg:w-1/2">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton = ({ count = 8, gridType }) => {
  return (
    <div className={`px-2 sm:px-0 ${
      gridType === 'grid2' 
        ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1' 
        : 'flex flex-col space-y-0.5'
    }`}>
      {[...Array(count)].map((_, i) => (
        <ProductSkeleton key={i} gridType={gridType} />
      ))}
    </div>
  );
};

export default ProductSkeleton;

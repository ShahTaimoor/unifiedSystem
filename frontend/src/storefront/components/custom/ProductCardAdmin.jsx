import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import LazyImage from '../ui/LazyImage';
import { Trash2, Edit, Eye, Star, TrendingUp, CheckSquare, Square } from 'lucide-react';

const ProductCardAdmin = ({
  product,
  index,
  gridType,
  isSelected,
  editingPriceId,
  editingPriceValue,
  editingStockId,
  editingStockValue,
  isUpdatingPrice,
  isUpdatingStock,
  isUpdatingFeatured,
  onSelect,
  onEdit,
  onDelete,
  onToggleFeatured,
  onStockToggle,
  onStartEditPrice,
  onCancelEditPrice,
  onSavePrice,
  onStartEditStock,
  onCancelEditStock,
  onSaveStock,
  onPreviewImage,
  onPriceValueChange,
  onStockValueChange
}) => {
  // Capitalize first letter of each word
  const capitalizeTitle = (title) => {
    if (!title) return '';
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  return (
    <Card 
      className={`group relative overflow-hidden bg-white border border-gray-200 hover:border-gray-300 transition-colors ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${
        gridType === 'grid3' ? 'flex flex-row items-center gap-4 p-3' : 'p-0'
      }`}
    >
      <div className="absolute top-2 left-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product._id);
          }}
          className="p-1 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors"
          title={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>

      {product.isFeatured && (
        <div className="absolute top-2 right-2 z-10">
          <div className="p-1.5 rounded-full shadow-sm">
            <Star className="h-4 w-4 text-red-500 fill-red-500" />
          </div>
        </div>
      )}

      <div 
        className={`relative overflow-hidden bg-gray-100 cursor-pointer ${
          gridType === 'grid3' 
            ? 'w-20 h-20 flex-shrink-0 rounded border border-gray-200' 
            : 'aspect-square w-full border-b border-gray-200'
        }`}
        onClick={() => onPreviewImage(product.image || product.picture?.secure_url)}
      >
        <LazyImage
          src={(() => {
            const imageUrl = product.image || product.picture?.secure_url;
            if (!imageUrl) return imageUrl;
            // Always add cache-busting parameter with timestamp to force reload
            const separator = imageUrl.includes('?') ? '&' : '?';
            const timestamp = product._imageUpdated || Date.now();
            return `${imageUrl}${separator}_t=${timestamp}`;
          })()}
          alt={product.title}
          className="w-full h-full object-cover"
          fallback="/logo.jpeg"
          quality={90}
          loading="eager"
          key={`${product._id}-${product._imageUpdated || product.picture?.secure_url || product.image || 'default'}`}
        />
        
        {!product.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge 
              className={`px-1.5 py-0.5 text-xs font-medium border-0 ${
                product.stock > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Badge>
          </div>
        )}

        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white rounded-full p-2">
            <Eye className="h-4 w-4 text-gray-900" />
          </div>
        </div>
      </div>

      <div className={`${gridType === 'grid3' ? 'flex-1 space-y-1.5' : 'p-3 sm:p-4 space-y-2 sm:space-y-3'}`}>
        <div className="space-y-1">
          <h3 className="font-medium text-[10px] sm:text-xs text-gray-900">
            {capitalizeTitle(product.title)}
          </h3>
          
          <p className="text-gray-600 text-[10px] sm:text-xs line-clamp-2">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            {editingPriceId === product._id ? (
              <div className="flex items-center gap-1.5 sm:gap-2 relative z-0">
                <Input
                  type="number"
                  value={editingPriceValue}
                  onChange={(e) => onPriceValueChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSavePrice(product._id);
                    } else if (e.key === 'Escape') {
                      onCancelEditPrice();
                    }
                  }}
                  className="h-7 sm:h-8 text-xs sm:text-sm font-semibold border-blue-500 focus:ring-1 focus:ring-blue-500 w-20 sm:w-24"
                  autoFocus
                  disabled={isUpdatingPrice}
                />
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSavePrice(product._id);
                  }}
                  disabled={isUpdatingPrice}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-green-600 hover:bg-green-700"
                  type="button"
                >
                  ✓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelEditPrice();
                  }}
                  disabled={isUpdatingPrice}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  type="button"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                  PKR {product.price?.toLocaleString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEditPrice(product);
                  }}
                  className="p-0.5 sm:p-1 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Edit price"
                >
                  <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 hover:text-blue-600" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {editingStockId === product._id ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Input
                    type="number"
                    value={editingStockValue}
                    onChange={(e) => onStockValueChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSaveStock(product._id);
                      } else if (e.key === 'Escape') {
                        onCancelEditStock();
                      }
                    }}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs font-semibold border-blue-500 focus:ring-1 focus:ring-blue-500 w-16 sm:w-20"
                    autoFocus
                    disabled={isUpdatingStock}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveStock(product._id);
                    }}
                    disabled={isUpdatingStock}
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-green-600 hover:bg-green-700"
                    type="button"
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelEditStock();
                    }}
                    disabled={isUpdatingStock}
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                    type="button"
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                    Stock: {product.stock}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEditStock(product);
                    }}
                    className="p-0.5 sm:p-1 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Edit stock"
                  >
                    <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 hover:text-blue-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center ml-2 sm:ml-4 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFeatured(product);
              }}
              disabled={isUpdatingFeatured}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={product.isFeatured ? 'Unmark as featured' : 'Mark as featured'}
            >
              <Star className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                product.isFeatured 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-400 hover:text-red-400'
              }`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
            className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs border-gray-300 hover:bg-gray-100"
          >
            Edit
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(product._id)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStockToggle(product)}
            className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${
              product.stock > 0 
                ? 'text-orange-600 hover:bg-orange-50' 
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={product.stock > 0 ? 'Mark Out of Stock' : 'Mark In Stock'}
          >
            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCardAdmin;


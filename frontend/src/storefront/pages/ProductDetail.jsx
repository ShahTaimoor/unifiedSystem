import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSingleProduct } from '@/redux/slices/products/productSlice';
import { addToCart } from '@/redux/slices/cart/cartSlice';
import { useAuthDrawer } from '@/contexts/AuthDrawerContext';
import { useToast } from '@/hooks/use-toast';
import LazyImage from '@/components/ui/LazyImage';
import OneLoader from '@/components/ui/OneLoader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useAuthDrawer();
  const toast = useToast();
  
  const { singleProducts, status } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Fetch product on mount
  useEffect(() => {
    if (id) {
      dispatch(getSingleProduct(id));
    }
  }, [id, dispatch]);

  // Track initial mount to avoid showing toast on first render
  useEffect(() => {
    if (singleProducts) {
      setIsInitialMount(false);
    }
  }, [singleProducts]);

  // Find if product is in cart
  const cartItem = cartItems.find(item => item.product?._id === id);
  const isInCart = !!cartItem;
  const currentCartQuantity = cartItem?.quantity || 0;

  const handleQuantityChange = useCallback((delta) => {
    if (!singleProducts) return;
    const newQuantity = Math.max(1, Math.min(quantity + delta, singleProducts.stock));
    if (newQuantity !== quantity) {
      setQuantity(newQuantity);
      if (!isInitialMount) {
        toast.success(`Quantity updated to ${newQuantity}`);
      }
    } else if (delta > 0 && quantity >= singleProducts.stock) {
      toast.info(`Maximum available quantity is ${singleProducts.stock}`);
    } else if (delta < 0 && quantity <= 1) {
      toast.info('Minimum quantity is 1');
    }
  }, [quantity, singleProducts, isInitialMount, toast]);

  const handleAddToCart = useCallback(async () => {
    if (!user) {
      openDrawer('login');
      return;
    }

    if (!singleProducts || singleProducts.stock <= 0) {
      toast.error('This product is currently out of stock.');
      return;
    }

    setIsAddingToCart(true);
    try {
      await dispatch(addToCart({
        productId: singleProducts._id,
        quantity: quantity,
        product: singleProducts,
      })).unwrap();
      
      toast.success(`${quantity} ${quantity === 1 ? 'item' : 'items'} of ${singleProducts.title} added to cart successfully!`);
    } catch (error) {
      toast.error(error || 'Failed to add product to cart.');
    } finally {
      setIsAddingToCart(false);
    }
  }, [user, singleProducts, quantity, dispatch, openDrawer, toast]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OneLoader size="large" text="Loading product..." />
      </div>
    );
  }

  if (!singleProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const productImage = singleProducts.picture?.secure_url || singleProducts.image || '/logo.jpeg';
  const isOutOfStock = singleProducts.stock <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-12">
            {/* Product Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <LazyImage
                src={productImage}
                alt={singleProducts.title}
                className="w-full h-full object-cover"
                fallback="/logo.jpeg"
                quality={90}
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {singleProducts.title}
                </h1>
              </div>

              {/* Quantity and Add to Cart */}
              {!isOutOfStock && (
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={singleProducts.stock}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          const newQuantity = Math.max(1, Math.min(val, singleProducts.stock));
                          if (newQuantity !== quantity) {
                            setQuantity(newQuantity);
                            if (!isInitialMount) {
                              toast.success(`Quantity updated to ${newQuantity}`);
                            }
                          }
                          if (val > singleProducts.stock && !isInitialMount) {
                            toast.info(`Maximum available quantity is ${singleProducts.stock}`);
                          }
                        }}
                        className="w-16 text-center border-0 focus:outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= singleProducts.stock}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || isOutOfStock}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-semibold"
                    size="lg"
                  >
                    {isAddingToCart ? (
                      <>
                        <OneLoader size="small" showText={false} />
                        <span className="ml-2">Adding...</span>
                      </>
                    ) : isInCart ? (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        In Cart ({currentCartQuantity})
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isOutOfStock && (
                <div className="border-t pt-6">
                  <Button
                    disabled
                    className="w-full bg-gray-400 cursor-not-allowed text-white py-6 text-lg font-semibold"
                    size="lg"
                  >
                    Out of Stock
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Loader2, AlertCircle } from 'lucide-react';
import {
  removeFromCart,
  updateCartQuantity,
} from '@/redux/slices/cart/cartSlice';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import CartImage from '../ui/CartImage';
import Checkout from '@/pages/Checkout';
import { useAuthDrawer } from '@/contexts/AuthDrawerContext';
import { useToast } from '@/hooks/use-toast';

// Optimized CartProduct component with memoization
const CartProduct = React.memo(({ product, quantity, onValidationChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [inputQty, setInputQty] = useState(quantity);
  const [isRemoving, setIsRemoving] = useState(false);
  const prevIsValid = useRef(true);
  const updateTimeoutRef = useRef(null);
  const { _id, title, stock } = product;
  const image = product.image || product.picture?.secure_url;
  const isOutOfStock = product.isOutOfStock || stock <= 0;
  const availableStock = product.availableStock !== undefined ? product.availableStock : stock;

  // Sync input with prop changes
  useEffect(() => {
    setInputQty(quantity);
  }, [quantity]);

  // Validation effect
  useEffect(() => {
    const isValid = !isOutOfStock && inputQty > 0 && inputQty <= availableStock && typeof inputQty === 'number';
    if (prevIsValid.current !== isValid) {
      prevIsValid.current = isValid;
      onValidationChange(_id, isValid);
    }
  }, [inputQty, availableStock, isOutOfStock, _id, onValidationChange]);

  // Immediate quantity update with optimistic UI
  const updateQuantity = useCallback((newQty) => {
    if (!isOutOfStock && newQty !== quantity && newQty > 0 && newQty <= availableStock) {
      // Immediate UI update
      setInputQty(newQty);
      // API call with shorter debounce for better responsiveness
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        dispatch(updateCartQuantity({ productId: _id, quantity: newQty }));
      }, 150); // Reduced to 150ms for faster response
    }
  }, [dispatch, _id, quantity, availableStock, isOutOfStock]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleBuyNow = useCallback(() => {
    if (isOutOfStock || inputQty > availableStock || inputQty <= 0) {
      return;
    }
    navigate('/');
  }, [inputQty, availableStock, isOutOfStock, navigate]);

  const handleRemove = useCallback(async (e) => {
    e.stopPropagation();
    setIsRemoving(true);
    try {
      await dispatch(removeFromCart(_id)).unwrap();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error(error || 'Failed to remove item from cart');
    } finally {
      setIsRemoving(false);
    }
  }, [dispatch, _id, toast]);

  const handleQuantityChange = useCallback((newQty) => {
    if (isOutOfStock) return;
    if (newQty === '' || isNaN(newQty)) {
      setInputQty('');
      return;
    }
    const val = Math.max(1, Math.min(parseInt(newQty), availableStock));
    updateQuantity(val);
  }, [availableStock, isOutOfStock, updateQuantity]);

  const handleInputChange = useCallback((e) => {
    if (isOutOfStock) return;
    const val = e.target.value;
    if (val === '') {
      setInputQty('');
    } else {
      const parsed = parseInt(val);
      if (!isNaN(parsed)) {
        if (parsed <= availableStock) {
          setInputQty(parsed);
        } else {
          setInputQty(availableStock);
        }
      }
    }
  }, [availableStock, isOutOfStock]);

  const handleInputBlur = useCallback(() => {
    if (isOutOfStock) {
      setInputQty(0);
      return;
    }
    if (inputQty === '' || isNaN(inputQty) || inputQty <= 0) {
      setInputQty(quantity);
      return;
    }
    if (inputQty > availableStock) {
      setInputQty(availableStock);
      return;
    }
    if (inputQty !== quantity) {
      dispatch(updateCartQuantity({ productId: _id, quantity: inputQty }));
    }
  }, [inputQty, quantity, availableStock, isOutOfStock, dispatch, _id]);

  const handleDecrease = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputQty > 1) {
      updateQuantity(inputQty - 1);
    }
  }, [inputQty, updateQuantity]);

  const handleIncrease = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && inputQty < availableStock) {
      updateQuantity(inputQty + 1);
    }
  }, [inputQty, availableStock, isOutOfStock, updateQuantity]);

  return (
    <>
      <style>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div
        className={`flex justify-between items-center gap-4 p-3 border-b transition ${
          isOutOfStock 
            ? 'bg-red-50 hover:bg-red-100 opacity-75' 
            : 'hover:bg-gray-50 cursor-pointer'
        }`}
        onClick={!isOutOfStock ? handleBuyNow : undefined}
      >
        <div className="flex items-center gap-4 flex-1">
          <CartImage
            src={image}
            alt={title}
            className={`w-28 h-20 rounded-lg border object-cover object-center ${
              isOutOfStock ? 'opacity-50' : ''
            }`}
            fallback="/fallback.jpg"
            quality={80}
          />
          <div className="max-w-[200px] flex-1">
            <h4 className={`font-semibold text-sm line-clamp-2 ${
              isOutOfStock ? 'text-gray-500' : 'text-gray-900'
            }`}>
              {title}
            </h4>
            {isOutOfStock && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>Out of Stock</span>
              </div>
            )}
            {!isOutOfStock && product.quantityAdjusted && (
              <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                <AlertCircle className="w-3 h-3" />
                <span>Quantity adjusted to {availableStock}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {isOutOfStock ? (
            <div className="text-xs text-red-600 font-medium px-2 py-1 bg-red-100 rounded">
              Unavailable
            </div>
          ) : (
            <div className="flex items-center gap-1 border rounded-full shadow-sm border-gray-300">
              <button
                type="button"
                onClick={handleDecrease}
                className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 select-none"
                disabled={inputQty <= 1}
              >
                −
              </button>
              <input
                type="number"
                value={inputQty === '' ? '' : inputQty}
                onChange={(e) => {
                  e.stopPropagation();
                  handleInputChange(e);
                }}
                onBlur={(e) => {
                  e.stopPropagation();
                  handleInputBlur();
                }}
                onClick={(e) => e.stopPropagation()}
                max={availableStock}
                min={1}
                className="w-10 text-center text-sm focus:outline-none bg-transparent appearance-none font-medium"
              />
              <button
                type="button"
                onClick={handleIncrease}
                className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 select-none"
                disabled={inputQty >= availableStock}
              >
                +
              </button>
            </div>
          )}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove from cart"
          >
            {isRemoving ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>
    </>
  );
});

CartProduct.displayName = 'CartProduct';

const CartDrawer = () => {
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openDrawer } = useAuthDrawer();
  const toast = useToast();
  
  // Memoized total quantity calculation
  const totalQuantity = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  );

  const [validationMap, setValidationMap] = useState({});
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);

  const handleValidationChange = useCallback((productId, isValid) => {
    setValidationMap((prev) => ({
      ...prev,
      [productId]: isValid,
    }));
  }, []);

  const handleRemove = useCallback((productId) => {
    dispatch(removeFromCart(productId))
      .unwrap()
      .then(() => {
        toast.success('Item removed from cart');
      })
      .catch((err) => {
        toast.error(err || 'Failed to remove item from cart');
      });
  }, [dispatch, toast]);

  const handleBuyNow = useCallback(() => {
    if (!user) {
      openDrawer('login');
      return;
    }
    if (cartItems.length === 0) {
      return;
    }
    const hasInvalidQty = Object.values(validationMap).includes(false);
    if (hasInvalidQty) {
      return;
    }
    setOpenCheckoutDialog(true);
  }, [user, navigate, cartItems.length, validationMap]);

  // Memoized cart items to prevent unnecessary re-renders
  // Filter out items with null/deleted products
  const memoizedCartItems = useMemo(() => 
    cartItems.filter((item) => item.product && item.product._id), 
    [cartItems]
  );

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            className="relative backdrop-blur-xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-xl p-3"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            }}
          >
            {totalQuantity > 0 && (
              <Badge className="absolute -top-1 -right-1 text-xs px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
                {totalQuantity}
              </Badge>
            )}
            <ShoppingCart
              strokeWidth={1.5}
              size={24}
              className="text-gray-700 hover:text-blue-600 transition-colors duration-300"
            />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">Your Cart</SheetTitle>
            <SheetDescription>Total Quantity: {totalQuantity}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {memoizedCartItems.length > 0 ? (
              memoizedCartItems.map((item) => (
                <CartProduct
                  key={item.product._id}
                  product={item.product}
                  quantity={item.quantity}
                  onValidationChange={handleValidationChange}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">Your cart is empty.</p>
            )}
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button
                onClick={handleBuyNow}
                disabled={
                  cartItems.length === 0 ||
                  Object.values(validationMap).includes(false) ||
                  memoizedCartItems.some(item => item.product.isOutOfStock || (item.product.stock || 0) <= 0)
                }
                className="w-full"
              >
                {memoizedCartItems.some(item => item.product.isOutOfStock || (item.product.stock || 0) <= 0)
                  ? 'Remove Out of Stock Items'
                  : 'Checkout'}
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      <Dialog open={openCheckoutDialog} onOpenChange={setOpenCheckoutDialog}>
        <DialogContent className="w-full lg:max-w-6xl h-[62vh] sm:h-[70vh] sm:w-[60vw] overflow-hidden p-0 bg-white rounded-xl shadow-xl flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your order</DialogDescription>
          </DialogHeader>
          <Checkout closeModal={() => setOpenCheckoutDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartDrawer;
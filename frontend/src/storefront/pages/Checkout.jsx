import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addOrder } from '@/redux/slices/order/orderSlice';
import { emptyCart, checkStock, removeFromCart } from '@/redux/slices/cart/cartSlice';
import { updateProfile } from '@/redux/slices/auth/authSlice';
import { Button } from '@/components/ui/button';
import OneLoader from '@/components/ui/OneLoader';
import {
  Check,
  Edit2,
  Home,
  MapPin,
  Phone,
  ShoppingBag,
  ShoppingCart,
  AlertCircle,
  Trash2,
  Package,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import CartImage from '@/components/ui/CartImage';

const Checkout = ({ closeModal }) => {
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  const { user, status } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    address: user?.address || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });

  const [showForm, setShowForm] = useState(!user?.address || !user?.phone || !user?.city);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    setFormData({
      address: user?.address || '',
      phone: user?.phone || '',
      city: user?.city || '',
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setShowForm(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err || 'Failed to update profile');
    }
  };

  const handleCheckout = async () => {
    const { address, phone, city } = formData;
    if (!address.trim() || !phone.trim() || !city.trim()) {
      return;
    }

    const validCartItems = cartItems.filter((item) => item.product && item.product._id);

    if (validCartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Allow orders even if stock would go negative
    // Stock validation is handled by backend

    const totalPrice = validCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const productArray = validCartItems.map((item) => ({
      id: item.product._id || item.product,
      quantity: item.quantity,
    }));

    try {
      setLoading(true);
      setError(null);
      
      const stockCheckResult = await dispatch(checkStock(productArray)).unwrap();
      
      if (!stockCheckResult.success || !stockCheckResult.isValid) {
        const errorMessages = [];
        
        if (stockCheckResult.outOfStockItems && stockCheckResult.outOfStockItems.length > 0) {
          const outOfStockNames = stockCheckResult.outOfStockItems
            .map(item => item.productTitle || 'Product')
            .join(', ');
          errorMessages.push(`Out of stock: ${outOfStockNames}`);
        }
        
        if (stockCheckResult.insufficientStockItems && stockCheckResult.insufficientStockItems.length > 0) {
          const insufficientMessages = stockCheckResult.insufficientStockItems.map(
            item => `"${item.productTitle}": Only ${item.availableStock} available`
          );
          errorMessages.push(...insufficientMessages);
        }
        
        const errorMsg = errorMessages.length > 0 
          ? errorMessages.join('. ')
          : 'Some products are no longer available in the requested quantities';
        
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      await dispatch(updateProfile({ address, phone, city })).unwrap();

      const orderData = {
        products: productArray,
        amount: totalPrice.toFixed(2),
        address,
        phone,
        city,
      };

      const res = await dispatch(addOrder(orderData)).unwrap();

      if (res.success) {
        dispatch(emptyCart());
        closeModal && closeModal();
        toast.success('Order placed successfully!');
        navigate('/success');
      }
    } catch (err) {
      const errorMessage = err?.message || err?.response?.data?.message || 'Something went wrong!';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = useMemo(() => {
    return cartItems
      .filter((item) => item.product && item.product._id)
      .reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cartItems]);

  const validCartItems = useMemo(() => {
    return cartItems.filter((item) => item.product && item.product._id);
  }, [cartItems]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {validCartItems.length} {validCartItems.length === 1 ? 'item' : 'items'} in your order
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Order Summary (Mobile: Full Width, Desktop: 2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-gray-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
                        <p className="text-sm text-gray-500">Where should we deliver your order?</p>
                      </div>
                    </div>
                    {!showForm && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="p-2 hover:bg-white/80 rounded-lg transition-colors touch-manipulation"
                        aria-label="Edit shipping information"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {!showForm ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-green-50/50 border border-green-200/50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          {user?.name && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shop Name</span>
                              <p className="text-sm font-medium text-gray-900 mt-1">{user.name}</p>
                            </div>
                          )}
                          {user?.username && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Username</span>
                              <p className="text-sm font-medium text-gray-900 mt-1">{user.username}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {user?.phone && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> Phone
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1">{user.phone}</p>
                              </div>
                            )}
                            {user?.city && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> City
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1">{user.city}</p>
                              </div>
                            )}
                          </div>
                          {user?.address && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                <Home className="w-3 h-3" /> Address
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 break-words">{user.address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Phone className="w-4 h-4 text-gray-500" />
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            inputMode="numeric"
                            maxLength={11}
                            pattern="[0-9]*"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base touch-manipulation bg-white"
                            placeholder="Enter your phone number (11 digits)"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="city" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            id="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base touch-manipulation bg-white"
                            placeholder="Enter your city"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Home className="w-4 h-4 text-gray-500" />
                          Complete Address
                        </label>
                        <textarea
                          name="address"
                          id="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows={4}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base resize-none touch-manipulation bg-white"
                          placeholder="Enter your complete address"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowForm(false)}
                          className="flex-1 border-gray-300 hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleProfileUpdate}
                          disabled={status === 'loading'}
                          className="flex-1 bg-primary hover:bg-primary/90 text-white"
                        >
                          {status === 'loading' ? (
                            <OneLoader size="small" text="Saving..." showText={false} />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Save Information
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <Alert className="border-red-200 bg-red-50/50 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-red-900 font-semibold">Order Issue</AlertTitle>
                  <AlertDescription className="text-red-700 text-sm mt-1 break-words">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Right Column - Order Summary (Mobile: Full Width, Desktop: 1/3) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden sticky top-6">
                {/* Order Items */}
                <div className="p-6 border-b border-gray-200/60">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {validCartItems.length > 0 ? (
                      validCartItems.map((item) => {
                        const isOutOfStock = item.product.isOutOfStock || (item.product.stock || 0) <= 0;
                        const image = item.product.image || item.product.picture?.secure_url;
                        return (
                          <div
                            key={item.product._id}
                            className={`flex gap-3 p-3 rounded-xl border transition-all ${
                              isOutOfStock 
                                ? 'bg-red-50/50 border-red-200/50' 
                                : 'bg-gray-50/50 border-gray-200/50 hover:bg-gray-100/50'
                            }`}
                          >
                            {image && (
                              <div className="flex-shrink-0">
                                <CartImage
                                  src={image}
                                  alt={item.product.title}
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-200"
                                  fallback="/fallback.jpg"
                                  quality={80}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-medium line-clamp-2 mb-1 ${
                                isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                              }`}>
                                {item.product.title}
                              </h3>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Quantity: {item.quantity}
                                </span>
                              </div>
                              {isOutOfStock && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Out of Stock</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                dispatch(removeFromCart(item.product._id));
                                toast.success('Item removed from cart');
                              }}
                              className="flex-shrink-0 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No items in cart</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              By placing your order, you agree to our{' '}
              <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>.
            </div>
            <Button
              onClick={handleCheckout}
              disabled={loading || validCartItems.length === 0 || showForm}
              className="w-full sm:w-auto min-w-[200px] bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all touch-manipulation"
            >
              {loading ? (
                <OneLoader size="small" text="Processing..." showText={false} />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Place Order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

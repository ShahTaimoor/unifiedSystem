import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/storefront/components/ui/button';
import { Input } from '@/storefront/components/ui/input';
import { Label } from '@/storefront/components/ui/label';
import OneLoader from '@/storefront/components/ui/OneLoader';
import { Eye, EyeOff, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { signupOrLogin } from '@/storefront/redux/slices/auth/authSlice';
import { useAuthDrawer } from '@/storefront/contexts/AuthDrawerContext';
import { useToast } from '@/storefront/hooks/use-toast';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/storefront/components/ui/drawer';

const AuthDrawer = () => {
  const { open, setOpen } = useAuthDrawer();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ shopName: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValues] = useState({
    shopName: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    username: ''
  });

  // Check if user is logged in, close drawer
  useEffect(() => {
    if (user && open) {
      setOpen(false);
    }
  }, [user, open, setOpen]);

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setInputValues({ shopName: '', password: '', phone: '', address: '', city: '', username: '' });
      setErrorMsg({ shopName: '', password: '' });
      setShowPassword(false);
    }
  }, [open]);

  // Validation function using Zod
  const validateForm = useCallback(async () => {
    const { authSchema } = await import('@/storefront/schemas/authSchemas');
    const result = authSchema.safeParse(inputValue);
    
    if (!result.success) {
      const errors = { shopName: '', password: '', phone: '', address: '', city: '', username: '' };
      // Safely access error.errors
      if (result.error && result.error.errors && Array.isArray(result.error.errors)) {
        result.error.errors.forEach((err) => {
          if (err && err.path && Array.isArray(err.path) && err.path.length > 0 && err.message) {
            const field = err.path[0];
            if (errors.hasOwnProperty(field)) {
              errors[field] = err.message;
            }
          }
        });
      }
      return errors;
    }
    
    return { shopName: '', password: '', phone: '', address: '', city: '', username: '' };
  }, [inputValue]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errorMsg[name]) {
      setErrorMsg(prev => ({ ...prev, [name]: '' }));
    }
  }, [errorMsg]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Client-side validation with Zod
    const validationErrors = await validateForm();
    if (validationErrors.shopName || validationErrors.password || validationErrors.phone || validationErrors.address || validationErrors.city || validationErrors.username) {
      setErrorMsg(validationErrors);
      return;
    }

    setLoading(true);
    setErrorMsg({ shopName: '', password: '' });

    try {
      const response = await dispatch(signupOrLogin({
        shopName: inputValue.shopName.trim(),
        password: inputValue.password,
        phone: inputValue.phone.trim() || undefined,
        address: inputValue.address.trim() || undefined,
        city: inputValue.city.trim() || undefined,
        username: inputValue.username.trim() || undefined,
      })).unwrap();
      
      if (response?.success && response?.user) {
        setInputValues({ shopName: '', password: '', phone: '', address: '', city: '', username: '' });
        setOpen(false);
        // Determine if it's login or signup based on whether user already exists
        const isLogin = !inputValue.phone && !inputValue.address && !inputValue.city && !inputValue.username;
        if (isLogin) {
          toast.success('Login successful!');
        } else {
          toast.success('Account created successfully!');
        }
      } else {
        setErrorMsg({ shopName: 'Authentication failed', password: 'Authentication failed' });
        toast.error('Authentication failed. Please try again.');
      }
    } catch (error) {
      let errorMessage = error || 'Invalid shop name or password';
      
      // Check if it's an admin login error
      if (errorMessage.includes('admin login') || errorMessage.includes('Admin accounts')) {
        errorMessage = 'Admin accounts must use the admin login page';
      }
      
      setErrorMsg({ shopName: errorMessage, password: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch, inputValue, validateForm, setOpen]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md">
        <div className="mx-auto w-full max-w-md h-full flex flex-col">
          <DrawerHeader className="relative flex-shrink-0">
            <DrawerTitle className="text-2xl font-bold text-gray-900 uppercase">
              SIGN IN
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Enter your shop name and password to continue
            </DrawerDescription>
            <DrawerClose asChild>
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-900" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          
          <form 
            onSubmit={handleSubmit}
            className="px-6 pb-6 space-y-6 flex-1 overflow-y-auto"
          >
            {/* Shop Name Field */}
            <div className="space-y-2">
              <Label htmlFor="shopName" className="text-sm font-semibold text-gray-900">
                Shop Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shopName"
                type="text"
                name="shopName"
                placeholder="Enter your shop name"
                value={inputValue.shopName}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="username"
                className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errorMsg.shopName && (
                <p className="text-red-500 text-xs mt-1">
                  {errorMsg.shopName}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={inputValue.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="h-12 pr-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errorMsg.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errorMsg.password}
                </p>
              )}
            </div>

            {/* Optional Fields Section */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 mb-4 italic">
                Optional fields (fill these only when creating a new account)
              </p>

              {/* Username Field - Optional */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-900">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Enter your username (optional)"
                  value={inputValue.username}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="username"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Phone Field - Required */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number (11 digits)"
                  value={inputValue.phone}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="tel"
                  maxLength={11}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Address Field - Optional */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-900">
                  Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  name="address"
                  placeholder="Enter your address (optional)"
                  value={inputValue.address}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="street-address"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* City Field - Optional */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-semibold text-gray-900">
                  City
                </Label>
                <Input
                  id="city"
                  type="text"
                  name="city"
                  placeholder="Enter your city (optional)"
                  value={inputValue.city}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="address-level2"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <OneLoader size="small" text="" showText={false} />
                  <span>Processing...</span>
                </div>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AuthDrawer;


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
  DrawerHeader,
  DrawerTitle,
} from '@/storefront/components/ui/drawer';
import { loginSchema, signupSchema } from '@/storefront/schemas/authSchemas';

const AuthDrawer = () => {
  const { open, setOpen, initialMode } = useAuthDrawer();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();
  
  const [mode, setMode] = useState(initialMode || 'login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({
    shopName: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    username: ''
  });
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
      setErrorMsg({ shopName: '', password: '', phone: '', address: '', city: '', username: '' });
      setShowPassword(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setMode(initialMode || 'login');
      setErrorMsg({ shopName: '', password: '', phone: '', address: '', city: '', username: '' });
    }
  }, [open, initialMode]);

  // Validation function using Zod
  const validateForm = useCallback(async () => {
    const schema = mode === 'signup' ? signupSchema : loginSchema;
    const dataToValidate = mode === 'signup'
      ? inputValue
      : { shopName: inputValue.shopName, password: inputValue.password };

    const result = schema.safeParse(dataToValidate);
    
    if (!result.success) {
      const errors = { shopName: '', password: '', phone: '', address: '', city: '', username: '' };
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
  }, [inputValue, mode]);

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
    
    const validationErrors = await validateForm();
    if (validationErrors.shopName || validationErrors.password || validationErrors.phone || validationErrors.address || validationErrors.city || validationErrors.username) {
      setErrorMsg(validationErrors);
      return;
    }

    setLoading(true);
    setErrorMsg({ shopName: '', password: '', phone: '', address: '', city: '', username: '' });

    const payload = {
      shopName: inputValue.shopName.trim(),
      password: inputValue.password,
    };

    if (mode === 'signup') {
      payload.phone = inputValue.phone.trim();
      payload.address = inputValue.address.trim() || undefined;
      payload.city = inputValue.city.trim() || undefined;
      payload.username = inputValue.username.trim() || undefined;
    }

    try {
      const response = await dispatch(signupOrLogin(payload)).unwrap();
      
      if (response?.success && response?.user) {
        setInputValues({ shopName: '', password: '', phone: '', address: '', city: '', username: '' });
        setOpen(false);
        toast.success(mode === 'signup' ? 'Account created successfully!' : 'Login successful!');
      } else {
        const failedMessage = response?.message || 'Authentication failed';
        setErrorMsg({ shopName: failedMessage, password: failedMessage, phone: failedMessage });
        toast.error(failedMessage);
      }
    } catch (error) {
      let errorMessage = error?.response?.data?.message || error?.message || 'Invalid shop name or password';
      
      if (typeof errorMessage === 'object' && errorMessage.message) {
        errorMessage = errorMessage.message;
      }
      
      if (errorMessage.includes('admin login') || errorMessage.includes('Admin accounts')) {
        errorMessage = 'Admin accounts must use the admin login page';
      }

      const fieldErrors = {
        shopName: '',
        password: '',
        phone: '',
        address: '',
        city: '',
        username: ''
      };

      if (mode === 'signup') {
        fieldErrors.shopName = errorMessage;
        fieldErrors.password = errorMessage;
        fieldErrors.phone = errorMessage;
      } else {
        fieldErrors.shopName = errorMessage;
        fieldErrors.password = errorMessage;
      }

      setErrorMsg(fieldErrors);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch, inputValue, mode, validateForm, setOpen]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-md">
        <div className="mx-auto w-full max-w-md h-full flex flex-col">
          <DrawerHeader className="relative flex-shrink-0">
            <DrawerTitle className="text-2xl font-bold text-gray-900 uppercase">
              {mode === 'signup' ? 'SIGN UP' : 'SIGN IN'}
            </DrawerTitle>
            <DrawerDescription className="text-sm text-gray-500">
              {mode === 'signup'
                ? 'Create a storefront account with shop details.'
                : 'Enter your shop name and password to continue.'}
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

          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign Up
              </button>
            </div>
          </div>
          
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

            {mode === 'signup' && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <p className="text-xs text-gray-500 mb-2 italic">
                  Fill in these details to create your account.
                </p>

                <div className="space-y-2">
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
                  {errorMsg.phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errorMsg.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
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
                  {errorMsg.username && (
                    <p className="text-red-500 text-xs mt-1">
                      {errorMsg.username}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
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
                  {errorMsg.address && (
                    <p className="text-red-500 text-xs mt-1">
                      {errorMsg.address}
                    </p>
                  )}
                </div>

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
                  {errorMsg.city && (
                    <p className="text-red-500 text-xs mt-1">
                      {errorMsg.city}
                    </p>
                  )}
                </div>
              </div>
            )}

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
                <span>{mode === 'signup' ? 'Sign Up' : 'Sign In'}</span>
              )}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AuthDrawer;


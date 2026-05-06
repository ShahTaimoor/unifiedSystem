import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/storefront/components/ui/button';
import { Input } from '@/storefront/components/ui/input';
import { Label } from '@/storefront/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/storefront/components/ui/dialog';
import OneLoader from '@/storefront/components/ui/OneLoader';
import { Eye, EyeOff, ArrowLeft, Shield, Lock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin } from '@/storefront/redux/slices/auth/authSlice';
import { useToast } from '@/storefront/hooks/use-toast';
import { userService } from '@/storefront/services/userService';

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState({ shopName: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordName, setForgotPasswordName] = useState('');
  const [inputValue, setInputValues] = useState({
    shopName: '',
    password: '',
  });

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && user && (user.role === 1 || user.role === 2)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, isAuthenticated, navigate]);

  // Validation function
  const validateForm = useCallback(() => {
    const errors = { shopName: '', password: '' };
    
    if (!inputValue.shopName.trim()) {
      errors.shopName = 'Shop name is required';
    }
    
    if (!inputValue.password || inputValue.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    return errors;
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
    
    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.shopName || validationErrors.password) {
      setErrorMsg(validationErrors);
      return;
    }

    setLoading(true);
    setErrorMsg({ shopName: '', password: '' });

    try {
      const response = await dispatch(adminLogin({
        name: inputValue.shopName.trim(),
        password: inputValue.password,
      })).unwrap();
      
      if (response?.success && response?.user) {
        setInputValues({ shopName: '', password: '' });
        toast.success('Admin login successful!');
        // Wait for Redux state to update, then navigate
        // The useEffect will handle navigation when isAuthenticated becomes true
        // But also navigate directly as fallback
        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 200);
      } else {
        setErrorMsg({ shopName: 'Authentication failed', password: 'Authentication failed' });
        toast.error('Authentication failed. Please try again.');
      }
    } catch (error) {
      const errorMessage = error || 'Invalid shop name or password';
      setErrorMsg({ shopName: errorMessage, password: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dispatch, inputValue, validateForm, navigate]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleForgotPassword = useCallback(async () => {
    if (!forgotPasswordName.trim()) {
      toast.error('Please enter your admin shop name');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const result = await userService.requestPasswordReset(forgotPasswordName.trim());
      if (result.success) {
        toast.success(result.message || 'Password reset request submitted successfully. Super Admin will be notified.');
        setShowForgotPassword(false);
        setForgotPasswordName('');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit password reset request';
      toast.error(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  }, [forgotPasswordName, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield size={32} className="text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 uppercase">
                Admin Login
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Enter your credentials to access the admin panel
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  autoComplete="current-password"
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <OneLoader size="small" text="" showText={false} />
                  <span>Logging in...</span>
                </div>
              ) : (
                <span>Login as Admin</span>
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline focus:outline-none"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Forgot Password Dialog */}
          <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Request Password Reset
                </DialogTitle>
                <DialogDescription>
                  Enter your admin shop name to request a password reset. The Super Admin will be notified and will reset your password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="forgotPasswordName">Admin Shop Name</Label>
                  <Input
                    id="forgotPasswordName"
                    type="text"
                    placeholder="Enter your shop name"
                    value={forgotPasswordName}
                    onChange={(e) => setForgotPasswordName(e.target.value)}
                    disabled={forgotPasswordLoading}
                    className="w-full"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordName('');
                  }}
                  disabled={forgotPasswordLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading || !forgotPasswordName.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center gap-2">
                      <OneLoader size="small" text="" showText={false} />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 space-y-2">
            <p className="text-xs text-gray-500">
              Only administrators can access this page
            </p>
            <p className="text-xs text-gray-400">
              Need regular access? <Link to="/" className="text-primary hover:underline">Go to customer login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;


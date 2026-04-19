import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OneLoader from '@/components/ui/OneLoader';
import { Eye, EyeOff, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { storefrontLogin } from '@/redux/slices/auth/authSlice';
import { useAuthDrawer } from '@/contexts/AuthDrawerContext';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

const emptyErrors = () => ({ phone: '', password: '' });

const AuthDrawer = () => {
  const { open, setOpen } = useAuthDrawer();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(emptyErrors);
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValues] = useState({
    phone: '',
    password: '',
  });

  useEffect(() => {
    if (user && open) {
      setOpen(false);
    }
  }, [user, open, setOpen]);

  useEffect(() => {
    if (!open) {
      setInputValues({ phone: '', password: '' });
      setErrorMsg(emptyErrors());
      setShowPassword(false);
    }
  }, [open]);

  const validateForm = useCallback(async () => {
    const { authSchema } = await import('@/schemas/authSchemas');
    const result = authSchema.safeParse(inputValue);

    if (!result.success) {
      const errors = emptyErrors();
      if (result.error?.issues && Array.isArray(result.error.issues)) {
        result.error.issues.forEach((issue) => {
          const field = issue.path?.[0];
          if (field && errors.hasOwnProperty(field)) {
            errors[field] = issue.message;
          }
        });
      }
      return errors;
    }

    return emptyErrors();
  }, [inputValue]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setInputValues((prev) => ({ ...prev, [name]: value }));

      if (errorMsg[name]) {
        setErrorMsg((prev) => ({ ...prev, [name]: '' }));
      }
    },
    [errorMsg]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const validationErrors = await validateForm();
      const hasErr = Object.values(validationErrors).some(Boolean);
      if (hasErr) {
        setErrorMsg(validationErrors);
        return;
      }

      setLoading(true);
      setErrorMsg(emptyErrors());

      try {
        const response = await dispatch(
          storefrontLogin({
            phone: inputValue.phone.trim(),
            password: inputValue.password,
          })
        ).unwrap();

        if (response?.success && response?.user) {
          setInputValues({ phone: '', password: '' });
          setOpen(false);
          toast.success('Login successful!');
        } else {
          setErrorMsg({ ...emptyErrors(), phone: 'Authentication failed' });
          toast.error('Authentication failed. Please try again.');
        }
      } catch (error) {
        let errorMessage = error || 'Invalid phone or password';

        if (errorMessage.includes('admin login') || errorMessage.includes('Admin accounts')) {
          errorMessage = 'Staff accounts: sign in using the POS Admin app.';
        }

        setErrorMsg({ ...emptyErrors(), phone: errorMessage, password: errorMessage });
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, inputValue, validateForm, setOpen, toast]
  );

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
              Enter the phone number and password provided by your supplier
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
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                Phone number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                placeholder="e.g. 03001234567"
                value={inputValue.phone}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="tel"
                className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errorMsg.phone && (
                <p className="text-red-500 text-xs mt-1">{errorMsg.phone}</p>
              )}
            </div>

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
                <p className="text-red-500 text-xs mt-1">{errorMsg.password}</p>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Accounts are created by the business. If you need access, contact your supplier.
            </p>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <OneLoader size="small" text="" showText={false} />
                  <span>Signing in...</span>
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

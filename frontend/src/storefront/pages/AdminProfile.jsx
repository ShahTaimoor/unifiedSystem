import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/storefront/components/ui/input';
import { Button } from '@/storefront/components/ui/button';
import { changePassword, updateUsername } from '@/storefront/redux/slices/auth/authSlice';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/storefront/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/storefront/components/ui/avatar';
import { Skeleton } from '@/storefront/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/storefront/components/ui/tabs';
import OneLoader from '@/storefront/components/ui/OneLoader';
import { useToast } from '@/storefront/hooks/use-toast';
import { Eye, EyeOff, User, Lock, Shield, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

const AdminProfile = () => {
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);
  const toast = useToast();

  // Username change state
  const [usernameData, setUsernameData] = useState({
    newUsername: user?.name || ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Error states
  const [errors, setErrors] = useState({
    username: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Show/hide password states
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState('username');

  // Sync username with user data
  useEffect(() => {
    setUsernameData({
      newUsername: user?.name || ''
    });
  }, [user]);

  const handleUsernameChange = (e) => {
    const { value } = e.target;
    setUsernameData({ newUsername: value });
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateUsername = () => {
    if (!usernameData.newUsername.trim()) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return false;
    }
    if (usernameData.newUsername === user?.name) {
      setErrors(prev => ({ ...prev, username: 'Please enter a different username' }));
      return false;
    }
    if (usernameData.newUsername.length < 3) {
      setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    const newErrors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    let isValid = true;

    if (!passwordData.oldPassword) {
      newErrors.oldPassword = 'Current password is required';
      isValid = false;
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
      isValid = false;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleUsernameSubmit = () => {
    if (!validateUsername()) {
      return;
    }

    dispatch(updateUsername({ newUsername: usernameData.newUsername }))
      .unwrap()
      .then(() => {
        toast.success('Username updated successfully!');
        setErrors(prev => ({ ...prev, username: '' }));
      })
      .catch((err) => {
        const errorMessage = err?.message || err || 'Failed to update username';
        toast.error(errorMessage);
        setErrors(prev => ({ ...prev, username: errorMessage }));
      });
  };

  const handlePasswordSubmit = () => {
    if (!validatePassword()) {
      return;
    }

    dispatch(changePassword(passwordData))
      .unwrap()
      .then(() => {
        toast.success('Password changed successfully!');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      })
      .catch((err) => {
        const errorMessage = err?.message || err || 'Failed to change password';
        toast.error(errorMessage);
        if (errorMessage.toLowerCase().includes('current') || errorMessage.toLowerCase().includes('old')) {
          setErrors(prev => ({ ...prev, oldPassword: errorMessage }));
        } else {
          setErrors(prev => ({ ...prev, newPassword: errorMessage }));
        }
      });
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 0:
        return { 
          label: 'User', 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 
          icon: User 
        };
      case 1:
        return { 
          label: 'Admin', 
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 
          icon: Shield 
        };
      case 2:
        return { 
          label: 'Super Admin', 
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', 
          icon: Shield 
        };
      default:
        return { 
          label: 'User', 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 
          icon: User 
        };
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  const roleInfo = getRoleInfo(user.role);

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-4xl">
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg">
        {/* Clean Header with Solid Colors */}
        <div className="bg-slate-900 h-14 sm:h-16 md:h-20 relative">
          <div className="absolute -bottom-6 sm:-bottom-8 md:-bottom-10 left-4 sm:left-6 md:left-8">
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 sm:border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900">
              <AvatarImage src={user?.avatar} className="object-cover" />
              <AvatarFallback className="text-lg sm:text-xl md:text-2xl font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* User Info Section */}
        <CardHeader className="pt-8 sm:pt-10 md:pt-12 pb-2 sm:pb-3 px-4 sm:px-6 md:px-8 bg-white dark:bg-gray-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user?.name}
                  </CardTitle>
                  {usernameData.newUsername === user?.name && (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <p className="text-xs sm:text-sm truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 w-fit shadow-sm ${roleInfo.color}`}>
              <roleInfo.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">{roleInfo.label}</span>
            </div>
          </div>
        </CardHeader>

        {/* Tabs Section */}
        <CardContent className="px-4 sm:px-6 md:px-8 pb-3 sm:pb-4 bg-white dark:bg-gray-900">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-0.5 sm:p-1 rounded-lg h-10 sm:h-11 mb-3 sm:mb-4">
              <TabsTrigger 
                value="username" 
                className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-100 rounded-md transition-all font-medium px-2 sm:px-3"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden min-[375px]:inline">Change Username</span>
                <span className="min-[375px]:hidden">Username</span>
              </TabsTrigger>
              <TabsTrigger 
                value="password" 
                className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700 data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=active]:dark:text-gray-100 rounded-md transition-all font-medium px-2 sm:px-3"
              >
                <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden min-[375px]:inline">Change Password</span>
                <span className="min-[375px]:hidden">Password</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="username" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 sm:gap-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span>Update Username</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    This will be your visible display name. Choose a username that represents you professionally.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="newUsername" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                    New Username
                  </label>
                  <div className="relative">
                    <Input
                      id="newUsername"
                      name="newUsername"
                      type="text"
                      placeholder="Enter new username"
                      value={usernameData.newUsername}
                      onChange={handleUsernameChange}
                      required
                      className={`h-10 sm:h-11 border-2 transition-all text-sm ${
                        errors.username 
                          ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20'
                      }`}
                    />
                    {errors.username && (
                      <div className="absolute -bottom-5 left-0 flex items-center gap-1 text-red-600 dark:text-red-400 text-[10px] sm:text-xs mt-1">
                        <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="break-words">{errors.username}</span>
                      </div>
                    )}
                  </div>
                  {!errors.username && usernameData.newUsername && usernameData.newUsername !== user?.name && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Username is available
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="password" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 sm:gap-2">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span>Change Password</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Ensure your account is secure by using a strong, unique password.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Old Password */}
                  <div className="space-y-2">
                    <label htmlFor="oldPassword" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        name="oldPassword"
                        type={showPasswords.old ? "text" : "password"}
                        placeholder="Enter current password"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`h-10 sm:h-11 border-2 transition-all pr-10 sm:pr-12 text-sm ${
                          errors.oldPassword 
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('old')}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPasswords.old ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                    {errors.oldPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="break-words">{errors.oldPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        placeholder="Enter new password (min. 6 characters)"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`h-10 sm:h-11 border-2 transition-all pr-10 sm:pr-12 text-sm ${
                          errors.newPassword 
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="break-words">{errors.newPassword}</span>
                      </p>
                    )}
                    {!errors.newPassword && passwordData.newPassword && passwordData.newPassword.length >= 6 && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                        Password strength: Good
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`h-10 sm:h-11 border-2 transition-all pr-10 sm:pr-12 text-sm ${
                          errors.confirmPassword 
                            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                            : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword
                            ? 'border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500/20'
                            : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="break-words">{errors.confirmPassword}</span>
                      </p>
                    )}
                    {!errors.confirmPassword && passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex justify-end items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={() => {
              if (activeTab === 'username') {
                handleUsernameSubmit();
              } else if (activeTab === 'password') {
                handlePasswordSubmit();
              }
            }}
            disabled={status === 'loading'}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm font-semibold"
          >
            {status === 'loading' ? (
              <>
                <OneLoader size="small" text="Saving..." showText={false} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminProfile;

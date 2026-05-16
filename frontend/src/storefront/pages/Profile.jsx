import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/storefront/components/ui/input';
import { Button } from '@/storefront/components/ui/button';
import { updateProfile } from '@/storefront/redux/slices/auth/authSlice';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/storefront/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/storefront/components/ui/avatar';
import { Skeleton } from '@/storefront/components/ui/skeleton';
import { Textarea } from '@/storefront/components/ui/textarea';
import OneLoader from '@/storefront/components/ui/OneLoader';
import { useToast } from '@/storefront/hooks/use-toast';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);
  const toast = useToast();

  // Local state for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    dispatch(changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }))
      .unwrap()
      .then(() => {
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password changed successfully!');
      })
      .catch((err) => {
        toast.error(err || 'Failed to change password. Please check your current password.');
      });
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

  return (
    <div className="container mt-20 mx-auto p-4 max-w-4xl">
      <Card className="overflow-hidden shadow-lg border-none">
        <div className="bg-gradient-to-r from-[#FED700] to-[#f5af19] h-32 relative">
          <div className="absolute -bottom-16 left-6">
            <Avatar className="w-32 h-32 border-4 border-background shadow-md">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-3xl bg-background text-[#FED700] font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardHeader className="pt-20">
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            {user?.name || 'User Profile'}
            <span className="text-xs bg-[#FED700] text-black px-2 py-1 rounded-full font-medium uppercase tracking-wider">
              {user?.role || 'Customer'}
            </span>
          </CardTitle>
          <p className="text-muted-foreground">{user?.email}</p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Profile Information (Read Only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-xl">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Username</p>
                <p className="text-lg font-medium">{user?.username || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Phone Number</p>
                <p className="text-lg font-medium">{user?.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Shipping Address</p>
                <p className="text-lg font-medium leading-tight">{user?.address || 'No address provided'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">City</p>
                <p className="text-lg font-medium">{user?.city || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="border-t pt-8">
            {!showPasswordForm ? (
              <div className="flex flex-col items-start gap-4">
                <h3 className="text-xl font-bold">Security</h3>
                <p className="text-sm text-muted-foreground">Manage your account security and password settings here.</p>
                <Button 
                  onClick={() => setShowPasswordForm(true)} 
                  variant="outline" 
                  className="border-[#FED700] text-black hover:bg-[#FED700]"
                >
                  Change Account Password
                </Button>
              </div>
            ) : (
              <div className="space-y-6 max-w-md">
                <h3 className="text-xl font-bold">Update Password</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <Input
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handlePasswordSubmit}
                    disabled={status === 'loading'}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {status === 'loading' ? 'Updating...' : 'Update Password'}
                  </Button>
                  <Button
                    onClick={() => setShowPasswordForm(false)}
                    variant="ghost"
                    disabled={status === 'loading'}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-gray-50 border-t p-4 flex justify-between items-center text-xs text-muted-foreground">
          <p>User ID: {user?._id || user?.id}</p>
          <p>Account Status: <span className="text-green-600 font-bold uppercase">{user?.status || 'Active'}</span></p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;

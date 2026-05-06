import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import OneLoader from '../components/ui/OneLoader';
import { useUsers } from '@/storefront/hooks/use-users';
import { useToast } from '@/storefront/hooks/use-toast';
import { userService } from '@/storefront/services/userService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  getRoleLabel,
  getRoleIcon,
  filterUsers,
  getUserStats,
  getPageNumbers,
  getUniqueCities,
  capitalizeWords,
  normalizeCity,
} from '@/storefront/utils/userHelpers';
import {
  RefreshCw,
  Users as UsersIcon,
  User,
  Shield,
  Crown,
  MapPin,
  Phone,
  Building2,
  Search,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AtSign,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const Users = () => {
  const { users, loading, updatingRoles, fetchUsers, handleRoleChange, handleDeleteUser } = useUsers();
  const { user: currentUser } = useSelector((state) => state.auth);
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedCities, setSelectedCities] = useState([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deletingUsers, setDeletingUsers] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState({});
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [loadingResetRequests, setLoadingResetRequests] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false, request: null, newPassword: '' });

  // Get unique cities from users
  const availableCities = useMemo(() => getUniqueCities(users), [users]);
  
  // Filter cities based on search term
  const filteredCities = useMemo(() => {
    if (!citySearchTerm.trim()) return availableCities;
    const searchLower = citySearchTerm.toLowerCase().trim();
    return availableCities.filter((city) =>
      city.toLowerCase().includes(searchLower)
    );
  }, [availableCities, citySearchTerm]);

  // Filter users based on search term, role filter, and city filter
  const filteredUsers = useMemo(
    () => filterUsers(users, searchTerm, roleFilter, selectedCities),
    [users, searchTerm, roleFilter, selectedCities]
  );

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, selectedCities]);

  // Get user statistics
  const userStats = useMemo(() => getUserStats(users), [users]);
  
  // Check if there's already a super admin
  const hasSuperAdmin = useMemo(() => {
    return users.some((user) => user.role === 2);
  }, [users]);

  // Pagination calculations
  const totalPages = useMemo(
    () => Math.ceil(filteredUsers.length / itemsPerPage),
    [filteredUsers.length, itemsPerPage]
  );
  
  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );
  
  const endIndex = useMemo(
    () => startIndex + itemsPerPage,
    [startIndex, itemsPerPage]
  );
  
  const paginatedUsers = useMemo(
    () => filteredUsers.slice(startIndex, endIndex),
    [filteredUsers, startIndex, endIndex]
  );
  
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Handle city checkbox change
  const handleCityToggle = (city) => {
    setSelectedCities((prev) => {
      if (prev.includes(city)) {
        return prev.filter((c) => c !== city);
      } else {
        return [...prev, city];
      }
    });
  };

  // Handle select all cities
  const handleSelectAllCities = () => {
    if (selectedCities.length === availableCities.length) {
      setSelectedCities([]);
    } else {
      setSelectedCities([...availableCities]);
    }
  };

  // Fetch password reset requests (Super Admin only)
  const fetchPasswordResetRequests = useCallback(async () => {
    if (currentUser?.role !== 2) return;
    
    setLoadingResetRequests(true);
    try {
      const result = await userService.getPendingPasswordResetRequests();
      if (result.success) {
        setPasswordResetRequests(result.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch password reset requests:', error);
    } finally {
      setLoadingResetRequests(false);
    }
  }, [currentUser?.role]);

  // Reset admin password
  const handleResetAdminPassword = useCallback(async () => {
    if (!resetPasswordDialog.request || !resetPasswordDialog.newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (resetPasswordDialog.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      const result = await userService.resetAdminPassword(
        resetPasswordDialog.request._id,
        resetPasswordDialog.newPassword
      );
      
      if (result.success) {
        toast.success(`Password reset successfully for ${result.admin.name}`);
        setResetPasswordDialog({ open: false, request: null, newPassword: '' });
        await fetchPasswordResetRequests();
        await fetchUsers(); // Refresh users list
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password';
      toast.error(errorMessage);
    }
  }, [resetPasswordDialog, fetchPasswordResetRequests, fetchUsers, toast]);

  // Fetch reset requests on mount and when user changes
  useEffect(() => {
    if (currentUser?.role === 2) {
      fetchPasswordResetRequests();
      // Refresh every 30 seconds to check for new requests
      const interval = setInterval(fetchPasswordResetRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.role, fetchPasswordResetRequests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <OneLoader size="large" text="Loading Users..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Password Reset Requests Section (Super Admin Only) */}
        {currentUser?.role === 2 && passwordResetRequests.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    Pending Password Reset Requests ({passwordResetRequests.length})
                  </h3>
                  <p className="text-xs text-amber-700 mb-3">
                    Admin users have requested password resets. Please review and reset their passwords.
                  </p>
                  <div className="space-y-2">
                    {passwordResetRequests.slice(0, 3).map((request) => (
                      <div key={request._id} className="flex items-center justify-between bg-white rounded-md p-2 border border-amber-200">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-gray-900">{request.requestedBy}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setResetPasswordDialog({ open: true, request, newPassword: '' })}
                          className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                        >
                          Reset Password
                        </Button>
                      </div>
                    ))}
                    {passwordResetRequests.length > 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Scroll to requests section or show all */}}
                        className="w-full text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        View All ({passwordResetRequests.length} requests)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                <p className="text-xs sm:text-sm text-gray-500">Manage user roles and permissions</p>
              </div>
            </div>
            <Button 
              onClick={fetchUsers} 
              variant="outline" 
              size="sm"
              className="border-gray-300 hover:bg-gray-50 text-gray-700 w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 md:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-xs md:text-sm font-medium text-gray-500 leading-tight break-words">Total Users</p>
                <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{userStats.total}</p>
              </div>
              <div className="p-1 sm:p-1.5 md:p-2 bg-gray-100 rounded-md flex-shrink-0 self-end sm:self-auto">
                <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 md:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-xs md:text-sm font-medium text-gray-500 leading-tight break-words">Regular Users</p>
                <p className="text-base sm:text-xl md:text-2xl font-bold text-blue-600 mt-0.5 sm:mt-1">{userStats.users}</p>
              </div>
              <div className="p-1 sm:p-1.5 md:p-2 bg-blue-50 rounded-md flex-shrink-0 self-end sm:self-auto">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 md:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-xs md:text-sm font-medium text-gray-500 leading-tight break-words">Admins</p>
                <p className="text-base sm:text-xl md:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">{userStats.admins}</p>
              </div>
              <div className="p-1 sm:p-1.5 md:p-2 bg-green-50 rounded-md flex-shrink-0 self-end sm:self-auto">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 md:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-xs md:text-sm font-medium text-gray-500 leading-tight break-words">Super Admins</p>
                <p className="text-base sm:text-xl md:text-2xl font-bold text-purple-600 mt-0.5 sm:mt-1">{userStats.superAdmins}</p>
              </div>
              <div className="p-1 sm:p-1.5 md:p-2 bg-purple-50 rounded-md flex-shrink-0 self-end sm:self-auto">
                <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 h-9 sm:h-10 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            {/* Per Page and Role Filter in one row */}
            <div className="flex flex-row items-center gap-2">
              {/* Items per page selector */}
              <div className="flex items-center gap-1.5 flex-1 text-xs sm:text-sm text-gray-600">
                <span className="hidden sm:inline">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="hidden sm:inline">rows</span>
              </div>
              {/* Role Filter */}
              <div className="flex items-center gap-2 flex-1">
                <Filter className="hidden sm:block h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm border-gray-300">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="0">Users</SelectItem>
                    <SelectItem value="1">Admins</SelectItem>
                    <SelectItem value="2">Super Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* City Filter Dropdown */}
            {availableCities.length > 0 && (
              <div className="border-t border-gray-200 pt-3 sm:pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                    Filter by City
                  </label>
                  <DropdownMenu onOpenChange={(open) => {
                    if (!open) {
                      setCitySearchTerm('');
                    }
                  }}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 sm:h-10 text-xs sm:text-sm border-gray-300 hover:bg-gray-50"
                      >
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        {selectedCities.length === 0
                          ? 'Select Cities'
                          : selectedCities.length === availableCities.length
                          ? 'All Cities'
                          : `${selectedCities.length} Selected`}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto" align="end">
                      <DropdownMenuLabel>Select Cities</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {/* Search Input */}
                      <div className="px-2 py-1.5">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search cities..."
                            value={citySearchTerm}
                            onChange={(e) => setCitySearchTerm(e.target.value)}
                            className="h-8 pl-8 pr-2 text-xs border-gray-300 focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectAllCities();
                        }}
                        className="cursor-pointer"
                      >
                        {selectedCities.length === availableCities.length ? 'Deselect All' : 'Select All'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {filteredCities.length > 0 ? (
                        filteredCities.map((city) => {
                          const cityCount = users.filter(
                            (u) => u.city && u.city.trim().toLowerCase() === city.trim().toLowerCase()
                          ).length;
                          return (
                            <DropdownMenuCheckboxItem
                              key={city}
                              checked={selectedCities.includes(city)}
                              onCheckedChange={() => handleCityToggle(city)}
                              className="flex items-center justify-between"
                            >
                              <span className="flex-1">{capitalizeWords(city)}</span>
                              <span className="text-xs text-gray-500 ml-2">({cityCount})</span>
                            </DropdownMenuCheckboxItem>
                          );
                        })
                      ) : (
                        <div className="px-2 py-4 text-center text-xs text-gray-500">
                          No cities found
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {selectedCities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedCities.map((city) => (
                      <Badge
                        key={city}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {capitalizeWords(city)}
                        <button
                          onClick={() => handleCityToggle(city)}
                          className="ml-1.5 hover:bg-blue-100 rounded-full p-0.5"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider w-6 sm:w-8 md:w-auto">
                    #
                  </th>
                  <th className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[80px] sm:min-w-[100px]">
                    User
                  </th>
                  <th className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px] sm:min-w-[160px]">
                    Contact
                  </th>
                  <th className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider w-14 sm:w-16 md:w-auto">
                    Role
                  </th>
                  <th className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 sm:w-20 md:w-auto">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedUsers.map((user, index) => {
                  const { label: roleLabel, color: roleColor } = getRoleLabel(user.role);
                  const isUpdating = updatingRoles[user._id];
                  const isCurrentUser = currentUser?._id === user._id;
                  
                  return (
                    <tr
                      key={user._id || index}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6 text-[10px] sm:text-xs md:text-sm font-medium text-gray-500 whitespace-nowrap">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3">
                          <div className="p-0.5 sm:p-1 md:p-1.5 lg:p-2 bg-gray-100 rounded-full flex-shrink-0">
                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-gray-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-[10px] sm:text-xs md:text-sm text-gray-900 capitalize truncate">{user.name}</div>
                            {user.username && (
                              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-gray-500 truncate">
                                <AtSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                <span className="truncate">{user.username}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6">
                        <div className="space-y-0.5 sm:space-y-1 min-w-0">
                          {user.city && (
                            <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                              <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 break-all">{capitalizeWords(user.city)}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                              <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 break-all">{user.phone}</span>
                            </div>
                          )}
                          {user.address && (
                            <div className="hidden md:flex items-start gap-1.5">
                              <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-xs md:text-sm text-gray-600 truncate" title={user.address}>
                                {user.address.length > 25 
                                  ? `${user.address.substring(0, 25)}...` 
                                  : user.address
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6">
                        <Badge className={`${roleColor} flex items-center gap-0.5 sm:gap-1 w-fit px-1 sm:px-1.5 md:px-2 lg:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-xs font-medium border-0 whitespace-nowrap`}>
                          {getRoleIcon(user.role)}
                          <span className="hidden md:inline">{roleLabel}</span>
                          <span className="md:hidden">{roleLabel.split(' ')[0]}</span>
                        </Badge>
                      </td>
                      <td className="py-2 px-1 sm:py-3 sm:px-2 md:py-4 md:px-6">
                        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2">
                          {currentUser?.role === 2 ? (
                            isCurrentUser ? (
                              <span className="text-[8px] sm:text-[9px] md:text-xs text-amber-600 flex items-center gap-0.5 sm:gap-1 font-medium bg-amber-50 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                                <AlertCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                                <span className="hidden md:inline">Cannot change own role</span>
                                <span className="md:hidden">Own</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2">
                                <Select
                                  value={user.role.toString()}
                                  onValueChange={(value) => handleRoleChange(user._id, value)}
                                  disabled={isUpdating}
                                >
                                  <SelectTrigger className="w-18 sm:w-20 md:w-24 lg:w-36 h-7 sm:h-8 md:h-9 text-[9px] sm:text-[10px] md:text-sm border-gray-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">
                                      <div className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5" />
                                        User
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="1">
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-3.5 w-3.5" />
                                        Admin
                                      </div>
                                    </SelectItem>
                                    {/* Only show Super Admin option if there's no existing super admin, or if this user is already the super admin */}
                                    {/* Only show Super Admin option if there's no existing super admin */}
                                    {!hasSuperAdmin && (
                                      <SelectItem value="2">
                                        <div className="flex items-center gap-2">
                                          <Crown className="h-3.5 w-3.5" />
                                          Super Admin
                                        </div>
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                                {isUpdating && (
                                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                )}
                                {/* Delete button - show for regular users and admins (but not super admins or own account) */}
                                {user.role !== 2 && !isCurrentUser && (
                                  <AlertDialog 
                                    open={deleteDialogOpen[user._id] || false}
                                    onOpenChange={(open) => {
                                      setDeleteDialogOpen((prev) => ({ ...prev, [user._id]: open }));
                                      if (!open) {
                                        setDeletingUsers((prev) => ({ ...prev, [user._id]: false }));
                                      }
                                    }}
                                  >
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 sm:h-8 md:h-9 w-7 sm:w-8 md:w-9 p-0 border-red-300 hover:bg-red-50 hover:border-red-400 text-red-600"
                                        disabled={deletingUsers[user._id]}
                                      >
                                        {deletingUsers[user._id] ? (
                                          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="mx-4 sm:mx-0">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-lg sm:text-xl">Delete User</AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm sm:text-base">
                                          Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                        <AlertDialogCancel 
                                          className="w-full sm:w-auto"
                                          disabled={deletingUsers[user._id]}
                                        >
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={async () => {
                                            setDeletingUsers((prev) => ({ ...prev, [user._id]: true }));
                                            try {
                                              await handleDeleteUser(user._id);
                                              toast.success(`User ${user.name} deleted successfully`);
                                              setDeleteDialogOpen((prev) => ({ ...prev, [user._id]: false }));
                                              // Adjust page if needed after deletion
                                              if (filteredUsers.length <= startIndex + 1 && currentPage > 1) {
                                                setCurrentPage(currentPage - 1);
                                              }
                                            } catch (error) {
                                              const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
                                              toast.error(errorMessage);
                                            } finally {
                                              setDeletingUsers((prev) => ({ ...prev, [user._id]: false }));
                                            }
                                          }}
                                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                                          disabled={deletingUsers[user._id]}
                                        >
                                          {deletingUsers[user._id] ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-[8px] sm:text-[9px] md:text-xs text-gray-400 flex items-center gap-0.5 sm:gap-1 italic whitespace-nowrap">
                              <Shield className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                              <span className="hidden md:inline">View Only</span>
                              <span className="md:hidden">View</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              {/* Page info */}
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredUsers.length)}</span> of <span className="font-semibold text-gray-900">{filteredUsers.length}</span> users
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>

                <div className="flex items-center gap-0.5 sm:gap-1">
                  {pageNumbers.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...'}
                      className={`h-8 min-w-[1.75rem] sm:min-w-[2rem] px-1.5 sm:px-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white shadow-sm'
                          : page === '...'
                          ? 'text-gray-400 cursor-default bg-transparent'
                          : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 && users.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto">
              We couldn't find any users matching your search "{searchTerm}" or filter criteria.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {setSearchTerm(''); setRoleFilter('all');}}
              className="mt-3 sm:mt-4 border-gray-300 h-9 sm:h-10 text-xs sm:text-sm"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {users.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No users registered yet</h3>
            <p className="text-sm sm:text-base text-gray-500">There are currently no users in the system.</p>
          </div>
        )}
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordDialog({ open: false, request: null, newPassword: '' });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Reset Admin Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordDialog.request?.requestedBy}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={resetPasswordDialog.newPassword}
                onChange={(e) => setResetPasswordDialog(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full"
                minLength={6}
              />
              <p className="text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialog({ open: false, request: null, newPassword: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetAdminPassword}
              disabled={!resetPasswordDialog.newPassword || resetPasswordDialog.newPassword.length < 6}
              className="bg-primary hover:bg-primary/90"
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;

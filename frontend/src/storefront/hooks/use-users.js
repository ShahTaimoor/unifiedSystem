import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { userService } from '@/storefront/services/userService';
import { updateUserRole } from '@/storefront/redux/slices/auth/authSlice';

/**
 * Custom hook for user management
 * Handles fetching users and updating roles
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState({});
  const dispatch = useDispatch();

  /**
   * Fetch all users
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      // Safety filter: remove any users with isDeleted flag (frontend safety check)
      // Also filter out null/undefined users
      const activeUsers = Array.isArray(data) 
        ? data.filter((user) => user && user._id && user.isDeleted !== true) 
        : [];
      setUsers(activeUsers);
    } catch (error) {
      // Error handled silently - user will see empty state
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} newRole - New role value
   */
  const handleRoleChange = useCallback(async (userId, newRole) => {
    setUpdatingRoles((prev) => ({ ...prev, [userId]: true }));

    try {
      const result = await dispatch(
        updateUserRole({ userId, role: parseInt(newRole) })
      ).unwrap();

      if (result.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, role: parseInt(newRole) } : user
          )
        );
      }
    } catch (error) {
      // Role change error - user will see error from Redux action
    } finally {
      setUpdatingRoles((prev) => ({ ...prev, [userId]: false }));
    }
  }, [dispatch]);

  /**
   * Delete user
   * @param {string} userId - User ID
   */
  const handleDeleteUser = useCallback(async (userId) => {
    // Store the current users list in case we need to restore
    let previousUsers = [];
    
    // Optimistically remove user from state immediately for instant UI update
    setUsers((prevUsers) => {
      previousUsers = [...prevUsers];
      return prevUsers.filter((user) => user._id !== userId);
    });

    try {
      const result = await userService.deleteUser(userId);
      if (!result.success) {
        // Restore previous state if delete failed
        setUsers(previousUsers);
        throw new Error('Delete operation failed');
      }
      
      // Don't refetch on success - trust the optimistic update
      // The user is already removed from state, and backend will filter on next natural fetch
      // This prevents race conditions and ensures immediate UI update
    } catch (error) {
      // If error occurred, restore the user and refetch to get correct state
      setUsers(previousUsers);
      try {
        const data = await userService.getAllUsers();
        // Safety filter: remove any deleted users
        const activeUsers = Array.isArray(data) 
          ? data.filter((user) => !user.isDeleted && user._id !== userId) 
          : [];
        setUsers(activeUsers);
      } catch (fetchError) {
        console.error('Failed to refetch users after delete error:', fetchError);
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    updatingRoles,
    fetchUsers,
    handleRoleChange,
    handleDeleteUser,
  };
};


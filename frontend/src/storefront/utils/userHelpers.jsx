import React from 'react';
import { User, Shield, Crown } from 'lucide-react';

/**
 * Get role label and styling
 * @param {number} role - User role (0: User, 1: Admin, 2: Super Admin)
 * @returns {Object} Role label, color, and icon
 */
export const getRoleLabel = (role) => {
  switch (role) {
    case 0:
      return { label: 'User', color: 'bg-blue-100 text-blue-800', icon: User };
    case 1:
      return { label: 'Admin', color: 'bg-green-100 text-green-800', icon: Shield };
    case 2:
      return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800', icon: Crown };
    default:
      return { label: 'User', color: 'bg-blue-100 text-blue-800', icon: User };
  }
};

/**
 * Get role icon component
 * @param {number} role - User role
 * @returns {JSX.Element} Icon component
 */
export const getRoleIcon = (role) => {
  const { icon: Icon } = getRoleLabel(role);
  return <Icon className="h-4 w-4" />;
};

/**
 * Filter users by search term, role, and cities, sorted by role (Super Admin, Admin, Users)
 * @param {Array} users - Array of users
 * @param {string} searchTerm - Search term
 * @param {string} roleFilter - Role filter ('all' or role number as string)
 * @param {Array} selectedCities - Array of selected city names to filter by
 * @returns {Array} Filtered and sorted users
 */
export const filterUsers = (users, searchTerm, roleFilter, selectedCities = []) => {
  const filtered = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesRole = roleFilter === 'all' || user.role.toString() === roleFilter;

    // City filter: if cities are selected, user must be in one of them
    // If no cities selected, show all users (no city filter applied)
    // Use case-insensitive comparison to match normalized cities
    const matchesCity = selectedCities.length === 0 || 
      (user.city && selectedCities.some((selectedCity) => 
        normalizeCity(user.city) === normalizeCity(selectedCity)
      ));

    return matchesSearch && matchesRole && matchesCity;
  });

  // Sort by role: Super Admin (2) first, then Admin (1), then Users (0)
  return filtered.sort((a, b) => {
    // Higher role number comes first (2 > 1 > 0)
    return b.role - a.role;
  });
};

/**
 * Capitalize first letter of each word in a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Normalize city name for comparison (trim and lowercase)
 * @param {string} city - City name to normalize
 * @returns {string} Normalized city name
 */
export const normalizeCity = (city) => {
  return city ? city.trim().toLowerCase() : '';
};

/**
 * Get unique cities from users array (case-insensitive, trimmed)
 * @param {Array} users - Array of users
 * @returns {Array} Array of unique city names (sorted, with original casing preserved)
 */
export const getUniqueCities = (users) => {
  const cityMap = new Map(); // Use Map to store normalized -> original mapping
  
  users.forEach((user) => {
    if (user.city && user.city.trim() !== '') {
      const normalized = normalizeCity(user.city);
      const trimmed = user.city.trim();
      
      // If we haven't seen this normalized city, or if the current one is better (properly capitalized)
      if (!cityMap.has(normalized)) {
        cityMap.set(normalized, trimmed);
      } else {
        // Keep the version that's already properly capitalized if available
        const existing = cityMap.get(normalized);
        // Prefer the version that starts with uppercase
        if (trimmed.charAt(0) === trimmed.charAt(0).toUpperCase() && 
            existing.charAt(0) !== existing.charAt(0).toUpperCase()) {
          cityMap.set(normalized, trimmed);
        }
      }
    }
  });
  
  // Convert Map values to array and sort
  const uniqueCities = Array.from(cityMap.values());
  return uniqueCities.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
};

/**
 * Calculate user statistics
 * @param {Array} users - Array of users
 * @returns {Object} User statistics
 */
export const getUserStats = (users) => {
  return {
    total: users.length,
    users: users.filter((u) => u.role === 0).length,
    admins: users.filter((u) => u.role === 1).length,
    superAdmins: users.filter((u) => u.role === 2).length,
  };
};

/**
 * Generate page numbers for pagination
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisiblePages - Maximum visible page numbers
 * @returns {Array} Array of page numbers (may include '...' for ellipsis)
 */
export const getPageNumbers = (currentPage, totalPages, maxVisiblePages = 5) => {
  const pages = [];

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
  }

  return pages;
};


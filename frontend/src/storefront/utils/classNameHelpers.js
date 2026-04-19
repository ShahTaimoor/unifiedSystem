/**
 * Helper functions for generating className strings
 * Prevents complex inline expressions in JSX
 */

/**
 * Get view mode button className
 * @param {string} currentMode - Current view mode
 * @param {string} buttonMode - Button's target mode
 * @param {string} position - Button position ('left' or 'right')
 * @returns {string} className string
 */
export const getViewModeButtonClassName = (currentMode, buttonMode, position) => {
  const baseClasses = position === 'left' 
    ? 'rounded-r-none h-9 px-3' 
    : 'rounded-l-none h-9 px-3';
  
  const activeClasses = 'bg-blue-600 hover:bg-blue-700 text-white';
  const inactiveClasses = 'text-gray-600 hover:bg-gray-50';
  
  return `${baseClasses} ${currentMode === buttonMode ? activeClasses : inactiveClasses}`;
};

/**
 * Get pagination button className
 * @param {number|string} page - Page number
 * @param {number} currentPage - Current page
 * @returns {string} className string
 */
export const getPaginationButtonClassName = (page, currentPage) => {
  if (page === currentPage) {
    return 'bg-blue-600 hover:bg-blue-700';
  }
  return 'border-gray-300';
};

/**
 * Get scroll-based header className
 * @param {boolean} isScrolled - Whether page is scrolled
 * @param {boolean} isMobile - Whether on mobile device
 * @returns {string} className string
 */
export const getHeaderClassName = (isScrolled, isMobile) => {
  const baseClasses = 'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out';
  
  if (isMobile) {
    const bgClass = isScrolled 
      ? 'bg-white border-b border-gray-200' 
      : 'bg-primary/10 border-b border-primary/20';
    const transformClass = isScrolled 
      ? '-translate-y-full opacity-0' 
      : 'translate-y-0 opacity-100';
    return `${baseClasses} ${bgClass} shadow-sm lg:hidden ${transformClass}`;
  }
  
  return `${baseClasses} bg-white border-b border-gray-200 shadow-sm`;
};

/**
 * Get sticky header className
 * @param {boolean} isMobile - Whether on mobile device
 * @param {boolean} isScrolled - Whether page is scrolled
 * @returns {string} className string
 */
export const getStickyHeaderClassName = (isMobile, isScrolled) => {
  const baseClasses = 'fixed left-0 right-0 z-40 backdrop-blur-xl shadow-md transition-all duration-300';
  
  if (isMobile) {
    const topClass = isScrolled ? 'top-[0px]' : 'top-[54px]';
    const bgClass = isScrolled ? 'bg-white' : 'bg-primary/10';
    return `${baseClasses} ${topClass} ${bgClass}`;
  }
  
  return `${baseClasses} top-14 bg-white/95 border-b border-gray-200/50`;
};

/**
 * Get spacer height className
 * @param {boolean} isMobile - Whether on mobile device
 * @param {boolean} isScrolled - Whether page is scrolled
 * @returns {string} className string
 */
export const getSpacerHeightClassName = (isMobile, isScrolled) => {
  if (isMobile) {
    return isScrolled ? 'h-[180px]' : 'h-[240px]';
  }
  return 'h-8 lg:h-34';
};


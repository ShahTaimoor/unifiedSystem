import { toast } from "sonner"

/**
 * Hook for displaying toast notifications
 * @returns Object with toast methods (success, error, info, warning, default)
 */
export const useToast = () => {
  return {
    /**
     * Show a success toast
     * @param {string} message - The message to display
     * @param {object} options - Additional toast options
     */
    success: (message, options = {}) => {
      return toast.success(message, {
        duration: 500,
        ...options,
      })
    },
    
    /**
     * Show an error toast
     * @param {string} message - The message to display
     * @param {object} options - Additional toast options
     */
    error: (message, options = {}) => {
      return toast.error(message, {
        duration: 500,
        ...options,
      })
    },
    
    /**
     * Show an info toast
     * @param {string} message - The message to display
     * @param {object} options - Additional toast options
     */
    info: (message, options = {}) => {
      return toast.info(message, {
        duration: 500,
        ...options,
      })
    },
    
    /**
     * Show a warning toast
     * @param {string} message - The message to display
     * @param {object} options - Additional toast options
     */
    warning: (message, options = {}) => {
      return toast.warning(message, {
        duration: 500,
        ...options,
      })
    },
    
    /**
     * Show a default toast
     * @param {string} message - The message to display
     * @param {object} options - Additional toast options
     */
    default: (message, options = {}) => {
      return toast(message, {
        duration: 500,
        ...options,
      })
    },
    
    /**
     * Show a promise toast (for async operations)
     * @param {Promise} promise - The promise to track
     * @param {object} messages - Messages for loading, success, and error states
     * @param {object} options - Additional toast options
     */
    promise: (promise, messages, options = {}) => {
      return toast.promise(promise, {
        loading: messages.loading || "Loading...",
        success: messages.success || "Success!",
        error: messages.error || "Something went wrong",
        ...options,
      })
    },
  }
}

// Also export toast directly for convenience
export { toast }


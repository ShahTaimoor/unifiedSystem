import { logout } from "@/redux/slices/auth/authSlice"
import { useDispatch } from "react-redux"

const useErrorLogout = () => {
    const dispatch = useDispatch()

    const handleErrorLogout = (error, otherTitle = 'Error Occurred') => {
        // Check if error and error.response exist before accessing
        if (error?.response?.status === 400) {
            dispatch(logout())
            // No toast notification - rely on automatic redirect
            // The ProtectedRoute component will handle the redirect to login page
        }
    }

    return { handleErrorLogout }
}

export default useErrorLogout
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { Home, User, ShoppingBag, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { logoutUser } from "../../redux/slices/auth/authSlice";
import { useToast } from "@/hooks/use-toast";

const ToggleLogout = ({ user }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const clearCookies = () => {
        const cookies = ['accessToken', 'refreshToken'];
        const domains = [window.location.hostname, 'localhost', '127.0.0.1'];
        const paths = ['/', '/api'];
        
        cookies.forEach(cookieName => {
            domains.forEach(domain => {
                paths.forEach(path => {
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${domain};`;
                    document.cookie = `${cookieName}=; max-age=0; path=${path};`;
                    document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=${domain};`;
                    document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=.${domain};`;
                });
            });
        });
    };

    const handleLogout = async () => {
        clearCookies();
        
        try {
            await dispatch(logoutUser()).unwrap();
            toast.success('Logged out successfully');
        } catch (error) {
            toast.success('Logged out successfully');
        } finally {
            clearCookies();
            navigate('/');
        }
    };

    return (
        <div>
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar>
                <AvatarFallback className="cursor-pointer">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/orders')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
  
        <div className="hidden md:block">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                <User className="h-4 w-4 mr-2" />
                {user?.name || 'Menu'}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/orders')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    );
};

export default ToggleLogout;

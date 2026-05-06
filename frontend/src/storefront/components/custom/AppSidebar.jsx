import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { fetchOrdersAdmin, fetchPendingOrderCount, updateOrderStatus } from "@/storefront/redux/slices/order/orderSlice";
import { fetchLowStockCount } from "@/storefront/redux/slices/products/productSlice";
import attendanceService from "@/storefront/services/attendanceService";
import { useAuth } from "@/storefront/hooks/use-auth";
import {
  FilePlus2Icon,
  ChartBarStacked,
  GalleryVerticalEnd,
  PackageSearch,
  ChartBar,
  UserCheck,
  ShoppingCart,
  UserCog,
  ImageIcon,
  LogOut,
  Settings,
  Bell,
  ChevronRight,
  AlertTriangle,
  CalendarCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useEffect, useState } from "react";


// Sidebar links with enhanced structure
const items = [
  { 
    title: "All Products", 
    url: "/admin/dashboard/all-products", 
    icon: GalleryVerticalEnd, 
    description: "Manage Products",
    category: "main"
  },
  { 
    title: "Create Product", 
    url: "/admin/dashboard", 
    icon: FilePlus2Icon, 
    description: "Add New Product",
    category: "main"
  },
  { 
    title: "Categories", 
    url: "/admin/category", 
    icon: ChartBarStacked, 
    description: "Product Categories",
    category: "main"
  },
  { 
    title: "Media Library", 
    url: "/admin/dashboard/media", 
    icon: ImageIcon, 
    description: "Manage Assets",
    category: "main"
  },
  { 
    title: "Attendance", 
    url: "/admin/dashboard/attendance", 
    icon: CalendarCheck, 
    description: "Employee Attendance",
    category: "main"
  },
  { 
    title: "Top Performers", 
    url: "/admin/dashboard/attendance-performance", 
    icon: ChartBar, 
    description: "Attendance Stats",
    category: "main"
  },
  { 
    title: "Low Stock", 
    url: "/admin/dashboard/low-stock", 
    icon: AlertTriangle, 
    showBadge: true,
    badgeKey: "lowStock",
    description: "Low Stock Products",
    category: "main"
  },
  { 
    title: "Orders", 
    url: "/admin/dashboard/orders", 
    icon: PackageSearch, 
    showBadge: true, 
    badgeKey: "pendingOrders",
    description: "Order Management",
    category: "orders"
  },
  { 
    title: "Users", 
    url: "/admin/dashboard/users", 
    icon: UserCheck, 
    description: "User Management",
    category: "users"
  },
  { 
    title: "Customer View", 
    url: "/", 
    icon: ShoppingCart, 
    description: "View as Customer",
    category: "external"
  },
];

export function AppSidebar() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { orders } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const pendingOrderCount = useSelector((state) => state.orders.pendingOrderCount);
  const lowStockCount = useSelector((state) => state.products.lowStockCount);
  const { handleLogout } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  // Fetch orders and low stock count after login
  useEffect(() => {
    if (user) {
      dispatch(fetchOrdersAdmin());
      dispatch(fetchPendingOrderCount());
      dispatch(fetchLowStockCount());
    }
  }, [dispatch, user]);

  // Handle logout with loading state
  const onLogout = async () => {
    setLoading(true);
    try {
      await handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    // ...existing code...
    await dispatch(updateOrderStatus({ orderId, status: newStatus, packerName: packer })).unwrap();
    dispatch(fetchPendingOrderCount());
  };

  if (message) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <Sidebar className="border-r border-gray-100 bg-gray-50/50 shadow-lg font-['Inter',sans-serif]">
      {/* Modern Header with User Info */}
      <SidebarHeader className="p-3 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
        {/* User Profile Section */}
        {user && (
          <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8 border border-gray-300 shadow-sm">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-bold">
                {user.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-bold text-sm truncate" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em', fontWeight: 600 }}>
                {user.name || 'Admin'}
              </p>
              <p className="text-gray-400 text-[11px] truncate mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2.5 bg-transparent">
        {/* Main Navigation */}
        <SidebarGroup>
          <div className="mb-3">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1.5 px-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              Main Navigation
            </h3>
            <SidebarMenu className="space-y-0.5">
              {items.filter(item => item.category === 'main').map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`group relative transition-all duration-150 rounded-lg ${
                        isActive
                          ? "bg-white text-blue-600 shadow-md border-l-4 border-blue-600"
                          : "text-gray-600 hover:bg-white/80 hover:text-gray-900 hover:shadow-sm"
                      }`}
                    >
                      <Link 
                        to={item.url} 
                        className="flex items-center gap-2.5 p-2 w-full relative"
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        <Icon className={`w-4 h-4 transition-all ${
                          isActive 
                            ? "text-blue-600 scale-110" 
                            : "text-gray-400 group-hover:text-gray-700 group-hover:scale-105"
                        }`} />
                        <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.015em' }}>
                          {item.title}
                        </span>
                        
                        {/* Badge for Low Stock in main navigation */}
                        {item.showBadge && item.badgeKey === "lowStock" && lowStockCount > 0 && (
                          <Badge className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 ml-auto border-0 rounded-full min-w-[20px] text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {lowStockCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* Orders Section */}
          <div className="mb-3">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1.5 px-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              Orders & Users
            </h3>
            <SidebarMenu className="space-y-0.5">
              {items.filter(item => item.category === 'orders' || item.category === 'users').map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`group relative transition-all duration-150 rounded-lg ${
                        isActive
                          ? "bg-white text-blue-600 shadow-md border-l-4 border-blue-600"
                          : "text-gray-600 hover:bg-white/80 hover:text-gray-900 hover:shadow-sm"
                      }`}
                    >
                      <Link 
                        to={item.url} 
                        className="flex items-center gap-2.5 p-2 w-full relative"
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        <Icon className={`w-4 h-4 transition-all ${
                          isActive 
                            ? "text-blue-600 scale-110" 
                            : "text-gray-400 group-hover:text-gray-700 group-hover:scale-105"
                        }`} />
                        <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.015em' }}>
                          {item.title}
                        </span>
                        
                        {/* Badge for Orders */}
                        {item.showBadge && item.badgeKey === "pendingOrders" && pendingOrderCount > 0 && (
                          <Badge className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 ml-auto border-0 rounded-full min-w-[20px] text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {pendingOrderCount}
                          </Badge>
                        )}
                        
                        {/* Badge for Low Stock */}
                        {item.showBadge && item.badgeKey === "lowStock" && lowStockCount > 0 && (
                          <Badge className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 ml-auto border-0 rounded-full min-w-[20px] text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {lowStockCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* External Links */}
          <div className="mb-3">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1.5 px-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              External
            </h3>
            <SidebarMenu className="space-y-0.5">
              {items.filter(item => item.category === 'external').map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`group relative transition-all duration-150 rounded-lg ${
                        isActive
                          ? "bg-white text-blue-600 shadow-md border-l-4 border-blue-600"
                          : "text-gray-600 hover:bg-white/80 hover:text-gray-900 hover:shadow-sm"
                      }`}
                    >
                      <Link 
                        to={item.url} 
                        className="flex items-center gap-2.5 p-2 w-full relative"
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        <Icon className={`w-4 h-4 transition-all ${
                          isActive 
                            ? "text-blue-600 scale-110" 
                            : "text-gray-400 group-hover:text-gray-700 group-hover:scale-105"
                        }`} />
                        <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.015em' }}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* Modern Footer with Enhanced Logout */}
      <SidebarFooter className="p-2.5 border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="space-y-1.5">
          {/* Admin Profile Link */}
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-sm h-8 rounded-lg transition-all duration-150"
          >
            <Link 
              to="/admin/profile" 
              className="flex items-center gap-2.5"
              onClick={() => {
                if (isMobile) {
                  setOpenMobile(false);
                }
              }}
            >
              <UserCog className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.015em' }}>
                Admin Profile
              </span>
            </Link>
          </Button>
          
          {/* Logout Button */}
          <Button
            onClick={onLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-150 h-8 rounded-lg"
            disabled={loading}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-xs">Logging out...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-xs">Logout</span>
              </div>
            )}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

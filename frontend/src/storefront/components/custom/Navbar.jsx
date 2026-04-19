import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import { useSelector } from "react-redux";
import { useRef, useState, useEffect, useMemo } from "react";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeFromCart, updateCartQuantity, fetchCart } from "../../redux/slices/cart/cartSlice";
import CartImage from "../ui/CartImage";
import Checkout from "../../pages/Checkout";
import { useAuthDrawer } from "../../contexts/AuthDrawerContext";
import SearchSuggestions from "./SearchSuggestions";

// Cart Product Component
const CartProduct = ({ product, quantity }) => {
  const dispatch = useDispatch();
  const [inputQty, setInputQty] = useState(quantity);
  const { _id, title, price, stock } = product;
  const image = product.image || product.picture?.secure_url;

  const updateQuantity = (newQty) => {
    if (newQty !== quantity && newQty > 0 && newQty <= stock) {
      setInputQty(newQty);
      dispatch(updateCartQuantity({ productId: _id, quantity: newQty }));
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    dispatch(removeFromCart(_id));
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (inputQty > 1) {
      updateQuantity(inputQty - 1);
    }
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (inputQty < stock) {
      updateQuantity(inputQty + 1);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <CartImage
          src={image}
          alt={title}
          className="w-12 h-12 rounded-md border border-gray-200 object-cover"
          fallback="/fallback.jpg"
          quality={80}
        />
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{title}</h4>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center border border-gray-200 rounded-md">
          <button
            onClick={handleDecrease}
            className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={inputQty <= 1}
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium text-gray-900">{inputQty}</span>
          <button
            onClick={handleIncrease}
            className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={inputQty >= stock}
          >
            +
          </button>
        </div>
        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  const cartRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const { openDrawer } = useAuthDrawer();

  // Calculate total quantity
  const totalQuantity = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  );

  // Fetch cart when user is authenticated (on mount and when user changes)
  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Check if user is on mobile/tablet (< 1024px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Mobile-only scroll detection
  useEffect(() => {
    // Only enable scroll detection on mobile
    if (window.innerWidth < 1024) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 100);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleBuyNow = () => {
    if (!user) {
      openDrawer('login');
      return;
    }
    if (cartItems.length === 0) {
      return;
    }
    setOpenCheckoutDialog(true);
  };

  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm hidden lg:block`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left side: Logo + Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <img
                  src="/logo.jpeg"
                  alt="GULTRADERS Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-semibold text-gray-900">GULTRADERS</div>
                <div className="text-xs text-gray-500">Wholesale Dealers</div>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <SearchSuggestions
              placeholder="Search products..."
              className="w-full"
              inputClassName="w-full"
            />
          </div>

          {/* Right side: Contact, Cart, Auth */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Contact Number */}
            <div className="hidden md:flex items-center">
              <div className="text-sm text-gray-700">
                <span className="font-medium text-gray-600">Contact:</span>
                <span className="ml-2 text-primary font-semibold text-base">+92 311 4000096</span>
              </div>
            </div>

            {/* Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative p-2 bg-white rounded-full shadow-lg hover:shadow-xl border border-gray-200 hover:bg-gray-50 transition-all duration-300 hover:scale-110">
                  <ShoppingCart size={20} className="text-gray-700" />
                  {totalQuantity > 0 && (
                    <Badge className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 bg-primary text-white border-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full animate-pulse">
                      {totalQuantity}
                    </Badge>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-lg font-semibold text-gray-900">Shopping Cart</SheetTitle>
                  <SheetDescription className="text-gray-600">
                    {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} in your cart
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 max-h-[60vh] overflow-y-auto">
                  {cartItems.length > 0 ? (
                    cartItems
                      .filter((item) => item.product && item.product._id)
                      .map((item) => (
                        <CartProduct
                          key={item.product._id}
                          product={item.product}
                          quantity={item.quantity}
                        />
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  )}
                </div>
                <SheetFooter className="mt-6">
                  <SheetClose asChild>
                    <Button
                      onClick={handleBuyNow}
                      disabled={cartItems.length === 0}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5"
                    >
                      Proceed to Checkout
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Auth */}
            {user == null ? (
              <button
                onClick={() => openDrawer()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign Up
              </button>
            ) : (
              <LogoutToggle user={user} />
            )}
          </div>
        </div>
      </div>
    </nav>


    {/* Checkout Dialog */}
    <Dialog open={openCheckoutDialog} onOpenChange={setOpenCheckoutDialog}>
      <DialogContent className="w-full lg:max-w-6xl h-[62vh] sm:h-[70vh] sm:w-[60vw] overflow-hidden p-0 bg-white rounded-xl shadow-xl flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Complete your order</DialogDescription>
        </DialogHeader>
        <Checkout closeModal={() => setOpenCheckoutDialog(false)} />
      </DialogContent>
    </Dialog>
    </>
  );
};

export default Navbar;

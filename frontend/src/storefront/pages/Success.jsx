import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Home, ShoppingCart } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { Badge } from '../components/ui/badge'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '../components/ui/sheet'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { removeFromCart, updateCartQuantity } from '../redux/slices/cart/cartSlice'
import CartImage from '../components/ui/CartImage'
import Checkout from './Checkout'
import { useAuthDrawer } from '../contexts/AuthDrawerContext'

// Cart Product Component
const CartProduct = ({ product, quantity }) => {
  const dispatch = useDispatch()
  const [inputQty, setInputQty] = useState(quantity)
  const { _id, title, price, stock } = product
  const image = product.image || product.picture?.secure_url

  const updateQuantity = (newQty) => {
    if (newQty !== quantity && newQty > 0 && newQty <= stock) {
      setInputQty(newQty)
      dispatch(updateCartQuantity({ productId: _id, quantity: newQty }))
    }
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    dispatch(removeFromCart(_id))
  }

  const handleDecrease = (e) => {
    e.stopPropagation()
    if (inputQty > 1) {
      updateQuantity(inputQty - 1)
    }
  }

  const handleIncrease = (e) => {
    e.stopPropagation()
    if (inputQty < stock) {
      updateQuantity(inputQty + 1)
    }
  }

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
  )
}

const Success = () => {
  const [countdown, setCountdown] = useState(5)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false)
  const navigate = useNavigate()
  
  const { items: cartItems = [] } = useSelector((state) => state.cart)
  const { user } = useSelector((state) => state.auth)
  const { openDrawer } = useAuthDrawer()

  // Calculate total quantity
  const totalQuantity = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (countdown === 0) {
      navigate('/')
    }
  }, [countdown, navigate])

  // Scroll and mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const handleBuyNow = useCallback(() => {
    if (!user) {
      openDrawer('login')
      return
    }
    if (cartItems.length === 0) {
      return
    }
    setOpenCheckoutDialog(true)
  }, [user, cartItems.length, navigate, openDrawer])

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Order Successful!
        </h1>
        
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        {/* Countdown Timer */}
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-2">
            Redirecting to homepage in:
          </div>
          <div className="text-2xl font-bold text-primary">
            {countdown} seconds
          </div>
        </div>

        {/* Manual Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <Home className="w-4 h-4" />
          Go to Homepage Now
        </Link>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

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
    </div>
  )
}

export default Success
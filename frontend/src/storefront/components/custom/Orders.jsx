import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePagination } from '@/storefront/hooks/use-pagination';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/storefront/components/ui/dialog';
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
} from '@/storefront/components/ui/alert-dialog';
import OrderData from './OrderData';
import { fetchOrdersAdmin, updateOrderStatus, fetchPendingOrderCount, deleteOrder, bulkDeleteOrders } from '@/storefront/redux/slices/order/orderSlice';
import { useToast } from '@/storefront/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  CalendarDays, 
  List, 
  Share2, 
  FileDown, 
  Trash2, 
  Filter,
  Eye,
  Package,
  User,
  MapPin,
  Phone,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  Grid3X3,
  List as ListIcon,
  BarChart3,
  Search,
  Clock,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { imageService } from '@/storefront/services/imageService';
import { getViewModeButtonClassName, getPaginationButtonClassName } from '@/storefront/utils/classNameHelpers';
import { getPakistaniDate, getImageBase64, statusColors, statusIcons } from '@/storefront/utils/orderHelpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/storefront/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/storefront/components/ui/table";

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to calculate order total from products (using current prices)
function calculateOrderTotal(order) {
  if (!order || !order.products) return 0;
  return order.products.reduce((sum, p) => {
    const price = p.id?.price || 0;
    const quantity = p.quantity || 0;
    return sum + (price * quantity);
  }, 0);
}

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const today = getPakistaniDate();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState('All');
  const [localOrders, setLocalOrders] = useState([]);
  const [packerNames, setPackerNames] = useState({});
  const [limit, setLimit] = useState(24);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showFilters, setShowFilters] = useState(false);
  const [shopNameSearch, setShopNameSearch] = useState('');
  const [mobileSearch, setMobileSearch] = useState('');
  const totalItems = useSelector((state) => state.orders.totalItems) || 0;
  const clickTimer = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
  const [imagesInvoiceLoading, setImagesInvoiceLoading] = useState(false);

  // Use pagination hook to eliminate pagination duplication
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 24,
    totalItems,
    onPageChange: (page) => {
      // Fetch orders for the new page
      dispatch(fetchOrdersAdmin({ page, limit, status: statusFilter }));
    }
  });

  const handlePackerNameChange = (orderId, name) => {
    setPackerNames((prev) => ({
      ...prev,
      [orderId]: name,
    }));
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === 'Completed') {
      const packer = packerNames[orderId];
      if (!packer) {
        return;
      }
    }
  
    try {
      const result = await dispatch(
        updateOrderStatus({ 
          orderId, 
          status: newStatus, 
          packerName: packerNames[orderId] || '' 
        })
      ).unwrap();
      
      setLocalOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? result.data : order
        )
      );

      dispatch(fetchPendingOrderCount());
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error(error || 'Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await dispatch(deleteOrder(orderId)).unwrap();
      
      // Update local orders state
      setLocalOrders((prev) => prev.filter(order => order._id !== orderId));
      
      // Refresh pending order count
      dispatch(fetchPendingOrderCount());
      toast.success('Order deleted successfully!');
    } catch (error) {
      toast.error(error || 'Failed to delete order');
    }
  };

  const handleDeleteAllOrders = async () => {
    try {
      const allOrderIds = filteredOrders.map(order => order._id);
      await dispatch(bulkDeleteOrders(allOrderIds)).unwrap();
      
      // Clear local orders state
      setLocalOrders([]);
      
      // Refresh pending order count
      dispatch(fetchPendingOrderCount());
      toast.success(`Successfully deleted ${allOrderIds.length} order(s)!`);
    } catch (error) {
      toast.error(error || 'Failed to delete orders');
    }
  };

  const handleLimitChange = (newLimit) => {
    const newLimitValue = parseInt(newLimit);
    setLimit(newLimitValue);
    // Reset to first page when changing limit
    pagination.resetPagination();
    dispatch(fetchOrdersAdmin({ page: 1, limit: newLimitValue }));
  };

  useEffect(() => {
    dispatch(fetchOrdersAdmin({ page: pagination.currentPage, limit }));
  }, [dispatch, pagination.currentPage, limit]);

  useEffect(() => {
    if (status === 'succeeded') {
      setLocalOrders((prev) => {
        // Create a map of existing orders for quick lookup
        const orderMap = new Map(prev.map(order => [order._id, order]));
        
        // Update existing orders or add new ones
        const updatedOrders = orders.map(order => 
          orderMap.get(order._id) || order
        );
        
        // Preserve any orders that aren't in the new response
        const remainingOrders = prev.filter(order => 
          !orders.some(o => o._id === order._id)
        );
        
        return [...updatedOrders, ...remainingOrders];
      });

      // Initialize packer names
      const initialPackerNames = {};
      orders.forEach((order) => {
        if (order.packerName) {
          initialPackerNames[order._id] = order.packerName;
        }
      });
      setPackerNames((prev) => ({ ...prev, ...initialPackerNames }));
    }

    if (status === 'failed') {
    }
  }, [status, error, orders]);

  const filteredOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((order) => {
      // Skip date filter when "All Orders" is selected
      if (statusFilter === 'All') {
        return true;
      }
      // Date range filter based on Pakistan timezone
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
      return orderDate >= fromDate && orderDate <= toDate;
    })
    .filter((order) => {
      if (statusFilter !== 'All') {
        return order.status?.toLowerCase() === statusFilter.toLowerCase();
      }
      return true;
    })
    .filter((order) => {
      // Shop name filter
      const shopName = order.userId?.name || order.user?.name || '';
      const matchesShopName = !shopNameSearch || 
        shopName.toLowerCase().includes(shopNameSearch.toLowerCase());
      return matchesShopName;
    })
    .filter((order) => {
      // Mobile number filter
      const phoneNumber = order.phone ? String(order.phone) : '';
      const matchesMobile = !mobileSearch || 
        phoneNumber.includes(mobileSearch);
      return matchesMobile;
    });

  const handleShare = async (order) => {
    const details = `
Order #${order._id.slice(-6)}
Status: ${order.status}
Amount: Rs. ${order.amount}
Products:
${order.products.map((p, i) =>
  `${i + 1}. ${p.id?.name} (Qty: ${p.quantity}, Price: Rs. ${p.id?.price})`
).join('\n')}
Shipping:
Address: ${order.address}
City: ${order.city}
Phone: ${order.phone}
    `.trim();

    const firstImageUrl = order.products[0]?.id?.picture?.secure_url || '/placeholder-product.jpg';

    if (navigator.canShare && navigator.canShare({ files: [] })) {
      try {
        const blob = await imageService.fetchImageBlob(firstImageUrl);
        const file = new File([blob], 'order-product.jpg', { type: blob.type });

        await navigator.share({
          title: `Order #${order._id.slice(-6)}`,
          text: details,
          files: [file],
        });
      } catch (err) {
        if (navigator.share) {
          navigator.share({
            title: `Order #${order._id.slice(-6)}`,
            text: details,
          });
        } else {
          navigator.clipboard.writeText(details);
        }
      }
    } else if (navigator.share) {
      navigator.share({
        title: `Order #${order._id.slice(-6)}`,
        text: details,
      });
    } else {
      navigator.clipboard.writeText(details);
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(details)}`;
  };

  const handleDownloadImagesInvoice = async (order) => {
    setImagesInvoiceLoading(true);
    try {
      const products = order.products;
      const BATCH_SIZE = 3; // Process 3 images at a time to prevent browser freeze
      
      // Prepare table data with images as base64 (no prices)
      const tableRows = [];
      
      // Process images in batches
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        
        // Process each image in the batch sequentially
        for (let j = 0; j < batch.length; j++) {
          const product = batch[j];
          const imgUrl = product.id?.picture?.secure_url || product.id?.image || "/placeholder-product.jpg";
          let imgData = "";
          
          try {
            const blob = await imageService.fetchImageBlob(imgUrl, 60000);
            // Resize image to reduce memory usage
            imgData = await resizeImageForPDF(blob, 200, 200);
          } catch (error) {
            console.warn(`Error processing image for product ${product.id?.title || 'unknown'}:`, error);
            imgData = ""; // fallback if image fails
          }
          
          // Add product row WITHOUT price
          tableRows.push([
            { content: "", img: imgData }, // image cell
            product.id?.title || "",
            product.quantity || "",
            // NO PRICE COLUMN
          ]);
          
          // Yield to browser after each image
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Delay between batches
        if (i + BATCH_SIZE < products.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Get shop information from order
      const customerInfo = order.userId || {};
      const shopName = customerInfo.name || 'Shop Name';
      const username = customerInfo.username || 'N/A';
      const city = order.city || 'N/A';
      const address = order.address || 'N/A';
      const phone = order.phone ? String(order.phone) : 'N/A';

      // Create PDF with professional design
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Color scheme - TCS Red Theme
      const primaryColor = [220, 38, 38]; // Red-600 (#DC2626)
      const darkGray = [51, 51, 51];
      const mediumGray = [100, 100, 100];
      const lightGray = [250, 250, 250];
      const borderGray = [220, 220, 220];
      const accentGray = [245, 245, 245];

      const orderDate = new Date(order.createdAt);
      const orderId = order._id.slice(-8).toUpperCase();

      // Start content from top
      let yPos = 15;

      // Shop Information Section
      const infoBoxPadding = 8;
      const addressLines = doc.splitTextToSize(address, contentWidth - 60);
      const addressHeight = addressLines.length > 1 ? (addressLines.length * 6.5) : 6.5;
      const infoBoxHeight = 21 + 13 + addressHeight + 3;
      
      doc.setFillColor(...lightGray);
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, contentWidth, infoBoxHeight, 'FD');
      
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPos, 4, infoBoxHeight, 'F');
      
      let currentY = yPos + infoBoxPadding;
      doc.setTextColor(...primaryColor);
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.text('SHOP INFORMATION', margin + 10, currentY);
      
      currentY += 5;
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, currentY, pageWidth - margin - 10, currentY);
      
      currentY += 8;
      doc.setFontSize(9.5);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      
      const leftCol = margin + 10;
      const rightCol = pageWidth / 2 + 5;
      const lineHeight = 6.5;
      const labelWidth = 35;
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Shop Name:', leftCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(shopName, leftCol + labelWidth, currentY);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Username:', rightCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(username, rightCol + 30, currentY);
      currentY += lineHeight;
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Phone:', leftCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(phone, leftCol + labelWidth, currentY);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('City:', rightCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(city, rightCol + 30, currentY);
      currentY += lineHeight;
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Address:', leftCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(addressLines, leftCol + labelWidth, currentY);
      
      yPos += infoBoxHeight + 10;

      // Product Table WITH images but WITHOUT prices
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('ORDER ITEMS', margin, yPos - 3);
      yPos += 5;
      
      autoTable(doc, {
        startY: yPos,
        head: [[
          { content: "IMAGE", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } },
          { content: "PRODUCT NAME", styles: { fillColor: primaryColor, textColor: 255, fontSize: 10 } },
          { content: "QTY", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } }
          // NO PRICE COLUMN
        ]],
        body: tableRows,
        theme: "striped",
        // Prevent rows from being split across pages
        rowPageBreak: 'avoid',
        // Check if row will fit before drawing
        didParseCell: function (data) {
          // Ensure minimum cell height for image rows
          if (data.row.index >= 0 && data.column.index === 0) {
            data.cell.minCellHeight = 50; // Minimum height to fit image
          }
        },
        // Draw image in cell
        didDrawCell: function (data) {
          if (data.column.index === 0 && data.cell.raw && data.cell.raw.img) {
            doc.addImage(data.cell.raw.img, "JPEG", data.cell.x + 3, data.cell.y + 3, 40, 40);
          }
        },
        columnStyles: {
          0: { cellWidth: 42 }, // Image column
          1: { cellWidth: 120 }, // Product Name column (wider since no price)
          2: { cellWidth: 25, halign: "center" }, // Quantity column
          // NO PRICE COLUMN
        },
        styles: { 
          valign: "middle", 
          fontSize: 9.5, 
          cellPadding: 5, 
          textColor: [0,0,0], 
          halign: "left",
          lineColor: borderGray,
          lineWidth: 0.3
        },
        headStyles: { 
          fillColor: primaryColor, 
          textColor: [255,255,255], 
          fontStyle: 'bold', 
          fontSize: 10,
          halign: "left" 
        },
        bodyStyles: { 
          minCellHeight: 50, // Increased to ensure image fits
          halign: "left",
          fillColor: [255, 255, 255]
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        }
      });

      // Footer
      const tableFinalY = doc.lastAutoTable.finalY || yPos + 60;
      const footerY = pageHeight - 25;
      
      if (tableFinalY < footerY) {
        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        doc.setFontSize(8);
        doc.setTextColor(...mediumGray);
        doc.setFont(undefined, 'normal');
        const generatedDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(
          `Generated on ${generatedDate}`,
          pageWidth / 2,
          footerY + 3,
          { align: 'center' }
        );
        
        doc.setFontSize(9);
        doc.setTextColor(...primaryColor);
        doc.setFont(undefined, 'bold');
        doc.text(
          'Thank you for your order!',
          pageWidth / 2,
          footerY + 10,
          { align: 'center' }
        );
      }

      // Download PDF
      const sanitizedShopName = shopName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      const fileName = `${sanitizedShopName}-Images-Invoice-${orderId}.pdf`;
      doc.save(fileName);
      
      toast.success(`Downloaded images invoice with ${products.length} products!`);
    } catch (error) {
      console.error('Error downloading images invoice:', error);
      toast.error('Failed to download images invoice. Please try again.');
    } finally {
      setImagesInvoiceLoading(false);
    }
  };

  const handlePdfClick = async (order) => {
    setPdfLoading(true);
    try {
      await handleSharePDF(order, { download: true });
      toast.success(`PDF downloaded successfully with ${order.products.length} products!`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setPdfLoading(false);
      setPdfProgress({ current: 0, total: 0 });
    }
  };

  const handleDownloadInvoice = async (order) => {
    setPdfLoading(true);
    try {
      // 1. Prepare table data WITHOUT images
      const tableRows = order.products.map((p) => {
        const unitPrice = p.id?.price || 0;
        const quantity = p.quantity || 0;
        const totalPrice = unitPrice * quantity;
        return [
          p.id?.title || "",
          quantity,
          totalPrice > 0 ? `Rs. ${totalPrice.toLocaleString()}` : "Rs. 0",
        ];
      });

      // 2. Get shop information from order (customer who placed the order)
      const customerInfo = order.userId || {};
      const shopName = customerInfo.name || 'Shop Name';
      const username = customerInfo.username || 'N/A';
      const city = order.city || 'N/A';
      const address = order.address || 'N/A';
      const phone = order.phone ? String(order.phone) : 'N/A';

      // 3. Create PDF with professional design
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Color scheme - TCS Red Theme
      const primaryColor = [220, 38, 38]; // Red-600 (#DC2626) - Primary brand color
      const darkGray = [51, 51, 51];
      const mediumGray = [100, 100, 100];
      const lightGray = [250, 250, 250];
      const borderGray = [220, 220, 220];
      const accentGray = [245, 245, 245];

      const orderDate = new Date(order.createdAt);
      const orderId = order._id.slice(-8).toUpperCase();

      // Start content from top
      let yPos = 15;

      // Shop Information Section
      const infoBoxPadding = 8;
      const addressLines = doc.splitTextToSize(address, contentWidth - 60);
      const addressHeight = addressLines.length > 1 ? (addressLines.length * 6.5) : 6.5;
      const infoBoxHeight = 21 + 13 + addressHeight + 3;
      
      doc.setFillColor(...lightGray);
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, contentWidth, infoBoxHeight, 'FD');
      
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPos, 4, infoBoxHeight, 'F');
      
      let currentY = yPos + infoBoxPadding;
      doc.setTextColor(...primaryColor);
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.text('SHOP INFORMATION', margin + 10, currentY);
      
      currentY += 5;
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, currentY, pageWidth - margin - 10, currentY);
      
      currentY += 8;
      doc.setFontSize(9.5);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      
      const leftCol = margin + 10;
      const rightCol = pageWidth / 2 + 5;
      const lineHeight = 6.5;
      const labelWidth = 35;
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Shop Name:', leftCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(shopName, leftCol + labelWidth, currentY);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Username:', rightCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(username, rightCol + 30, currentY);
      currentY += lineHeight;
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Phone:', leftCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(phone, leftCol + labelWidth, currentY);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('City:', rightCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(city, rightCol + 30, currentY);
      currentY += lineHeight;
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Address:', leftCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(addressLines, leftCol + labelWidth, currentY);
      
      yPos += infoBoxHeight + 10;

      // Product Table WITHOUT images
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('ORDER ITEMS', margin, yPos - 3);
      yPos += 5;
      
      autoTable(doc, {
        startY: yPos,
        head: [[
          { content: "PRODUCT NAME", styles: { fillColor: primaryColor, textColor: 255, fontSize: 10 } },
          { content: "QTY", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } },
          { content: "PRICE", styles: { halign: 'right', fillColor: primaryColor, textColor: 255, fontSize: 10 } }
        ]],
        body: tableRows,
        theme: "striped",
        columnStyles: {
          0: { halign: "left" }, // Product Name column - auto width, left aligned
          1: { cellWidth: 25, halign: "center" }, // Quantity column - fixed width for numbers
          2: { cellWidth: 40, halign: "right" }, // Price column - fixed width for prices
        },
        styles: { 
          fontSize: 9.5, 
          cellPadding: 5, 
          textColor: [0,0,0], 
          halign: "left",
          lineColor: borderGray,
          lineWidth: 0.3
        },
        headStyles: { 
          fillColor: primaryColor, 
          textColor: [255,255,255], 
          fontStyle: 'bold', 
          fontSize: 10
        },
        bodyStyles: { 
          halign: "left",
          fillColor: [255, 255, 255],
          cellPadding: 5
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        }
      });

      // Order Summary Box
      const tableFinalY = doc.lastAutoTable.finalY || yPos + 60;
      yPos = tableFinalY + 10;
      
      const summaryHeight = 25;
      doc.setFillColor(...accentGray);
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, contentWidth, summaryHeight, 'FD');
      
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPos, 4, summaryHeight, 'F');
      
      // Calculate total from products (using current prices shown in table)
      const calculatedTotal = order.products.reduce((sum, p) => {
        const price = p.id?.price || 0;
        const quantity = p.quantity || 0;
        return sum + (price * quantity);
      }, 0);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Total Amount:', margin + 10, yPos);
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      doc.text(`Rs. ${calculatedTotal.toLocaleString()}`, pageWidth - margin - 10, yPos, { align: 'right' });

      // Footer
      const finalY = yPos + summaryHeight;
      const footerY = pageHeight - 25;
      
      if (finalY < footerY) {
        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        doc.setFontSize(8);
        doc.setTextColor(...mediumGray);
        doc.setFont(undefined, 'normal');
        const generatedDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(
          `Generated on ${generatedDate}`,
          pageWidth / 2,
          footerY + 3,
          { align: 'center' }
        );
        
        doc.setFontSize(9);
        doc.setTextColor(...primaryColor);
        doc.setFont(undefined, 'bold');
        doc.text(
          'Thank you for your order!',
          pageWidth / 2,
          footerY + 10,
          { align: 'center' }
        );
      }

      const sanitizedShopName = shopName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      const fileName = `${sanitizedShopName}-Invoice-${orderId}.pdf`;
      doc.save(fileName);
    } catch (error) {
      // Error logging should be handled by error boundary or monitoring service
      toast.error('Failed to generate invoice. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Helper function to resize image before converting to base64 to reduce memory usage
  const resizeImageForPDF = async (blob, maxWidth = 200, maxHeight = 200) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((resizedBlob) => {
          if (resizedBlob) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(resizedBlob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, 'image/jpeg', 0.8); // 80% quality
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const handleSharePDF = async (order, { download = false } = {}) => {
    // 1. Prepare table data with images as base64 - Process in smaller batches to prevent browser freeze
    const BATCH_SIZE = 3; // Process only 3 images at a time to prevent browser freeze
    const products = order.products;
    const tableRows = [];
    
    // Initialize progress
    setPdfProgress({ current: 0, total: products.length });
    
    // Process images in smaller batches with delays to allow browser to breathe
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      // Process each image in the batch sequentially to avoid overwhelming the browser
      for (let j = 0; j < batch.length; j++) {
        const p = batch[j];
        const imgUrl = p.id?.picture?.secure_url || "/placeholder-product.jpg";
        let imgData = "";
        
        try {
          // Fetch image with timeout
          const blob = await imageService.fetchImageBlob(imgUrl, 60000);
          
          // Resize image to reduce memory usage before converting to base64
          imgData = await resizeImageForPDF(blob, 200, 200);
        } catch (error) {
          console.warn(`Error processing image for product ${p.id?.title || 'unknown'}:`, error);
          imgData = ""; // fallback if image fails
        }
        
        // Calculate total price (price × quantity)
        const unitPrice = p.id?.price || 0;
        const quantity = p.quantity || 0;
        const totalPrice = unitPrice * quantity;
        
        // Add product to table rows
        tableRows.push([
          { content: "", img: imgData }, // image cell
          p.id?.title || "",
          quantity,
          totalPrice > 0 ? `Rs. ${totalPrice.toLocaleString()}` : "Rs. 0",
        ]);
        
        // Update progress after each image
        const processed = i + j + 1;
        setPdfProgress({ current: processed, total: products.length });
        
        // Yield to browser after each image to prevent freezing
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Longer delay between batches to allow browser to process UI updates
      if (i + BATCH_SIZE < products.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Reset progress
    setPdfProgress({ current: 0, total: 0 });

    // 2. Get shop information from order (customer who placed the order)
    // Use order.userId which contains the customer's information
    const customerInfo = order.userId || {};
    const shopName = customerInfo.name || 'Shop Name';
    const username = customerInfo.username || 'N/A';
    const city = order.city || 'N/A';
    const address = order.address || 'N/A';
    const phone = order.phone ? String(order.phone) : 'N/A';

    // 3. Create PDF with professional design
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Color scheme - TCS Red Theme
    const primaryColor = [220, 38, 38]; // Red-600 (#DC2626) - Primary brand color
    const primaryDark = [153, 27, 27]; // Red-800 (#991B1B)
    const darkGray = [51, 51, 51];
    const mediumGray = [100, 100, 100];
    const lightGray = [250, 250, 250];
    const borderGray = [220, 220, 220];
    const accentGray = [245, 245, 245];

    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const orderId = order._id.slice(-8).toUpperCase();

    // Start content from top (no header)
    let yPos = 15;

    // Shop Information Section - Professional Card Design
    const infoBoxPadding = 8;
    
    // Calculate required height based on actual content
    const addressLines = doc.splitTextToSize(address, contentWidth - 60);
    const addressHeight = addressLines.length > 1 ? (addressLines.length * 6.5) : 6.5;
    // Calculate exact height: title area (8+5+8) + 2 data lines (13) + address (height) + minimal bottom padding (3)
    const infoBoxHeight = 21 + 13 + addressHeight + 3;
    
    // Background box with subtle border
    doc.setFillColor(...lightGray);
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, infoBoxHeight, 'FD');
    
    // Left accent bar
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPos, 4, infoBoxHeight, 'F');
    
    // Section Title
    let currentY = yPos + infoBoxPadding;
    doc.setTextColor(...primaryColor);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('SHOP INFORMATION', margin + 10, currentY);
    
    // Divider line
    currentY += 5;
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.line(margin + 10, currentY, pageWidth - margin - 10, currentY);
    
    currentY += 8;
    doc.setFontSize(9.5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    
    // Two-column layout for information
    const leftCol = margin + 10;
    const rightCol = pageWidth / 2 + 5;
    const lineHeight = 6.5;
    const labelWidth = 35;
    const startY = currentY;
    
    // First line: Shop Name and Username
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('Shop Name:', leftCol, currentY);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.text(shopName, leftCol + labelWidth, currentY);
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('Username:', rightCol, currentY);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.text(username, rightCol + 30, currentY);
    currentY += lineHeight;
    
    // Second line: Phone and City
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('Phone:', leftCol, currentY);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.text(phone, leftCol + labelWidth, currentY);
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('City:', rightCol, currentY);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.text(city, rightCol + 30, currentY);
    currentY += lineHeight;
    
    // Third line: Address spans full width
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...mediumGray);
    doc.text('Address:', leftCol, currentY);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkGray);
    doc.text(addressLines, leftCol + labelWidth, currentY);
    
    yPos += infoBoxHeight + 10;

    // 4. Add table with images - Professional Design
    // Section Title for Products
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('ORDER ITEMS', margin, yPos - 3);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [[
        { content: "IMAGE", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } },
        { content: "PRODUCT NAME", styles: { fillColor: primaryColor, textColor: 255, fontSize: 10 } },
        { content: "QTY", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } },
        { content: "PRICE", styles: { halign: 'right', fillColor: primaryColor, textColor: 255, fontSize: 10 } }
      ]],
      body: tableRows,
      theme: "striped",
      // Prevent rows from being split across pages
      rowPageBreak: 'avoid',
      // Check if row will fit before drawing
      didParseCell: function (data) {
        // Ensure minimum cell height for image rows
        if (data.row.index >= 0 && data.column.index === 0) {
          data.cell.minCellHeight = 50; // Minimum height to fit image
        }
      },
      // Draw image in cell
      didDrawCell: function (data) {
        if (data.column.index === 0 && data.cell.raw && data.cell.raw.img) {
          doc.addImage(data.cell.raw.img, "JPEG", data.cell.x + 3, data.cell.y + 3, 40, 40);
        }
      },
      columnStyles: {
        0: { cellWidth: 42 }, // Image column
        1: { cellWidth: 90 }, // Product Name column
        2: { cellWidth: 18, halign: "center" }, // Quantity column
        3: { cellWidth: 42, halign: "right" }, // Price column - increased width
      },
      styles: { 
        valign: "middle", 
        fontSize: 9.5, 
        cellPadding: 4, 
        textColor: [0,0,0], 
        halign: "left",
        lineColor: borderGray,
        lineWidth: 0.3
      },
      headStyles: { 
        fillColor: primaryColor, 
        textColor: [255,255,255], 
        fontStyle: 'bold', 
        fontSize: 10,
        halign: "left" 
      },
      bodyStyles: { 
        minCellHeight: 50, // Increased to ensure image fits
        halign: "left",
        fillColor: [255, 255, 255]
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      }
    });

    // Order Summary Box - Professional Design (Below the table)
    const tableFinalY = doc.lastAutoTable.finalY || yPos + 60;
    yPos = tableFinalY + 10;
    
    const summaryHeight = 25;
    doc.setFillColor(...accentGray);
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, summaryHeight, 'FD');
    
    // Left accent
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPos, 4, summaryHeight, 'F');
    
    // Calculate total from products (using current prices shown in table)
    const calculatedTotal = order.products.reduce((sum, p) => {
      const price = p.id?.price || 0;
      const quantity = p.quantity || 0;
      return sum + (price * quantity);
    }, 0);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Total Amount:', margin + 10, yPos);
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text(`Rs. ${calculatedTotal.toLocaleString()}`, pageWidth - margin - 10, yPos, { align: 'right' });

    // Professional Footer
    const finalY = yPos + summaryHeight;
    const footerY = pageHeight - 25;
    
    if (finalY < footerY) {
      // Footer divider line
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(...mediumGray);
      doc.setFont(undefined, 'normal');
      const generatedDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(
        `Generated on ${generatedDate}`,
        pageWidth / 2,
        footerY + 3,
        { align: 'center' }
      );
      
      // Thank you message
      doc.setFontSize(9);
      doc.setTextColor(...primaryColor);
      doc.setFont(undefined, 'bold');
      doc.text(
        'Thank you for your order!',
        pageWidth / 2,
        footerY + 10,
        { align: 'center' }
      );
    }

    // 5. Create filename with shop name (sanitize for filename)
    const sanitizedShopName = shopName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const fileName = `${sanitizedShopName}-Order-${order._id.slice(-6)}.pdf`;

    // 6. Share or download PDF
    try {
      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (!download && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: `Order Details`,
            text: "Order details attached as PDF.",
            files: [pdfFile],
          });
          return;
        } catch (err) {
          // fallback to download
        }
      }
      // Always download if double click or share not supported
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
      throw error;
    } finally {
      // Reset progress
      setPdfProgress({ current: 0, total: 0 });
    }
  };

  // Calculate stats
  const totalOrdersCount = totalItems || orders.length;
  const pendingOrders = orders.filter(order => order.status === 'Pending').length;
  const completedOrders = orders.filter(order => order.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="px-2 sm:px-4 py-4 sm:py-6 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Stats Cards Section */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-1.5 sm:gap-2 md:gap-4">
          {/* Total Orders Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-xs md:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 truncate">Total Orders</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{totalOrdersCount}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 sm:ml-2">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Pending Orders Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-xs md:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 truncate">Pending Orders</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-orange-600 truncate">{pendingOrders}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 sm:ml-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Completed Orders Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-xs md:text-sm font-medium text-gray-500 mb-0.5 sm:mb-1 truncate">Completed</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600 truncate">{completedOrders}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 sm:ml-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Top Row: Status Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              {/* Status Filter Tabs */}
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter('All')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-initial ${
                    statusFilter === 'All'
                      ? 'bg-gray-900 text-white border-2 border-gray-900'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => setStatusFilter('Pending')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-initial ${
                    statusFilter === 'Pending'
                      ? 'bg-gray-900 text-white border-2 border-gray-900'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('Completed')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-initial ${
                    statusFilter === 'Completed'
                      ? 'bg-gray-900 text-white border-2 border-gray-900'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Bottom Row: Search and Filter Inputs */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-end">
              {/* Left side: Filter inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 flex-1 w-full lg:w-auto">
                {/* Shop Name Search */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="shopNameSearch" className="text-xs font-medium text-gray-700">
                    Shop Name
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      id="shopNameSearch"
                      type="text"
                      placeholder="Search shop..."
                      value={shopNameSearch}
                      onChange={(e) => setShopNameSearch(e.target.value)}
                      className="w-full pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Mobile Search */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mobileSearch" className="text-xs font-medium text-gray-700">
                    Mobile
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      id="mobileSearch"
                      type="text"
                      placeholder="Search mobile..."
                      value={mobileSearch}
                      onChange={(e) => setMobileSearch(e.target.value)}
                      className="w-full pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* From Date */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fromDate" className="text-xs font-medium text-gray-700">
                    From Date
                  </Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      max={today}
                      className="w-full pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* To Date */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="toDate" className="text-xs font-medium text-gray-700">
                    To Date
                  </Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate}
                      max={today}
                      className="w-full pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Per Page */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    Per Page
                  </Label>
                  <Select value={limit.toString()} onValueChange={handleLimitChange}>
                    <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm border-gray-300 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="36">36</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right side: View Toggle and Bulk Actions */}
              <div className="flex flex-row items-end gap-2 sm:gap-3 w-full lg:w-auto">
                {/* View Toggle */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-gray-700 opacity-0">
                    View
                  </Label>
                  <div className="flex gap-1 border border-gray-300 rounded-md bg-white p-0.5 sm:p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 sm:p-2 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 sm:p-2 rounded transition-colors ${
                        viewMode === 'table'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <ListIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {/* Bulk Actions Button */}
                {filteredOrders.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-gray-700 opacity-0">
                      Actions
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="gap-1.5 sm:gap-2 bg-red-600 hover:bg-red-700 h-9 sm:h-10 px-3 sm:px-4 rounded-lg text-xs sm:text-sm whitespace-nowrap"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Bulk Actions</span>
                          <span className="sm:hidden">Bulk</span>
                          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={handleDeleteAllOrders}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete All ({filteredOrders.length})
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Display */}
        {status === 'loading' ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center h-48 sm:h-64 text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div className="rounded-full bg-gray-100 p-3 sm:p-4">
                <List className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {statusFilter === 'All' 
                    ? 'No orders found'
                    : `No ${statusFilter.toLowerCase()} orders found from ${fromDate} to ${toDate}`}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  {statusFilter === 'All' 
                    ? 'There are no orders in the system'
                    : 'Check back later for new orders'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status] || AlertCircle;
              return (
                <Card key={order._id} className="hover:shadow-lg transition-all duration-200 border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2 sm:pb-3 border-b border-gray-100 bg-gray-50/50 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="rounded-lg bg-blue-100 p-1.5 sm:p-2 flex-shrink-0">
                          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">
                            {new Date(order.createdAt).toLocaleString('en-US', {
                              timeZone: 'Asia/Karachi',
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusColors[order.status]} border px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs flex-shrink-0`}>
                        <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />
                        <span className="hidden sm:inline">{order.status}</span>
                        <span className="sm:hidden">{order.status.slice(0, 1)}</span>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 px-3 sm:px-6">
                    {/* Order Summary */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold">Amount</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 truncate">Rs. {calculateOrderTotal(order).toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold">Items</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">{order.products.length}</p>
                      </div>
                    </div>

                    {/* Products Preview */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Products</p>
                      <ScrollArea className="h-28 sm:h-32 rounded-lg border border-gray-200 bg-gray-50/50">
                        <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                          {order.products.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-white rounded border border-gray-100 shadow-sm">
                              <img
                                {...imageService.getSafeImageProps(
                                  item?.id?.picture?.secure_url,
                                  item.id?.name || 'Product image',
                                  '/placeholder-product.jpg',
                                  'eager'
                                )}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-cover border border-gray-200 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium truncate text-gray-900">{item.id?.name}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">
                                  Qty: {item.quantity} × Rs. {item.id?.price}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.products.length > 3 && (
                            <p className="text-[10px] sm:text-xs text-gray-500 text-center py-1">
                              +{order.products.length - 3} more products
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                          {order.userId?.name ? capitalizeFirst(order.userId.name) : 'Customer'}
                        </span>
                      </div>
                      <div className="space-y-1 pl-5 sm:pl-6 border-l-2 border-gray-200">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                          <p className="text-[10px] sm:text-xs text-gray-600 truncate">{order.phone}</p>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <p className="text-[10px] sm:text-xs text-gray-600 truncate">{order.city}</p>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <p className="text-[10px] sm:text-xs text-gray-600 truncate" title={order.address}>{order.address}</p>
                        </div>
                       
                      </div>
                    </div>

                    {/* Packer Name Input */}
                    {order.status === 'Pending' && (
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Packer Name</label>
                        <Input
                          placeholder="Enter packer name"
                          value={packerNames[order._id] || ''}
                          onChange={(e) => handlePackerNameChange(order._id, e.target.value)}
                          className="text-xs sm:text-sm h-8 sm:h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Packer Info */}
                    {order.status === 'Completed' && order.packerName && (
                      <div className="p-2 sm:p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wide">Packed by</span>
                          <p className="text-xs sm:text-sm text-emerald-900 font-medium truncate">{order.packerName}</p>
                        </div>
                      </div>
                    )}

                    {/* Status Update */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Update Status</label>
                      <Select
                        value={order.status || 'Pending'}
                        onValueChange={(newStatus) => handleStatusUpdate(order._id, newStatus)}
                      >
                        <SelectTrigger className="w-full h-8 sm:h-10 border-gray-300 text-xs sm:text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 sm:pt-4 border-t border-gray-100 bg-gray-50/30 px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="flex gap-1.5 sm:gap-2 w-full">
                      <Dialog onOpenChange={(open) => open && setSelectedOrder(order)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 gap-1.5 sm:gap-2 border-gray-300 hover:bg-gray-50 text-gray-700 h-8 sm:h-10 text-xs sm:text-sm">
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Details</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
                          <DialogHeader className="border-b pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                              <span className="truncate">Order Details <span className="text-gray-400 font-normal">#{order._id.slice(-6)}</span></span>
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                              Complete information for this order placed on {new Date(order.createdAt).toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>

                          {selectedOrder && (
                            <div className="space-y-6 pt-4">
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-9 w-9 border-gray-300">
                                      <MoreVertical className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleShare(selectedOrder)}>
                                      <Share2 className="mr-2 h-4 w-4 text-gray-500" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Download</DropdownMenuLabel>
                                    <DropdownMenuItem 
                                      onClick={() => handleDownloadImagesInvoice(selectedOrder)}
                                      disabled={imagesInvoiceLoading || pdfLoading}
                                    >
                                      <ImageIcon className="mr-2 h-4 w-4 text-gray-500" />
                                      {imagesInvoiceLoading ? 'Generating...' : 'Download Images Invoice (no price)'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handlePdfClick(selectedOrder)}
                                      disabled={pdfLoading || imagesInvoiceLoading}
                                    >
                                      <FileDown className="mr-2 h-4 w-4 text-gray-500" />
                                      {pdfLoading 
                                        ? (pdfProgress.total > 0 
                                            ? `Processing ${pdfProgress.current}/${pdfProgress.total} products...` 
                                            : 'Generating PDF...')
                                        : 'Download PDF (with images)'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDownloadInvoice(selectedOrder)}
                                      disabled={pdfLoading || imagesInvoiceLoading}
                                    >
                                      <FileDown className="mr-2 h-4 w-4 text-gray-500" />
                                      {pdfLoading ? 'Generating...' : 'Download Invoice (no images)'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <OrderData
                                price={calculateOrderTotal(selectedOrder)}
                                address={selectedOrder.address}
                                phone={selectedOrder.phone}
                                city={selectedOrder.city}
                                createdAt={selectedOrder.createdAt}
                                products={selectedOrder.products}
                                packerName={selectedOrder.packerName}
                                hideStatus={true}
                                hideCOD={true}
                                hideDownload={true}
                                user={selectedOrder.userId || selectedOrder.user || user}
                                _id={selectedOrder._id}
                              />
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="border-gray-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-8 w-8 sm:h-10 sm:w-10">
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this order? This action will:
                              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                                <li>Permanently remove the order from the system</li>
                                <li>Restore the product stock that was deducted</li>
                                <li>This action cannot be undone</li>
                              </ul>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteOrder(order._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Order
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">Customer Name</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">Contact Info</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">Products</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600 text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = statusIcons[order.status] || AlertCircle;
                    return (
                      <TableRow key={order._id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900 text-xs sm:text-sm">
                          <span className="truncate block max-w-[120px] sm:max-w-none">
                            {order.userId?.name ? capitalizeFirst(order.userId.name) : 'Customer'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">{order.phone}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[100px] sm:max-w-40" title={order.address}>{order.address}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-200 font-normal text-[10px] sm:text-xs">
                              {order.products.length} items
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-gray-900 text-xs sm:text-sm">
                          <span className="truncate block">Rs. {calculateOrderTotal(order).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[order.status]} border font-medium text-[10px] sm:text-xs`}>
                            <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            <span className="hidden sm:inline">{order.status}</span>
                            <span className="sm:hidden">{order.status.slice(0, 1)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] sm:text-sm text-gray-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                <Eye className="mr-2 h-4 w-4 text-gray-500" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(order)}>
                                <Share2 className="mr-2 h-4 w-4 text-gray-500" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePdfClick(order)}>
                                <FileDown className="mr-2 h-4 w-4 text-gray-500" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteOrder(order._id)}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {orders.length > 0 && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-4 sm:mt-8">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pagination.goToPreviousPage}
                    disabled={!pagination.hasPreviousPage}
                    className="border-gray-300 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  {pagination.getVisiblePages().map((pg, index) => (
                    <Button
                      key={pg === '...' ? `ellipsis-${index}` : pg}
                      variant={pg === pagination.currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => typeof pg === 'number' && pagination.setCurrentPage(pg)}
                      disabled={pg === '...'}
                      className={`${getPaginationButtonClassName(pg, pagination.currentPage)} h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3`}
                    >
                      {pg}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pagination.goToNextPage}
                    disabled={!pagination.hasNextPage}
                    className="border-gray-300 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import LazyImage from "../ui/LazyImage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { 
  Package, 
  MapPin, 
  Phone, 
  Download,
  User,
  ShoppingBag,
  AlertCircle,
  Building,
  CheckCircle,
  Ban,
} from "lucide-react";
import { statusColors, statusIcons } from "@/utils/orderHelpers";


const OrderData = ({
  price,
  address,
  phone,
  city,
  createdAt,
  products,
  paymentMethod = "COD",
  status = "Pending",
  packerName,
  user,
  hideStatus = false,
  hideCOD = false,
  hideDownload = false,
  onCancel,
  cancelPending = false,
  _id,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const orderProducts = Array.isArray(products) ? products : [];

  const statusNorm = String(status ?? "").trim();
  const badgeClass =
    statusColors[statusNorm] ||
    statusColors[statusNorm.charAt(0).toUpperCase() + statusNorm.slice(1).toLowerCase()] ||
    "bg-gray-50 text-gray-700 border-gray-200";
  const canCancel =
    typeof onCancel === "function" &&
    statusNorm.toLowerCase() === "pending";

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Styles - TCS Red Theme
      const primaryColor = [220, 38, 38]; // Red-600 (#DC2626) - Primary brand color
      const primaryDark = [153, 27, 27]; // Red-800 (#991B1B)
      const darkGray = [51, 51, 51];
      const mediumGray = [100, 100, 100];
      const lightGray = [250, 250, 250];
      const borderGray = [220, 220, 220];
      const accentGray = [245, 245, 245];

      // Get shop information (customer who placed the order)
      const customerInfo = user || {};
      const shopName = customerInfo.name || "Shop Name";
      const username = customerInfo.username || "N/A";
      const cityText = city || "N/A";
      const phoneText = phone ? String(phone) : "N/A";
      const addressText = address || "N/A";
      const orderDate = new Date(createdAt);
      const formattedDate = orderDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
      const formattedTime = orderDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const orderId = _id ? _id.slice(-8).toUpperCase() : 'N/A';

      // Start content from top (no header)
      let yPos = 15;

      // Shop Information Section - Professional Card Design
      const infoBoxPadding = 8;
      
      // Calculate required height based on actual content
      const addressLines = doc.splitTextToSize(addressText, contentWidth - 60);
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
      doc.text(phoneText, leftCol + labelWidth, currentY);
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('City:', rightCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(cityText, rightCol + 30, currentY);
      currentY += lineHeight;
      
      // Third line: Address spans full width
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Address:', leftCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(addressLines, leftCol + labelWidth, currentY);
      
      yPos += infoBoxHeight + 10;

      const tableBody = orderProducts.map((product, idx) => [
        idx + 1,
        product?.id?.title || "Unnamed Product",
        product?.quantity || 0,
        product?.id?.price ? `Rs. ${product.id.price}` : "",
        product?.quantity && product?.id?.price
          ? `Rs. ${product.quantity * product.id.price}`
          : ""
      ]);

      const grandTotal = orderProducts.reduce(
        (sum, p) => sum + ((p?.quantity || 0) * (p?.id?.price || 0)),
        0
      );

      tableBody.push([
        {
          content: "Grand Total",
          colSpan: 4,
          styles: { halign: "right", fontStyle: "bold", fillColor: lightGray }
        },
        {
          content: `Rs. ${grandTotal.toLocaleString()}`,
          styles: { halign: "right", fontStyle: "bold", fillColor: lightGray }
        }
      ]);

      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('ORDER ITEMS', margin, yPos - 3);
      yPos += 5;
      
      autoTable(doc, {
        startY: yPos,
        head: [[
          { content: "#", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } },
          { content: "PRODUCT NAME", styles: { fillColor: primaryColor, textColor: 255, fontSize: 10 } },
          { content: "QTY", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } },
          { content: "PRICE", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } },
          { content: "TOTAL", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } }
        ]],
        body: tableBody,
        theme: "striped",
        styles: {
          fontSize: 9.5,
          cellPadding: 4,
          textColor: [0, 0, 0],
          lineColor: borderGray,
          lineWidth: 0.3,
          halign: 'left'
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 90 },
          2: { cellWidth: 18, halign: "center" },
          3: { cellWidth: 28, halign: "right" },
          4: { cellWidth: 32, halign: "right" }
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        bodyStyles: {
          fillColor: [255, 255, 255]
        }
      });

      const finalYAfterTable = doc.lastAutoTable.finalY || yPos + 60;
      yPos = finalYAfterTable + 10;
      
      const summaryHeight = 25;
      doc.setFillColor(...accentGray);
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, contentWidth, summaryHeight, 'FD');
      
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPos, 4, summaryHeight, 'F');
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Total Amount:', margin + 10, yPos);
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      const totalAmount = price || orderProducts.reduce(
        (sum, p) => sum + ((p?.quantity || 0) * (p?.id?.price || 0)),
        0
      );
      doc.text(`Rs. ${totalAmount.toLocaleString()}`, pageWidth - margin - 10, yPos, { align: 'right' });

      // Professional Footer
      const finalY = doc.lastAutoTable.finalY || yPos + 60;
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

      const sanitizedShopName = shopName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      const fileName = `${sanitizedShopName}-Invoice-${orderId}.pdf`;
      doc.save(fileName);
    } catch (error) {
      // Error logging should be handled by error boundary or monitoring service
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const StatusIcon =
    statusIcons[statusNorm] ||
    statusIcons[statusNorm.charAt(0).toUpperCase() + statusNorm.slice(1).toLowerCase()] ||
    AlertCircle;

  return (
    <div className="space-y-4">
      {/* Order Header - Mobile Responsive */}
      <div className="p-4 bg-gray-50 rounded-lg">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-blue-100 p-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              <p className="text-sm text-gray-600">
                {new Date(createdAt).toLocaleDateString()} • {orderProducts.length} products
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!hideStatus && (
              <Badge className={`${badgeClass} border flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {status}
              </Badge>
            )}
            
            {canCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                disabled={cancelPending}
                onClick={() => setCancelDialogOpen(true)}
              >
                <Ban className="h-4 w-4" />
                {cancelPending ? "Cancelling..." : "Cancel order"}
              </Button>
            )}

            {!hideDownload && (
              <Button 
                onClick={handleDownloadInvoice} 
                variant="outline" 
                size="sm"
                className="gap-2"
                disabled={downloading}
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Generating...' : 'Download'}
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-600">
                {new Date(createdAt).toLocaleDateString()} • {orderProducts.length} products
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!hideStatus && (
              <Badge className={`${badgeClass} border flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {status}
              </Badge>
            )}
            
            {canCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                disabled={cancelPending}
                onClick={() => setCancelDialogOpen(true)}
              >
                <Ban className="h-4 w-4" />
                {cancelPending ? "Cancelling..." : "Cancel order"}
              </Button>
            )}

            {!hideDownload && (
              <Button 
                onClick={handleDownloadInvoice} 
                variant="outline" 
                size="sm"
                className="gap-2"
                disabled={downloading}
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Generating...' : 'Download'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="mx-4 sm:mx-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              You can only cancel while the order is still pending. This will notify the store and may restock items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Keep order</AlertDialogCancel>
            <Button
              type="button"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              disabled={cancelPending}
              onClick={async () => {
                if (!_id || !onCancel) return;
                try {
                  await Promise.resolve(onCancel(_id));
                  setCancelDialogOpen(false);
                } catch {
                  /* parent shows toast */
                }
              }}
            >
              {cancelPending ? "Cancelling..." : "Yes, cancel order"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Side - Customer Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
               
                <p className="text-gray-600"><span>Shop Name: </span>{user?.name || "Shop Name"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
              
                <p className="text-gray-600"><span>Contact No: </span>{phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-600"><span>City: </span>{city}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-600"><span>Address: </span>{address}</p>
              </div>
            </div>
            
            

            {packerName && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-900">Packed by</p>
                  <p className="text-emerald-700 font-medium">{packerName}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Side - Products List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Products ({orderProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <LazyImage
                      src={product?.id?.picture?.secure_url}
                      alt={product?.id?.title || "Product image"}
                      className="h-16 w-16 rounded-lg object-cover border"
                      fallback="fallback.jpg"
                      quality={80}
                      loading="eager"
                    />
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                      {product.quantity}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-base leading-relaxed">
                      {product?.id?.title || "Unnamed Product"}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600">
                        Quantity: <span className="font-medium">{product.quantity}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderData;
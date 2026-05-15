import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import LazyImage from "../ui/LazyImage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Package, 
  MapPin, 
  Phone, 
  Download,
  User,
  ShoppingBag,
  AlertCircle,
  Building,
  CheckCircle
} from "lucide-react";
import { statusColors, statusIcons } from "@/storefront/utils/orderHelpers";

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
  _id,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Styles - TCS Red Theme
      const primaryColor = [220, 38, 38]; 
      const darkGray = [51, 51, 51];
      const mediumGray = [100, 100, 100];
      const lightGray = [250, 250, 250];
      const borderGray = [220, 220, 220];
      const accentGray = [245, 245, 245];

      // Get shop information
      const customerInfo = user || {};
      const shopName = customerInfo.name || "Shop Name";
      const username = customerInfo.username || "N/A";
      const cityText = city || "N/A";
      const phoneText = phone ? String(phone) : "N/A";
      const addressText = address || "N/A";
      const orderDate = new Date(createdAt);
      
      const orderId = _id ? _id.slice(-8).toUpperCase() : 'N/A';

      let yPos = 15;

      // Shop Information Section
      const addressLines = doc.splitTextToSize(addressText, contentWidth - 60);
      const addressHeight = addressLines.length > 1 ? (addressLines.length * 6.5) : 6.5;
      const infoBoxHeight = 21 + 13 + addressHeight + 3;
      
      doc.setFillColor(...lightGray);
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, contentWidth, infoBoxHeight, 'FD');
      
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPos, 4, infoBoxHeight, 'F');
      
      let currentY = yPos + 8;
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
      
      // First line
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
      
      // Second line
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
      
      // Third line
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...mediumGray);
      doc.text('Address:', leftCol, currentY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...darkGray);
      doc.text(addressLines, leftCol + labelWidth, currentY);
      
      yPos += infoBoxHeight + 10;

      // Product Table for Customer
      const customerTableBody = (products || []).map((product, idx) => {
        const productObj = product?.product || product?.id || product;
        return [
          idx + 1,
          productObj?.title || "Unnamed Product",
          product?.quantity || 0
        ];
      });

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
          { content: "QUANTITY", styles: { halign: 'center', fillColor: primaryColor, textColor: 255, fontSize: 10 } }
        ]],
        body: customerTableBody,
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
          1: { cellWidth: 140 },
          2: { cellWidth: 35, halign: "center" }
        },
        bodyStyles: { 
          fillColor: [255, 255, 255],
          halign: "left" 
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        }
      });

      // Professional Footer
      const pageHeightVal = doc.internal.pageSize.getHeight();
      const footerY = pageHeightVal - 25;
      
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

      const sanitizedShopName = shopName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      const fileName = `${sanitizedShopName}-Invoice-${orderId}.pdf`;
      doc.save(fileName);
    } catch (error) {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const StatusIcon = statusIcons[status] || AlertCircle;

  return (
    <div className="space-y-4">
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
                {new Date(createdAt).toLocaleDateString()} • {(products || []).length} products
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!hideStatus && (
              <Badge className={`${statusColors[status]} border flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {status}
              </Badge>
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
                {new Date(createdAt).toLocaleDateString()} • {(products || []).length} products
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!hideStatus && (
              <Badge className={`${statusColors[status]} border flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {status}
              </Badge>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                <p className="text-gray-600"><span>Contact No: </span>{phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-600"><span>City: </span>{city || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-600"><span>Address: </span>{address || "N/A"}</p>
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

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Products ({(products || []).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(!products || products.length === 0) ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    No products found in this order
                  </p>
                </div>
              ) : (
                (products || []).map((product, idx) => {
                  const productObj = product?.product || product?.id || product;
                  const productTitle = productObj?.title || productObj?.name || "Unnamed Product";
                  const productImage = productObj?.picture?.secure_url || productObj?.image;
                  const productQuantity = product?.quantity || 0;
                  
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <LazyImage
                          src={productImage}
                          alt={productTitle}
                          className="h-16 w-16 rounded-lg object-cover border"
                          fallback="/logo.jpeg"
                        />
                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                          {productQuantity}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-base leading-relaxed">
                          {productTitle}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            Quantity: <span className="font-medium">{productQuantity}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderData;

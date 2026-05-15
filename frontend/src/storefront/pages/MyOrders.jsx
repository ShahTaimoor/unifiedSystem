import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OneLoader from '@/storefront/components/ui/OneLoader';
import { Alert, AlertDescription, AlertTitle } from '@/storefront/components/ui/alert';
import { Label } from '@/storefront/components/ui/label';
import OrderData from '@/storefront/components/custom/OrderData';
import { fetchOrders } from '@/storefront/redux/slices/order/orderSlice';
import { getPakistaniDate } from '@/storefront/utils/orderHelpers';

const MyOrders = () => {
  const dispatch = useDispatch();

  const { orders, status, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  const today = getPakistaniDate();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);


  const filteredOrders = (!fromDate || !toDate) ? orders : orders.filter(order => {
    const orderDate = new Date(order.createdAt)
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    return orderDate >= fromDate && orderDate <= toDate;
  });

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <OneLoader size="xl" text="Loading Orders..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-16">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">My Orders</h1>

      {/* Date Range Picker */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700 mb-1">
            From Date
          </Label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            max={today} // restrict max date to today in Pakistan timezone
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="toDate" className="text-sm font-medium text-gray-700 mb-1">
            To Date
          </Label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={fromDate} // to date should be after from date
            max={today} // restrict max date to today in Pakistan timezone
          />
        </div>
      </div>

      {status === 'failed' ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Something went wrong fetching your orders.'}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500 text-sm sm:text-base text-center py-8">
              No orders found from {fromDate} to {toDate}.
            </p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <OrderData {...order} user={user} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrders;

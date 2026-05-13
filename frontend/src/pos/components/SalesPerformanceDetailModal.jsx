import React, { useState } from 'react';
import {
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  UserCheck,
  Calendar,
  Star,
  Tag,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Target,
  Award,
  Percent,
  Activity
} from 'lucide-react';
import { useGetReportQuery } from '../store/services/salesPerformanceApi';
import { LoadingSpinner, LoadingCard } from '../components/LoadingSpinner';
import { Button } from '@/pos/components/ui/button';
import BaseModal from './BaseModal';

const SalesPerformanceDetailModal = ({ isOpen, onClose, report, onDelete, onExport }) => {
  const [activeTab, setActiveTab] = useState('overview');


  // Fetch detailed report data
  const { data: detailedReport, isLoading, error } = useGetReportQuery(
    report?.reportId,
    {
      skip: !report?.reportId || !isOpen,
    }
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Top Products', icon: Package },
    { id: 'customers', label: 'Top Customers', icon: Users },
    { id: 'salesreps', label: 'Top Sales Reps', icon: UserCheck },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'insights', label: 'Insights', icon: Target }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'archived':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'generating':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'archived':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'achievement':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'recommendation':
        return <Target className="h-5 w-5 text-purple-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'achievement':
        return 'border-green-200 bg-green-50';
      case 'opportunity':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'recommendation':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isOpen || !report) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={report.reportName}
      subtitle={
        <div className="flex items-center space-x-4 mt-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
            {getStatusIcon(report.status)}
            <span className="ml-1 capitalize">{report.status}</span>
          </span>
          <span className="text-sm text-gray-500">
            Generated {formatDate(report.generatedAt)}
          </span>
          <span className="text-sm text-gray-500">
            Views: {report.viewCount || 0}
          </span>
          {report.isFavorite && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
      }
      maxWidth="full"
      variant="scrollable"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-gray-500 font-mono">
            Report ID: {report.reportId}
          </div>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="border-b border-gray-200/50 px-6 bg-white/30 backdrop-blur-md sticky top-0 z-10">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-all`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500/80" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading report</h3>
              <p className="mt-2 text-sm text-gray-500">{error.message}</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && detailedReport && (
                <div className="space-y-8">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Revenue', value: formatCurrency(detailedReport.summary?.totalRevenue || 0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50/50' },
                      { label: 'Total Orders', value: (detailedReport.summary?.totalOrders || 0).toLocaleString(), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                      { label: 'Avg Order Value', value: formatCurrency(detailedReport.summary?.averageOrderValue || 0), icon: Target, color: 'text-purple-600', bg: 'bg-purple-50/50' },
                      { label: 'Total Customers', value: (detailedReport.summary?.totalCustomers || 0).toLocaleString(), icon: Users, color: 'text-orange-600', bg: 'bg-orange-50/50' }
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} backdrop-blur-sm rounded-xl p-6 border border-white/40 shadow-sm hover:shadow-md transition-all`}>
                        <div className="flex items-center">
                          <stat.icon className={`h-10 w-10 ${stat.color} opacity-80`} />
                          <div className="ml-5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparison */}
                  {detailedReport.comparison && (
                    <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/40 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/20 bg-white/20">
                        <h3 className="text-lg font-bold text-gray-900">Period Comparison</h3>
                      </div>
                      <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                          {[
                            { label: 'Revenue Change', value: detailedReport.comparison.changes.revenueChangePercentage },
                            { label: 'Orders Change', value: detailedReport.comparison.changes.orderChangePercentage },
                            { label: 'AOV Change', value: detailedReport.comparison.changes.aovChangePercentage }
                          ].map((item, i) => (
                            <div key={i} className="text-center group">
                              <p className="text-sm font-medium text-gray-500 mb-3">{item.label}</p>
                              <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-lg font-bold transition-transform group-hover:scale-110 ${
                                item.value >= 0 ? 'text-green-600 bg-green-50/50' : 'text-red-600 bg-red-50/50'
                              }`}>
                                {item.value >= 0 ? <TrendingUp className="h-5 w-5 mr-2" /> : <TrendingDown className="h-5 w-5 mr-2" />}
                                {formatPercentage(item.value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Top Products Tab */}
              {activeTab === 'products' && detailedReport?.topProducts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {detailedReport.topProducts.map((product, index) => (
                    <div key={product.product._id} className="bg-white/40 backdrop-blur-md rounded-xl p-5 border border-white/40 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100/50 rounded-lg flex items-center justify-center font-bold text-blue-600 border border-blue-200/50">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{product.product.name}</h4>
                            <p className="text-xs text-gray-500 font-medium uppercase">{typeof product.product?.category === 'object' ? (product.product?.category?.name ?? 'N/A') : (product.product?.category || 'N/A')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(product.metrics.totalRevenue)}
                          </p>
                          <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${
                            product.trend.revenueChangePercentage >= 0 ? 'text-green-600 bg-green-50/50' : 'text-red-600 bg-red-50/50'
                          }`}>
                            {product.trend.revenueChangePercentage >= 0 ? '+' : ''}{product.trend.revenueChangePercentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/20">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Qty</p>
                          <p className="text-sm font-bold text-gray-900">{product.metrics.totalQuantity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Orders</p>
                          <p className="text-sm font-bold text-gray-900">{product.metrics.totalOrders}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Profit</p>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(product.metrics.profit)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Margin</p>
                          <p className="text-sm font-bold text-gray-900">{product.metrics.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Customers Tab */}
              {activeTab === 'customers' && detailedReport?.topCustomers && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {detailedReport.topCustomers.map((customer, index) => (
                    <div key={customer.customer._id} className="bg-white/40 backdrop-blur-md rounded-xl p-5 border border-white/40 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100/50 rounded-lg flex items-center justify-center font-bold text-green-600 border border-green-200/50">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">{customer.customer.displayName}</h4>
                            <p className="text-xs text-gray-500 font-medium uppercase">
                              {customer.customer.businessType} • {customer.customer.customerTier}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(customer.metrics.totalRevenue)}
                          </p>
                          <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${
                            customer.trend.revenueChangePercentage >= 0 ? 'text-green-600 bg-green-50/50' : 'text-red-600 bg-red-50/50'
                          }`}>
                            {customer.trend.revenueChangePercentage >= 0 ? '+' : ''}{customer.trend.revenueChangePercentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/20">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Orders</p>
                          <p className="text-sm font-bold text-gray-900">{customer.metrics.totalOrders}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">AOV</p>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(customer.metrics.averageOrderValue)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Profit</p>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(customer.metrics.totalProfit)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Margin</p>
                          <p className="text-sm font-bold text-gray-900">{customer.metrics.margin?.toFixed(1) || 0}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && detailedReport?.insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {detailedReport.insights.map((insight, index) => (
                    <div key={index} className={`backdrop-blur-md rounded-xl p-6 border transition-all hover:shadow-lg ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start">
                        <div className="p-2 bg-white/50 rounded-lg border border-white/40 shadow-sm">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-base font-bold text-gray-900">{insight.title}</h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              insight.impact === 'high' ? 'bg-red-500 text-white' :
                              insight.impact === 'medium' ? 'bg-yellow-500 text-white' :
                              'bg-green-500 text-white'
                            }`}>
                              {insight.impact}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                          {insight.actionable && insight.suggestedActions?.length > 0 && (
                            <div className="mt-4 bg-white/30 rounded-lg p-3 border border-white/20">
                              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Recommended Actions:</p>
                              <ul className="space-y-1">
                                {insight.suggestedActions.map((action, ai) => (
                                  <li key={ai} className="text-xs text-gray-600 flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default SalesPerformanceDetailModal;

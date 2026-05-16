import React, { useState } from 'react';
import {
  X,
  BarChart3,
  Calendar,
  Settings,
  Filter,
  Tag,
  FileText,
  TrendingUp,
  Users,
  Package,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useGenerateReportMutation } from '../store/services/salesPerformanceApi';
import { showSuccessToast, showErrorToast, handleApiError } from '../utils/errorHandler';
import { LoadingButton } from '../components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import BaseModal from './BaseModal';

const CreateSalesPerformanceReportModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reportType: 'comprehensive',
    periodType: 'monthly',
    startDate: '',
    endDate: '',
    limit: 10,
    rankBy: 'revenue',
    includeMetrics: {
      revenue: true,
      quantity: true,
      profit: true,
      margin: true,
      orders: true,
      averageOrderValue: true
    },
    filters: {
      orderTypes: [],
      customerTiers: [],
      businessTypes: [],
      productCategories: [],
      salesReps: []
    },
    groupBy: 'product'
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'basic', label: 'Basic Settings', icon: FileText },
    { id: 'period', label: 'Time Period', icon: Calendar },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ];

  const reportTypes = [
    { value: 'top_products', label: 'Top Products', icon: Package, description: 'Analyze best-performing products' },
    { value: 'top_customers', label: 'Top Customers', icon: Users, description: 'Identify high-value customers' },
    { value: 'top_sales_reps', label: 'Top Sales Reps', icon: UserCheck, description: 'Track sales team performance' },
    { value: 'comprehensive', label: 'Comprehensive', icon: BarChart3, description: 'Complete performance overview' }
  ];

  const periodTypes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const orderTypes = [
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'online', label: 'Online' }
  ];

  const customerTiers = [
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
    { value: 'platinum', label: 'Platinum' }
  ];

  const businessTypes = [
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'distributor', label: 'Distributor' }
  ];

  const groupByOptions = [
    { value: 'product', label: 'Product' },
    { value: 'customer', label: 'Customer' },
    { value: 'sales_rep', label: 'Sales Rep' },
    { value: 'category', label: 'Category' },
    { value: 'date', label: 'Date' }
  ];

  // Create report mutation
  const [generateReport, { isLoading: isGenerating }] = useGenerateReportMutation();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNestedInputChange = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const handleArrayChange = (parentField, childField, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: checked
          ? [...prev[parentField][childField], value]
          : prev[parentField][childField].filter(item => item !== value)
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reportType) {
      newErrors.reportType = 'Report type is required';
    }

    if (!formData.periodType) {
      newErrors.periodType = 'Period type is required';
    }

    if (formData.periodType === 'custom') {
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required for custom period';
      }
      if (!formData.endDate) {
        newErrors.endDate = 'End date is required for custom period';
      }
      if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (formData.limit < 1 || formData.limit > 100) {
      newErrors.limit = 'Limit must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const config = {
      ...formData,
      startDate: formData.periodType === 'custom' ? formData.startDate : undefined,
      endDate: formData.periodType === 'custom' ? formData.endDate : undefined
    };

    try {
      const response = await generateReport(config).unwrap();
      showSuccessToast('Report generation started successfully');
      onSuccess(response.data?.report || response.report);
    } catch (error) {
      handleApiError(error, 'Generate Report');
    }
  };

  const handleClose = () => {
    setFormData({
      reportType: 'comprehensive',
      periodType: 'monthly',
      startDate: '',
      endDate: '',
      limit: 10,
      includeMetrics: {
        revenue: true,
        quantity: true,
        profit: true,
        margin: true,
        orders: true,
        averageOrderValue: true
      },
      filters: {
        orderTypes: [],
        customerTiers: [],
        businessTypes: [],
        productCategories: [],
        salesReps: []
      },
      groupBy: 'product',
      rankBy: 'revenue'
    });
    setErrors({});
    setActiveTab('basic');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Sales Performance Report"
      maxWidth="4xl"
      variant="centered"
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Tabs */}
        <div className="border-b border-gray-100 flex-shrink-0">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm flex items-center transition-all`}
              >
                <tab.icon className={`h-4 w-4 mr-2 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
            {/* Basic Settings Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Report Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 ${
                          formData.reportType === type.value
                            ? 'border-primary-500 bg-primary-50/30'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleInputChange('reportType', type.value)}
                      >
                        <div className="flex items-start">
                          <div className={`p-2.5 rounded-xl mr-4 ${
                            formData.reportType === type.value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <type.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold truncate ${
                              formData.reportType === type.value ? 'text-primary-900' : 'text-gray-900'
                            }`}>
                              {type.label}
                            </h4>
                            <p className={`text-xs mt-1.5 leading-relaxed ${
                              formData.reportType === type.value ? 'text-primary-700/70' : 'text-gray-500'
                            }`}>
                              {type.description}
                            </p>
                          </div>
                          {formData.reportType === type.value && (
                            <div className="absolute top-4 right-4">
                              <CheckCircle className="h-5 w-5 text-primary-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.reportType && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" /> {errors.reportType}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Limit Results
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.limit}
                      onChange={(e) => handleInputChange('limit', parseInt(e.target.value))}
                      placeholder="10"
                      className="rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                    />
                    {errors.limit && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" /> {errors.limit}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400 italic">
                      Number of top results (1-100)
                    </p>
                  </div>

                  {formData.reportType === 'top_customers' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Ranking Metric
                      </label>
                      <div className="flex space-x-3">
                        {[
                          { value: 'revenue', label: 'Sales Volume' },
                          { value: 'profit', label: 'Profitability' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange('rankBy', option.value)}
                            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                              formData.rankBy === option.value
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Include Metrics
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    {Object.entries(formData.includeMetrics).map(([key, value]) => (
                      <label key={key} className="flex items-center group cursor-pointer">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          value ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'
                        }`}>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleNestedInputChange('includeMetrics', key, e.target.checked)}
                            className="hidden"
                          />
                          {value && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className={`ml-3 text-sm font-semibold transition-colors ${value ? 'text-gray-900' : 'text-gray-500'}`}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Time Period Tab */}
            {activeTab === 'period' && (
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Period Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {periodTypes.map((period) => (
                      <button
                        key={period.value}
                        type="button"
                        onClick={() => handleInputChange('periodType', period.value)}
                        className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                          formData.periodType === period.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                            : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                  {errors.periodType && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" /> {errors.periodType}
                    </p>
                  )}
                </div>

                {formData.periodType === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-primary-50/30 p-8 rounded-2xl border border-primary-100">
                    <div>
                      <label className="block text-xs font-bold text-primary-700 uppercase tracking-widest mb-2">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="rounded-xl border-primary-200 focus:border-primary-500 focus:ring-primary-500 bg-white"
                      />
                      {errors.startDate && (
                        <p className="mt-2 text-xs text-red-600 font-semibold">{errors.startDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary-700 uppercase tracking-widest mb-2">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className="rounded-xl border-primary-200 focus:border-primary-500 focus:ring-primary-500 bg-white"
                      />
                      {errors.endDate && (
                        <p className="mt-2 text-xs text-red-600 font-semibold">{errors.endDate}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-primary-50 rounded-2xl p-6 flex items-start">
                  <div className="p-2 bg-primary-100 rounded-xl mr-4 text-primary-600">
                    <Info className="h-5 w-5" />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-primary-900">Analysis Scope</p>
                    <p className="mt-1 text-primary-700/80 leading-relaxed">
                      {formData.periodType === 'custom' 
                        ? 'Analyzing data for the custom date range selected above.'
                        : `Generating a ${formData.periodType} analysis based on the current calendar cycle.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Order Types
                    </label>
                    <div className="space-y-3">
                      {orderTypes.map((type) => (
                        <label key={type.value} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.filters.orderTypes.includes(type.value)}
                            onChange={(e) => handleArrayChange('filters', 'orderTypes', type.value, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all"
                          />
                          <span className="ml-3 text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Customer Tiers
                    </label>
                    <div className="space-y-3">
                      {customerTiers.map((tier) => (
                        <label key={tier.value} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.filters.customerTiers.includes(tier.value)}
                            onChange={(e) => handleArrayChange('filters', 'customerTiers', tier.value, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">
                            {tier.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Business Types
                    </label>
                    <div className="space-y-3">
                      {businessTypes.map((type) => (
                        <label key={type.value} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.filters.businessTypes.includes(type.value)}
                            onChange={(e) => handleArrayChange('filters', 'businessTypes', type.value, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                  <Info className="h-3.5 w-3.5 inline mr-1.5" /> Leave options unchecked to include all data for that category.
                </p>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Group Data By
                  </label>
                  <select
                    value={formData.groupBy}
                    onChange={(e) => handleInputChange('groupBy', e.target.value)}
                    className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-primary-500 bg-white font-semibold text-gray-700"
                  >
                    {groupByOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                    This determines the primary structure of your report rows. All metrics will be aggregated according to this selection.
                  </p>
                </div>

                <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center mb-6">
                    <div className="p-2.5 bg-white/10 rounded-xl mr-4">
                      <TrendingUp className="h-6 w-6 text-primary-400" />
                    </div>
                    <h4 className="text-lg font-bold">Generation Summary</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Report Focus</p>
                      <p className="text-sm font-bold">{reportTypes.find(t => t.value === formData.reportType)?.label}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Time Range</p>
                      <p className="text-sm font-bold capitalize">{formData.periodType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Data Density</p>
                      <p className="text-sm font-bold">{formData.limit} Data Points</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Aggregation</p>
                      <p className="text-sm font-bold">{groupByOptions.find(g => g.value === formData.groupBy)?.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-5 flex justify-end space-x-4 border-t border-gray-100 flex-shrink-0">
            <Button
              type="button"
              onClick={handleClose}
              variant="secondary"
              className="px-8 rounded-xl font-bold border-gray-200 text-gray-600"
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              isLoading={isGenerating}
              className="px-10 rounded-xl font-bold bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 active:scale-[0.98] transition-all"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </LoadingButton>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default CreateSalesPerformanceReportModal;

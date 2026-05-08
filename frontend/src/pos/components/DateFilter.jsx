import React, { useState, useEffect } from 'react';
import { Button } from '@/pos/components/ui/button';
import { Input } from '@/pos/components/ui/input';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  formatDateForInput,
  getCurrentDatePakistan,
  getDateDaysAgo,
  getStartOfMonth,
  getEndOfMonth,
  getDatePresets
} from '../utils/dateUtils';
import { Calendar } from '@/pos/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/pos/components/ui/popover';
import { cn } from '@/pos/lib/utils';

/**
 * Reusable Date Filter Component
 * 
 * Provides start and end date pickers with preset options.
 * All dates are handled in Pakistan Standard Time (Asia/Karachi).
 * 
 * @param {Object} props
 * @param {string} props.startDate - Initial start date (YYYY-MM-DD)
 * @param {string} props.endDate - Initial end date (YYYY-MM-DD)
 * @param {Function} props.onDateChange - Callback when dates change (startDate, endDate)
 * @param {boolean} props.showPresets - Show preset date range buttons (default: true)
 * @param {boolean} props.required - Require both dates to be selected (default: false)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.compact - Compact layout for smaller spaces (default: false)
 * @param {boolean} props.showClear - Show clear button (default: true)
 * @param {boolean} props.showLabel - Show the default "Date range" label (default: true)
 */
const DateFilter = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  onDateChange,
  showPresets = true,
  required = false,
  className = '',
  compact = false,
  showClear = true,
  showLabel = true
}) => {
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Update local state when props change
  useEffect(() => {
    if (initialStartDate !== undefined) {
      setStartDate(initialStartDate || '');
    }
  }, [initialStartDate]);

  useEffect(() => {
    if (initialEndDate !== undefined) {
      setEndDate(initialEndDate || '');
    }
  }, [initialEndDate]);

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    // Ensure end date is not before start date
    if (endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
      onDateChange?.(newStartDate, newStartDate);
    } else {
      onDateChange?.(newStartDate, endDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);

    // Ensure start date is not after end date
    if (startDate && newEndDate < startDate) {
      setStartDate(newEndDate);
      onDateChange?.(newEndDate, newEndDate);
    } else {
      onDateChange?.(startDate, newEndDate);
    }
  };

  const handlePresetSelect = (preset) => {
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
    onDateChange?.(preset.startDate, preset.endDate);
    setShowPresetMenu(false);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onDateChange?.('', '');
  };

  const presets = getDatePresets();

  // Convert YYYY-MM-DD strings to Date for calendar (start of day local)
  const dateFrom = startDate ? new Date(startDate + 'T00:00:00') : undefined;
  const dateTo = endDate ? new Date(endDate + 'T00:00:00') : undefined;
  const range = (dateFrom && dateTo) ? { from: dateFrom, to: dateTo } : dateFrom ? { from: dateFrom } : undefined;

  const handleRangeSelect = (selected) => {
    if (!selected?.from) {
      setStartDate('');
      setEndDate('');
      onDateChange?.('', '');
      return;
    }
    const fromStr = formatDateForInput(selected.from);
    setStartDate(fromStr);
    if (selected.to) {
      const toStr = formatDateForInput(selected.to);
      setEndDate(toStr);
      onDateChange?.(fromStr, toStr);
      setPopoverOpen(false);
    } else {
      setEndDate('');
      onDateChange?.(fromStr, '');
    }
  };

  return (
    <div className={compact ? `flex items-center gap-2 min-w-0 ${className}` : `space-y-3 ${className}`}>
      {/* Date Range Picker - Popover + Calendar design */}
      <div className={compact ? 'flex items-center gap-2 flex-1 min-w-0' : 'flex flex-col sm:flex-row items-stretch sm:items-center gap-3'}>
        <div className={compact ? 'flex-1 min-w-0' : 'flex-1 min-w-0'}>
          {!compact && showLabel && (
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date range {required && <span className="text-red-500">*</span>}
            </label>
          )}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-medium border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]',
                  compact ? 'h-9 text-xs px-3' : 'h-11 px-4',
                  !startDate && !endDate && 'text-gray-400'
                )}
              >
                <div className="flex items-center w-full">
                  <CalendarIcon className={cn("mr-2 text-primary-500 shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                  {startDate && endDate && dateFrom && dateTo ? (
                    <span className="truncate flex-1">
                      {format(dateFrom, compact ? 'dd MMM yy' : 'MMM dd, yyyy')} – {format(dateTo, compact ? 'dd MMM yy' : 'MMM dd, yyyy')}
                    </span>
                  ) : startDate && dateFrom ? (
                    <span className="flex-1">{format(dateFrom, compact ? 'dd MMM yy' : 'MMM dd, yyyy')}</span>
                  ) : (
                    <span className="flex-1">Select date range</span>
                  )}
                  <ChevronDown className={cn("ml-2 text-gray-400 shrink-0 transition-transform duration-200", popoverOpen && "rotate-180", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-gray-200 shadow-lg" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateFrom || new Date()}
                selected={range}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>

        {showClear && (startDate || endDate) && (
          <div className={compact ? 'flex-none' : 'flex-1 sm:flex-none'}>
            {!compact && showLabel && (
              <label className="block text-sm font-medium text-gray-700 mb-1.5 opacity-0 pointer-events-none">
                Clear
              </label>
            )}
            <Button
              onClick={handleClear}
              variant="secondary"
              className={cn(
                "border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm",
                compact ? 'h-9 w-9 p-0' : 'w-full sm:w-auto h-11 px-4'
              )}
              type="button"
              title="Clear date range"
            >
              <X className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4 mr-2")} />
              {!compact && <span className="font-medium">Clear</span>}
            </Button>
          </div>
        )}
      </div>

      {/* Preset Buttons - hidden in compact mode */}
      {showPresets && !compact && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetSelect(preset)}
              className="px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-md hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all"
              type="button"
            >
              {preset.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateFilter;

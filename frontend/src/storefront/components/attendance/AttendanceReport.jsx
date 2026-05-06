import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/storefront/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/storefront/components/ui/tabs';
import { Badge } from '@/storefront/components/ui/badge';
import { ScrollArea } from '@/storefront/components/ui/scroll-area';
import { Button } from '@/storefront/components/ui/button';
import { Input } from '@/storefront/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/storefront/components/ui/table';
import { User, Calendar, Clock, AlertCircle, CheckCircle, XCircle, Printer, Search, Filter } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';

const AttendanceReport = () => {
  const [report, setReport] = useState([]);
  const [flatRecords, setFlatRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summaryStats, setSummaryStats] = useState({ present: 0, absent: 0, late: 0 });
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Attendance_Report_${new Date().toLocaleDateString()}`,
  });

  const flattenData = (groupedData) => {
    const flat = [];
    groupedData.forEach(emp => {
      emp.presentRecords.forEach(r => flat.push({ ...r, employeeName: emp.employeeName, status: 'Present' }));
      emp.absentRecords.forEach(r => flat.push({ ...r, employeeName: emp.employeeName, status: 'Absent' }));
      emp.lateRecords.forEach(r => flat.push({ ...r, employeeName: emp.employeeName, status: 'Late' }));
    });
    return flat.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const fetchReport = async () => {
    try {
      const response = await attendanceService.getAttendanceReport();
      if (response.success) {
        setReport(response.data);
        const flat = flattenData(response.data);
        setFlatRecords(flat);
        setFilteredRecords(flat);
      }
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      toast.error('Failed to load detailed report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  useEffect(() => {
    let result = flatRecords;

    // Filter by Search Term
    if (searchTerm.trim() !== '') {
      result = result.filter(record => 
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by Tab
    if (activeTab !== 'all') {
      result = result.filter(record => record.status === activeTab);
    }

    // Filter by Date Range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate <= end;
      });
    }

    setFilteredRecords(result);

    // Calculate Summary Stats for filtered view
    const stats = result.reduce((acc, curr) => {
      if (curr.status === 'Present') acc.present++;
      else if (curr.status === 'Absent') acc.absent++;
      else if (curr.status === 'Late') acc.late++;
      return acc;
    }, { present: 0, absent: 0, late: 0 });
    setSummaryStats(stats);

  }, [searchTerm, activeTab, flatRecords, startDate, endDate]);

  if (loading) {
    return <div className="text-center py-8">Loading report...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-2 xl:mb-0">
          <Calendar className="text-blue-500" size={20} />
          Detailed Attendance History
        </h2>
        
        <div className="flex flex-col md:flex-row items-end gap-2 w-full xl:w-auto">
          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">From</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-full md:w-36"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">To</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-full md:w-36"
              />
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 w-full md:w-auto h-9">
            <Printer size={16} /> Print
          </Button>
        </div>
      </div>
      
      <div ref={componentRef} className="print:p-8">
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-center">Attendance Report</h1>
          <p className="text-center text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
          {(startDate || endDate) && (
            <p className="text-center text-sm mt-1">
              Range: {startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - {endDate ? new Date(endDate).toLocaleDateString() : 'End'}
            </p>
          )}
        </div>

        {/* Summary Stats Card (Visible only when filtering) */}
        {(searchTerm || startDate || endDate) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Summary for Selection:</span>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
              Present: {summaryStats.present}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1">
              Absent: {summaryStats.absent}
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1">
              Late: {summaryStats.late}
            </Badge>
          </div>
        )}

        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <div className="print:hidden mb-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All History</TabsTrigger>
              <TabsTrigger value="Present" className="text-green-600 data-[state=active]:text-green-700">Present</TabsTrigger>
              <TabsTrigger value="Absent" className="text-red-600 data-[state=active]:text-red-700">Absent</TabsTrigger>
              <TabsTrigger value="Late" className="text-orange-600 data-[state=active]:text-orange-700">Late</TabsTrigger>
            </TabsList>
          </div>

          <div className="border rounded-md overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[200px]">Employee Name</TableHead>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead className="w-[120px]">Time</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.time || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${record.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${record.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                            ${record.status === 'Late' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                          `}
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{record.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No records found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AttendanceReport;

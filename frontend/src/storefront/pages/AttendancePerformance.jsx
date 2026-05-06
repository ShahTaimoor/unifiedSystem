import React, { useState, useEffect } from 'react';
import TopAttendance from '../components/attendance/TopAttendance';
import AttendanceReport from '../components/attendance/AttendanceReport';
import attendanceService from '../services/attendanceService';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/storefront/components/ui/card';
import { Trophy, Award, TrendingUp } from 'lucide-react';

const AttendancePerformance = () => {
  const [topEmployees, setTopEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTopPerforming = async () => {
    try {
      const response = await attendanceService.getTopPerforming();
      if (response.success) {
        setTopEmployees(response.data);
      }
    } catch (error) {
      console.error('Error fetching top performing employees:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopPerforming();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Trophy className="text-yellow-500" size={32} />
          Attendance Performance
        </h1>
        <p className="text-gray-500 mt-2">View top performing employees based on attendance records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <Award size={18} /> Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {topEmployees.length > 0 ? topEmployees[0].employeeName : '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Highest attendance rate
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <TrendingUp size={18} /> Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {topEmployees.length > 0 
                ? Math.round(topEmployees.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / topEmployees.length) + '%' 
                : '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across top 10 employees
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <TopAttendance topEmployees={topEmployees} vertical={false} onReset={fetchTopPerforming} />
      </div>

      <AttendanceReport />
    </div>
  );
};

export default AttendancePerformance;

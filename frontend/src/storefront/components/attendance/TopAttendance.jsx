import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/storefront/components/ui/card';
import { Badge } from '@/storefront/components/ui/badge';
import { Button } from '@/storefront/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/storefront/components/ui/table';
import { Trophy, UserCheck, Percent, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import attendanceService from '../../services/attendanceService';

const TopAttendance = ({ topEmployees, vertical = false, onReset }) => {
  const { user } = useSelector((state) => state.auth);

  if (!topEmployees || topEmployees.length === 0) {
    return null;
  }

  const handleReset = async (employeeName) => {
    if (window.confirm(`Are you sure you want to reset all attendance records for ${employeeName}? This cannot be undone.`)) {
      try {
        await attendanceService.resetAttendance(employeeName);
        toast.success(`Attendance reset for ${employeeName}`);
        if (onReset) onReset();
      } catch (error) {
        console.error('Error resetting attendance:', error);
        toast.error('Failed to reset attendance');
      }
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="text-yellow-500" size={20} />
        Top Performers
      </h2>
      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead className="text-center">Present Days</TableHead>
              <TableHead className="text-center">Score</TableHead>
              {user?.role === 2 && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {topEmployees.map((employee, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                <TableCell className="font-semibold">{employee.employeeName}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <UserCheck size={14} className="text-green-600" />
                    <span>{employee.presentCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={employee.attendancePercentage >= 90 ? "default" : "secondary"} 
                    className={`${employee.attendancePercentage >= 90 ? "bg-green-600 hover:bg-green-700" : ""}`}
                  >
                    {Math.round(employee.attendancePercentage)}%
                  </Badge>
                </TableCell>
                {user?.role === 2 && (
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleReset(employee.employeeName)}
                      title="Reset Attendance Stats"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TopAttendance;

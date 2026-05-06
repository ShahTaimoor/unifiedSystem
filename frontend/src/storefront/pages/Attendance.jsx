import React, { useState, useEffect } from 'react';
import AttendanceTable from '../components/attendance/AttendanceTable';
import EmployeeManager from '../components/attendance/EmployeeManager';
import attendanceService from '../services/attendanceService';
import { toast } from 'sonner';

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSaveSuccess = () => {
    // Refresh if needed
  };

  const handleEmployeesChange = (newEmployees) => {
    setEmployees(newEmployees);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employee Attendance Management</h1>
        <p className="text-gray-500 mt-2">Manage daily attendance and track employee performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <EmployeeManager onEmployeesChange={handleEmployeesChange} />
        </div>
        <div className="lg:col-span-2">
          <AttendanceTable onSaveSuccess={handleSaveSuccess} employees={employees} />
        </div>
      </div>
    </div>
  );
};

export default Attendance;

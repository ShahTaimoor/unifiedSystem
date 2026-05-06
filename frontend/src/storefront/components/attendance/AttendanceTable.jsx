import React, { useState, useEffect } from 'react';
import { Button } from '@/storefront/components/ui/button';
import { Input } from '@/storefront/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/storefront/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/storefront/components/ui/table';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import attendanceService from '../../services/attendanceService';

const AttendanceTable = ({ onSaveSuccess, employees = [] }) => {
  const [rows, setRows] = useState([
    { employeeName: '', date: new Date().toISOString().split('T')[0], time: '09:00', status: 'Present', notes: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const addRow = () => {
    setRows([
      ...rows,
      { employeeName: '', date: today, time: '09:00', status: 'Present', notes: '' }
    ]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      const newRows = [...rows];
      newRows.splice(index, 1);
      setRows(newRows);
    }
  };

  const handleInputChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleSubmit = async () => {
    // Validation
    const isValid = rows.every(row => row.employeeName && row.date && row.time && row.status);
    if (!isValid) {
      toast.error('Please fill in all required fields (Name, Date, Time, Status)');
      return;
    }

    setLoading(true);
    try {
      await attendanceService.addAttendance(rows);
      toast.success('Attendance records saved successfully');
      setRows([{ employeeName: '', date: new Date().toISOString().split('T')[0], time: '09:00', status: 'Present', notes: '' }]);
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Attendance Entry</h3>
        <div className="flex gap-2">
          <Button onClick={addRow} variant="outline" className="flex items-center gap-2">
            <Plus size={16} /> Add Row
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
            <Save size={16} /> {loading ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[250px]">Employee Name</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead className="w-[120px]">Time</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  {employees.length > 0 ? (
                    <Select
                      value={row.employeeName}
                      onValueChange={(value) => handleInputChange(index, 'employeeName', value)}
                    >
                      <SelectTrigger className="border-transparent hover:border-gray-300 focus:border-primary">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp._id} value={emp.name}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="John Doe"
                      value={row.employeeName}
                      onChange={(e) => handleInputChange(index, 'employeeName', e.target.value)}
                      className="border-transparent hover:border-gray-300 focus:border-primary"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={row.date}
                    max={today}
                    min={today}
                    onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                    className="border-transparent hover:border-gray-300 focus:border-primary"
                    readOnly
                    title="Attendance can only be marked for today"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={row.time}
                    onChange={(e) => handleInputChange(index, 'time', e.target.value)}
                    className="border-transparent hover:border-gray-300 focus:border-primary"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={row.status}
                    onValueChange={(value) => handleInputChange(index, 'status', value)}
                  >
                    <SelectTrigger className="border-transparent hover:border-gray-300 focus:border-primary">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                      <SelectItem value="Late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Optional notes..."
                    value={row.notes}
                    onChange={(e) => handleInputChange(index, 'notes', e.target.value)}
                    className="border-transparent hover:border-gray-300 focus:border-primary"
                  />
                </TableCell>
                <TableCell>
                  {rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendanceTable;

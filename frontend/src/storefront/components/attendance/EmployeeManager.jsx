import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/storefront/components/ui/button';
import { Input } from '@/storefront/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/storefront/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/storefront/components/ui/table';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import employeeService from '../../services/employeeService';

const EmployeeManager = ({ onEmployeesChange }) => {
  const { user } = useSelector((state) => state.auth);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: ''
  });

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.success) {
        setEmployees(response.data);
        if (onEmployeesChange) onEmployeesChange(response.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEmployee.name) {
      toast.error('Employee name is required');
      return;
    }

    setLoading(true);
    try {
      await employeeService.addEmployee(newEmployee);
      toast.success('Employee added successfully');
      setNewEmployee({ name: '', position: '', department: '', email: '', phone: '' });
      setOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error.response?.data?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this employee?')) {
      try {
        await employeeService.deleteEmployee(id);
        toast.success('Employee removed successfully');
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to remove employee');
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users size={20} />
          Manage Employees
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <UserPlus size={16} /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  name="name"
                  value={newEmployee.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Input
                  name="position"
                  value={newEmployee.position}
                  onChange={handleInputChange}
                  placeholder="e.g. Sales Manager"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input
                  name="department"
                  value={newEmployee.department}
                  onChange={handleInputChange}
                  placeholder="e.g. Sales"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    name="phone"
                    value={newEmployee.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {employees.length > 0 && (
        <div className="border rounded-md overflow-hidden bg-white shadow-sm max-h-[300px] overflow-y-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 sticky top-0">
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                {user?.role === 2 && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.position || '-'}</TableCell>
                  <TableCell>{employee.department || '-'}</TableCell>
                  {user?.role === 2 && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(employee._id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
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
      )}
    </div>
  );
};

export default EmployeeManager;

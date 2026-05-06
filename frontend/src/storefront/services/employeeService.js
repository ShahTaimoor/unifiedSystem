import axiosInstance from '../redux/slices/auth/axiosInstance';

const employeeService = {
  addEmployee: async (employeeData) => {
    const response = await axiosInstance.post('/employees/add', employeeData);
    return response.data;
  },

  getEmployees: async () => {
    const response = await axiosInstance.get('/employees');
    return response.data;
  },

  deleteEmployee: async (id) => {
    const response = await axiosInstance.delete(`/employees/${id}`);
    return response.data;
  }
};

export default employeeService;

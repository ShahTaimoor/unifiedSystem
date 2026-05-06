import axiosInstance from '../redux/slices/auth/axiosInstance';

const attendanceService = {
  addAttendance: async (records) => {
    const response = await axiosInstance.post('/attendance/add', records);
    return response.data;
  },

  getTopPerforming: async () => {
    const response = await axiosInstance.get('/attendance/top-performing');
    return response.data;
  },

  getAttendance: async () => {
    const response = await axiosInstance.get('/attendance');
    return response.data;
  },

  resetAttendance: async (employeeName) => {
    const response = await axiosInstance.delete(`/attendance/reset/${encodeURIComponent(employeeName)}`);
    return response.data;
  },

  getAttendanceReport: async () => {
    const response = await axiosInstance.get('/attendance/report');
    return response.data;
  }
};

export default attendanceService;

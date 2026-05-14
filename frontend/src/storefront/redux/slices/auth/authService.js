// src/features/auth/authService.js
import axiosInstance from "./axiosInstance";

const loginUser = async (userData) => {
  const response = await axiosInstance.post("/login", userData, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const updateProfile = async (data) => {
  const response = await axiosInstance.put("/auth/profile", data, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data.user;
};

const updateUserRole = async (userId, role) => {
  const response = await axiosInstance.put(
    `/update-user-role/${userId}`,
    { role },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return response.data;
};

const changePassword = async (passwordData) => {
  const response = await axiosInstance.put("/change-password", passwordData, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const updateUsername = async (usernameData) => {
  const response = await axiosInstance.put("/update-username", usernameData, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const signupOrLogin = async (userData) => {
  const response = await axiosInstance.post("/auth/signup-or-login", userData, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const adminLogin = async (userData) => {
  const response = await axiosInstance.post("/admin/login", userData, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const getCurrentUser = async () => {
  const response = await axiosInstance.get("/verify-token");
  return response.data;
};

const authService = {
  loginUser,
  updateProfile,
  updateUserRole,
  changePassword,
  updateUsername,
  signupOrLogin,
  adminLogin,
  getCurrentUser,
};
export default authService;

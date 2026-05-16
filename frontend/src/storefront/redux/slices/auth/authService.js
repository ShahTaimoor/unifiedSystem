// src/features/auth/authService.js
import axiosInstance from "./axiosInstance";

const loginUser = async (userData) => {
  const response = await axiosInstance.post("/auth/customer/login", userData, {
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
  const response = await axiosInstance.post("/auth/customer/login", userData, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const getCurrentUser = async () => {
  const response = await axiosInstance.get("/auth/me", {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

const authService = {
  loginUser,
  updateProfile,
  changePassword,
  updateUsername,
  signupOrLogin,
  getCurrentUser,
};
export default authService;

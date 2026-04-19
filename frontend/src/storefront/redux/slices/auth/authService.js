// Auth calls against POS backend: /api/auth/*
import axiosInstance from './axiosInstance';

function withDisplayName(user) {
  if (!user) return user;
  const name =
    user.name ||
    user.businessName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email ||
    '';
  return {
    ...user,
    name,
    username: user.username ?? user.firstName ?? '',
  };
}

const loginUser = async (userData) => {
  const response = await axiosInstance.post('/auth/login', userData, {
    headers: { 'Content-Type': 'application/json' },
  });
  const d = response.data;
  if (d?.user) d.user = withDisplayName(d.user);
  return d;
};

const updateProfile = async (data) => {
  const response = await axiosInstance.put('/auth/profile', data, {
    headers: { 'Content-Type': 'application/json' },
  });
  const u = response.data?.user ?? response.data;
  return withDisplayName(u);
};

const changePassword = async (passwordData) => {
  const response = await axiosInstance.post('/auth/change-password', passwordData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

const updateUsername = async (usernameData) => {
  const response = await axiosInstance.put('/auth/profile', usernameData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

/** Ecommerce login only — `store_token` cookie (no self-registration). */
const storefrontLogin = async (userData) => {
  const { phone, password, shopName } = userData;
  const loginId = String(phone || shopName || '').trim();
  const response = await axiosInstance.post(
    '/storefront/login',
    {
      email: loginId,
      password,
      phone: loginId,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const d = response.data;
  if (d?.user) d.user = withDisplayName(d.user);
  return d;
};

const getCurrentUser = async () => {
  const response = await axiosInstance.get('/storefront/me', {
    withCredentials: true,
  });
  const d = response.data;
  if (d?.user) d.user = withDisplayName(d.user);
  return d;
};

const logout = async () => {
  await axiosInstance.post('/storefront/logout', null, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
};

const authService = {
  loginUser,
  updateProfile,
  changePassword,
  updateUsername,
  storefrontLogin,
  getCurrentUser,
  logout,
};
export default authService;

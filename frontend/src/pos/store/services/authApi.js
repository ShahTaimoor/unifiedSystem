import { api } from '../api';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ phone, password }) => ({
        url: 'auth/pos/login', // Use specialized POS login endpoint
        method: 'post',
        data: { phone, password },
      }),
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
    }),
    requestTwoFactorCode: builder.mutation({
      query: ({ channel = 'email', email, phone }) => ({
        url: 'auth/request-2fa-code',
        method: 'post',
        data: { channel, email, phone },
      }),
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
    }),
    verifyTwoFactor: builder.mutation({
      query: ({ tempToken, code }) => ({
        url: 'auth/verify-2fa',
        method: 'post',
        data: { tempToken, code },
      }),
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
    }),
    currentUser: builder.query({
      query: () => ({ url: 'auth/pos/me', method: 'get' }),
      providesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: 'auth/profile',
        method: 'put',
        data,
      }),
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
    }),
    changePassword: builder.mutation({
      query: ({ currentPassword, newPassword }) => ({
        url: 'auth/change-password',
        method: 'post',
        data: { currentPassword, newPassword },
      }),
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: 'auth/pos/refresh',
        method: 'post',
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: 'auth/logout',
        method: 'post',
      }),
      invalidatesTags: [{ type: 'Auth', id: 'CURRENT_USER' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRequestTwoFactorCodeMutation,
  useVerifyTwoFactorMutation,
  useCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;


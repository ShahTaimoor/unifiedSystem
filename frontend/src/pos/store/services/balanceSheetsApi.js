import { api } from '../api';

export const balanceSheetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLatestBalanceSheet: builder.query({
      query: (params) => {
        const { asOfDate } = params || {};
        return {
          url: 'balance-sheets/latest',
          method: 'get',
          params: asOfDate != null && asOfDate !== '' ? { asOfDate } : {},
        };
      },
      // Always treat refetch as new data so the statement re-renders after ledger changes
      structuralSharing: false,
      providesTags: [{ type: 'Reports', id: 'BALANCE_SHEETS_LATEST' }],
    }),
    getBalanceSheets: builder.query({
      query: (params) => ({
        url: 'balance-sheets',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Reports', id: 'BALANCE_SHEETS_LIST' }],
    }),
    getBalanceSheetStats: builder.query({
      query: (params) => ({
        url: 'balance-sheets/stats',
        method: 'get',
        params,
      }),
      providesTags: [{ type: 'Reports', id: 'BALANCE_SHEETS_STATS' }],
    }),
    getBalanceSheet: builder.query({
      query: (id) => `balance-sheets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Reports', id }],
    }),
    getComparison: builder.query({
      query: (params) => {
        const { id, type } = params || {};
        return {
          url: `balance-sheets/${id}/comparison`,
          method: 'GET',
          params: type ? { type } : {},
        };
      },
      providesTags: (result, error, { id }) => [{ type: 'Reports', id: `COMPARISON_${id}` }],
    }),
    generateBalanceSheet: builder.mutation({
      query: (data) => ({
        url: 'balance-sheets/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Reports', id: 'BALANCE_SHEETS_LATEST' }, { type: 'Reports', id: 'BALANCE_SHEETS_LIST' }, { type: 'Reports', id: 'BALANCE_SHEETS_STATS' }],
    }),
    deleteBalanceSheet: builder.mutation({
      query: (id) => ({
        url: `balance-sheets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Reports', id: 'BALANCE_SHEETS_LIST' }, { type: 'Reports', id: 'BALANCE_SHEETS_STATS' }],
    }),
    updateBalanceSheetStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `balance-sheets/${id}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reports', id },
        { type: 'Reports', id: 'BALANCE_SHEETS_LIST' },
        { type: 'Reports', id: 'BALANCE_SHEETS_STATS' }
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLatestBalanceSheetQuery,
  useGetBalanceSheetsQuery,
  useGetBalanceSheetStatsQuery,
  useGetBalanceSheetQuery,
  useGetComparisonQuery,
  useGenerateBalanceSheetMutation,
  useDeleteBalanceSheetMutation,
  useUpdateBalanceSheetStatusMutation
} = balanceSheetsApi;

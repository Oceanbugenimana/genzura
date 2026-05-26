import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export const useDashboardStats = (params = {}) =>
  useQuery({
    queryKey: ['dashboard', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard', { params });
      return data.data;
    },
    refetchInterval: 60000, // refresh every minute
  });

export const useStockMovement = (params = {}) =>
  useQuery({
    queryKey: ['stock-movement', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/stock-movement', { params });
      return data.data;
    },
  });

export const useLowStockReport = (params = {}) =>
  useQuery({
    queryKey: ['low-stock-report', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/low-stock', { params });
      return data.data;
    },
  });

export const useTopProducts = (params = {}) =>
  useQuery({
    queryKey: ['top-products', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/top-products', { params });
      return data.data;
    },
  });

export const useDeadStock = (params = {}) =>
  useQuery({
    queryKey: ['dead-stock', params],
    queryFn: async () => {
      const { data } = await api.get('/reports/dead-stock', { params });
      return data.data;
    },
  });

export const useStoreAnalytics = () =>
  useQuery({
    queryKey: ['store-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/reports/store-analytics');
      return data.data;
    },
  });

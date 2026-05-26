import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export const useInventorySummary = (params = {}) =>
  useQuery({
    queryKey: ['inventory-summary', params],
    queryFn: async () => {
      const { data } = await api.get('/inventory/summary', { params });
      return data.data;
    },
  });

export const useTransactions = (params = {}) =>
  useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const { data } = await api.get('/inventory/transactions', { params });
      return data;
    },
  });

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/inventory/transaction', payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['inventory-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      const label = variables.type === 'IN' ? 'Stock In' : variables.type === 'OUT' ? 'Stock Out' : 'Adjustment';
      toast.success(`${label} recorded successfully`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Transaction failed'),
  });
};

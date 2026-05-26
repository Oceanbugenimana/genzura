import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export const useNotifications = (params = {}) =>
  useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params });
      return data;
    },
  });

export const useNotificationStats = () =>
  useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/stats');
      return data.data;
    },
  });

export const useRetryNotifications = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/retry'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Retry job triggered');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Retry failed'),
  });
};

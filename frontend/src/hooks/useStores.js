import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export const useStores = (params = {}) =>
  useQuery({
    queryKey: ['stores', params],
    queryFn: async () => {
      const { data } = await api.get('/stores', { params });
      return data;
    },
  });

export const useStore = (id) =>
  useQuery({
    queryKey: ['stores', id],
    queryFn: async () => {
      const { data } = await api.get(`/stores/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

export const useCreateStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/stores', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create store'),
  });
};

export const useUpdateStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/stores/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update store'),
  });
};

export const useDeleteStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/stores/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete store'),
  });
};

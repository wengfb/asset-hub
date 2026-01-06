import axios from 'axios';
import { Asset, Tag, Collection, SearchResult, PaginatedResponse, AssetStats } from '@/types/asset';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
});

// Assets API
export const assetsApi = {
  list: (params?: { page?: number; page_size?: number; type?: string }) =>
    api.get<PaginatedResponse<Asset>>('/assets', { params }),

  get: (id: string) => api.get<Asset>(`/assets/${id}`),

  upload: (file: File, name?: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    return api.post<Asset>('/assets', formData);
  },

  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<Asset>(`/assets/${id}`, data),

  delete: (id: string) => api.delete(`/assets/${id}`),

  getStats: () => api.get<AssetStats>('/assets/stats'),
};

// Search API
export const searchApi = {
  text: (query: string, limit?: number) =>
    api.post<SearchResult[]>('/search/text', { query, limit }),

  image: (file: File, limit?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (limit) formData.append('limit', limit.toString());
    return api.post<SearchResult[]>('/search/image', formData);
  },
};

// Tags API
export const tagsApi = {
  list: () => api.get<Tag[]>('/tags'),
  create: (data: { name: string; color?: string }) => api.post<Tag>('/tags', data),
  update: (id: string, data: { name?: string; color?: string }) =>
    api.put<Tag>(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
  batchAssign: (tagId: string, assetIds: string[]) =>
    api.post('/tags/batch-assign', { tag_id: tagId, asset_ids: assetIds }),
};

// Collections API
export const collectionsApi = {
  list: () => api.get<Collection[]>('/collections'),
  get: (id: string) => api.get<Collection>(`/collections/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<Collection>('/collections', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<Collection>(`/collections/${id}`, data),
  delete: (id: string) => api.delete(`/collections/${id}`),
  addAssets: (id: string, assetIds: string[]) =>
    api.post(`/collections/${id}/assets`, { asset_ids: assetIds }),
  removeAssets: (id: string, assetIds: string[]) =>
    api.delete(`/collections/${id}/assets`, { data: { asset_ids: assetIds } }),
  getAssets: (id: string, params?: { page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<Asset>>(`/collections/${id}/assets`, { params }),
};

// History API
export const historyApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    api.get('/history', { params }),
  recent: (limit?: number) => api.get('/history/recent', { params: { limit } }),
  record: (assetId: string, actionType: string) =>
    api.post('/history', { asset_id: assetId, action_type: actionType }),
};

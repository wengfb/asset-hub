export interface Asset {
  id: string;
  name: string;
  description?: string;
  type: 'image' | 'video' | 'audio';
  file_path: string;
  file_size: number;
  mime_type: string;
  metadata: Record<string, unknown>;
  thumbnail_url?: string;
  file_url?: string;
  vector_status: string;
  view_count: number;
  use_count: number;
  created_at: string;
  updated_at?: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  asset_count: number;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  type: string;
  parent_id?: string;
  cover_asset_id?: string;
  asset_count: number;
  created_at: string;
}

export interface SearchResult {
  asset: Asset;
  score: number;
  match_type: string;
  frame_index?: number;
  timestamp_ms?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AssetStats {
  total: number;
  images: number;
  videos: number;
  audios: number;
}

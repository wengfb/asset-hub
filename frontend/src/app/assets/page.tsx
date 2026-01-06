'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Image, Video, Music, Filter, Grid, List } from 'lucide-react';
import { assetsApi } from '@/lib/api';
import { Asset, PaginatedResponse } from '@/types/asset';

type ViewMode = 'grid' | 'list';
type AssetType = 'all' | 'image' | 'video' | 'audio';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [typeFilter, setTypeFilter] = useState<AssetType>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAssets();
  }, [page, typeFilter]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const params: { page: number; page_size: number; type?: string } = {
        page,
        page_size: 20,
      };
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await assetsApi.list(params);
      setAssets(res.data.items);
      setTotalPages(res.data.total_pages);
    } catch {
      console.error('加载素材失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">素材库</h1>
        <div className="flex items-center gap-3">
          <TypeFilter value={typeFilter} onChange={setTypeFilter} />
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {loading ? (
        <LoadingGrid />
      ) : assets.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <AssetGrid assets={assets} />
      ) : (
        <AssetList assets={assets} />
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  );
}

function TypeFilter({ value, onChange }: { value: AssetType; onChange: (v: AssetType) => void }) {
  const types: { value: AssetType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'image', label: '图片' },
    { value: 'video', label: '视频' },
    { value: 'audio', label: '音频' },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {types.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            value === t.value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded-md ${value === 'grid' ? 'bg-white shadow-sm' : ''}`}
      >
        <Grid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-1.5 rounded-md ${value === 'list' ? 'bg-white shadow-sm' : ''}`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

function AssetGrid({ assets }: { assets: Asset[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  const TypeIcon = asset.type === 'image' ? Image : asset.type === 'video' ? Video : Music;

  return (
    <Link href={`/assets/${asset.id}`} className="group block">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100 relative">
          {asset.thumbnail_url ? (
            <img src={asset.thumbnail_url} alt={asset.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
            {asset.type === 'image' ? '图片' : asset.type === 'video' ? '视频' : '音频'}
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-gray-800 truncate">{asset.name}</p>
          <p className="text-xs text-gray-500 mt-1">{formatFileSize(asset.file_size)}</p>
        </div>
      </div>
    </Link>
  );
}

function AssetList({ assets }: { assets: Asset[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y">
      {assets.map((asset) => (
        <AssetRow key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  const TypeIcon = asset.type === 'image' ? Image : asset.type === 'video' ? Video : Music;

  return (
    <Link href={`/assets/${asset.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50">
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
        {asset.thumbnail_url ? (
          <img src={asset.thumbnail_url} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <TypeIcon className="w-8 h-8 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{asset.name}</p>
        <p className="text-sm text-gray-500">{formatFileSize(asset.file_size)}</p>
      </div>
      <div className="text-sm text-gray-500">{new Date(asset.created_at).toLocaleDateString()}</div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 mb-4">暂无素材</p>
      <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        上传素材
      </Link>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
      >
        上一页
      </button>
      <span className="text-sm text-gray-600">{page} / {totalPages}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
      >
        下一页
      </button>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Image, Video, Music } from 'lucide-react';
import { collectionsApi } from '@/lib/api';
import { Collection, Asset } from '@/types/asset';

export default function CollectionDetailPage() {
  const params = useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadData(params.id as string);
    }
  }, [params.id]);

  const loadData = async (id: string) => {
    try {
      const [colRes, assetsRes] = await Promise.all([
        collectionsApi.get(id),
        collectionsApi.getAssets(id),
      ]);
      setCollection(colRes.data);
      setAssets(assetsRes.data.items);
    } catch {
      console.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!collection) return <NotFound />;

  return (
    <div className="p-6">
      <Header collection={collection} />
      {assets.length === 0 ? <EmptyState /> : <AssetGrid assets={assets} />}
    </div>
  );
}

function Header({ collection }: { collection: Collection }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link href="/collections" className="p-2 hover:bg-gray-100 rounded-lg">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div>
        <h1 className="text-xl font-bold text-gray-800">{collection.name}</h1>
        <p className="text-sm text-gray-500">{collection.asset_count} 个素材</p>
      </div>
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
    <Link href={`/assets/${asset.id}`} className="block">
      <div className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100 flex items-center justify-center">
          {asset.thumbnail_url ? (
            <img src={asset.thumbnail_url} alt={asset.name} className="w-full h-full object-cover" />
          ) : (
            <TypeIcon className="w-12 h-12 text-gray-300" />
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-gray-800 truncate">{asset.name}</p>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg aspect-square" />
        ))}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="p-6 text-center py-20">
      <p className="text-gray-500 mb-4">收藏夹不存在</p>
      <Link href="/collections" className="text-blue-600 hover:underline">返回收藏夹列表</Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">该收藏夹暂无素材</p>
    </div>
  );
}

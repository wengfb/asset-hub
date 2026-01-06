'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Image, Video, Music } from 'lucide-react';
import { historyApi } from '@/lib/api';
import { Asset } from '@/types/asset';

interface HistoryItem {
  id: string;
  asset_id: string;
  action_type: string;
  created_at: string;
  asset?: Asset;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await historyApi.list({ page_size: 50 });
      setHistory(res.data.items || []);
    } catch {
      console.error('加载历史失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">使用历史</h1>

      {loading ? (
        <LoadingState />
      ) : history.length === 0 ? (
        <EmptyState />
      ) : (
        <HistoryList items={history} />
      )}
    </div>
  );
}

function HistoryList({ items }: { items: HistoryItem[] }) {
  return (
    <div className="bg-white rounded-lg border divide-y">
      {items.map((item) => (
        <HistoryRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const asset = item.asset;
  const TypeIcon = asset?.type === 'video' ? Video : asset?.type === 'audio' ? Music : Image;

  const actionLabels: Record<string, string> = {
    view: '查看',
    download: '下载',
    copy: '复制',
  };

  return (
    <Link href={`/assets/${item.asset_id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50">
      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
        {asset?.thumbnail_url ? (
          <img src={asset.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <TypeIcon className="w-6 h-6 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{asset?.name || '未知素材'}</p>
        <p className="text-sm text-gray-500">{actionLabels[item.action_type] || item.action_type}</p>
      </div>
      <div className="text-sm text-gray-400">{formatTime(item.created_at)}</div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="bg-white rounded-lg border divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">暂无使用记录</p>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString();
}

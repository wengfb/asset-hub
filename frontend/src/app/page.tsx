'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Image, Video, Music, Upload, Search, TrendingUp } from 'lucide-react';
import { assetsApi } from '@/lib/api';
import { AssetStats } from '@/types/asset';

export default function Home() {
  const [stats, setStats] = useState<AssetStats>({ total: 0, images: 0, videos: 0, audios: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assetsApi.getStats()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">欢迎使用 Asset Hub</h1>
        <p className="text-gray-500 mt-1">AI驱动的智能素材管理系统</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="总素材" value={stats.total} color="gray" loading={loading} />
        <StatCard icon={Image} label="图片" value={stats.images} color="blue" loading={loading} />
        <StatCard icon={Video} label="视频" value={stats.videos} color="green" loading={loading} />
        <StatCard icon={Music} label="音频" value={stats.audios} color="purple" loading={loading} />
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/upload" className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
          <Upload className="w-10 h-10 text-blue-500 mb-3" />
          <h3 className="font-semibold text-gray-800">上传素材</h3>
          <p className="text-sm text-gray-500 mt-1">支持图片、视频、音频批量上传</p>
        </Link>
        <Link href="/search" className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
          <Search className="w-10 h-10 text-green-500 mb-3" />
          <h3 className="font-semibold text-gray-800">智能搜索</h3>
          <p className="text-sm text-gray-500 mt-1">文字搜图、以图搜图</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, loading }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-50',
    green: 'text-green-500 bg-green-50',
    purple: 'text-purple-500 bg-purple-50',
    gray: 'text-gray-500 bg-gray-50',
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">
            {loading ? '-' : value}
          </p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

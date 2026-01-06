'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Trash2,
  Edit2,
  Image,
  Video,
  Music,
  Calendar,
  HardDrive,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import { assetsApi, historyApi } from '@/lib/api';
import { Asset } from '@/types/asset';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadAsset(params.id as string);
    }
  }, [params.id]);

  const loadAsset = async (id: string) => {
    try {
      const res = await assetsApi.get(id);
      setAsset(res.data);
      historyApi.record(id, 'view').catch(() => {});
    } catch {
      console.error('加载素材失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!asset || !confirm('确定要删除这个素材吗？')) return;
    setDeleting(true);
    try {
      await assetsApi.delete(asset.id);
      router.push('/assets');
    } catch {
      alert('删除失败');
      setDeleting(false);
    }
  };

  const handleCopyUrl = () => {
    if (asset?.file_url) {
      navigator.clipboard.writeText(asset.file_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!asset) return <NotFound />;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/assets" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800 truncate flex-1">{asset.name}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '复制链接'}
          </button>
          {asset.file_url && (
            <a
              href={asset.file_url}
              download
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              下载
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <AssetPreview asset={asset} />
        </div>
        <div>
          <AssetInfo asset={asset} />
        </div>
      </div>
    </div>
  );
}

function AssetPreview({ asset }: { asset: Asset }) {
  const TypeIcon = asset.type === 'image' ? Image : asset.type === 'video' ? Video : Music;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="aspect-video bg-gray-900 flex items-center justify-center">
        {asset.type === 'image' && asset.file_url ? (
          <img src={asset.file_url} alt={asset.name} className="max-w-full max-h-full object-contain" />
        ) : asset.type === 'video' && asset.file_url ? (
          <video src={asset.file_url} controls className="max-w-full max-h-full" />
        ) : asset.type === 'audio' && asset.file_url ? (
          <div className="text-center">
            <Music className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <audio src={asset.file_url} controls className="w-80" />
          </div>
        ) : (
          <TypeIcon className="w-24 h-24 text-gray-400" />
        )}
      </div>
    </div>
  );
}

function AssetInfo({ asset }: { asset: Asset }) {
  const TypeIcon = asset.type === 'image' ? Image : asset.type === 'video' ? Video : Music;
  const typeLabel = asset.type === 'image' ? '图片' : asset.type === 'video' ? '视频' : '音频';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-800">素材信息</h3>

      <InfoRow icon={TypeIcon} label="类型" value={typeLabel} />
      <InfoRow icon={HardDrive} label="大小" value={formatFileSize(asset.file_size)} />
      <InfoRow icon={Calendar} label="上传时间" value={new Date(asset.created_at).toLocaleString()} />
      <InfoRow icon={Eye} label="查看次数" value={asset.view_count.toString()} />

      {asset.description && (
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-1">描述</p>
          <p className="text-sm text-gray-800">{asset.description}</p>
        </div>
      )}

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500 mb-1">向量状态</p>
        <StatusBadge status={asset.vector_status} />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-500 w-16">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 aspect-video bg-gray-200 rounded-xl" />
        <div className="bg-gray-200 rounded-xl h-80" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="p-6 text-center py-20">
      <p className="text-gray-500 mb-4">素材不存在或已被删除</p>
      <Link href="/assets" className="text-blue-600 hover:underline">返回素材库</Link>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

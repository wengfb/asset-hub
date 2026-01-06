'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image, Video, Music } from 'lucide-react';
import { assetsApi } from '@/lib/api';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const ACCEPTED_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi', '.webm'],
  'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
};

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2),
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);

    for (const uploadFile of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        await assetsApi.upload(uploadFile.file);
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f))
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'error', error: '上传失败' } : f
          )
        );
      }
    }

    setUploading(false);
  };

  const successCount = files.filter((f) => f.status === 'success').length;
  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">上传素材</h1>

      <DropZone
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
      />

      {files.length > 0 && (
        <>
          <FileList files={files} onRemove={removeFile} />
          <ActionBar
            uploading={uploading}
            pendingCount={pendingCount}
            successCount={successCount}
            totalCount={files.length}
            onUpload={uploadAll}
            onClear={() => setFiles([])}
            onViewAssets={() => router.push('/assets')}
          />
        </>
      )}
    </div>
  );
}

function DropZone({ getRootProps, getInputProps, isDragActive }: {
  getRootProps: () => object;
  getInputProps: () => object;
  isDragActive: boolean;
}) {
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 mb-2">
        {isDragActive ? '释放文件以上传' : '拖拽文件到此处，或点击选择文件'}
      </p>
      <p className="text-sm text-gray-400">支持图片、视频、音频文件</p>
    </div>
  );
}

function FileList({ files, onRemove }: { files: UploadFile[]; onRemove: (id: string) => void }) {
  return (
    <div className="mt-6 space-y-2">
      <h3 className="text-sm font-medium text-gray-700 mb-3">待上传文件 ({files.length})</h3>
      {files.map((f) => (
        <FileItem key={f.id} file={f} onRemove={() => onRemove(f.id)} />
      ))}
    </div>
  );
}

function FileItem({ file, onRemove }: { file: UploadFile; onRemove: () => void }) {
  const getIcon = () => {
    if (file.file.type.startsWith('image/')) return Image;
    if (file.file.type.startsWith('video/')) return Video;
    return Music;
  };
  const Icon = getIcon();

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
      </div>
      <StatusIcon status={file.status} />
      {file.status === 'pending' && (
        <button onClick={onRemove} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: UploadFile['status'] }) {
  switch (status) {
    case 'uploading':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
}

function ActionBar({ uploading, pendingCount, successCount, totalCount, onUpload, onClear, onViewAssets }: {
  uploading: boolean;
  pendingCount: number;
  successCount: number;
  totalCount: number;
  onUpload: () => void;
  onClear: () => void;
  onViewAssets: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-sm text-gray-500">
        {successCount > 0 && `${successCount}/${totalCount} 上传成功`}
      </p>
      <div className="flex items-center gap-3">
        <button onClick={onClear} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          清空列表
        </button>
        {successCount > 0 && successCount === totalCount ? (
          <button
            onClick={onViewAssets}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            查看素材库
          </button>
        ) : (
          <button
            onClick={onUpload}
            disabled={uploading || pendingCount === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? '上传中...' : `上传 (${pendingCount})`}
          </button>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

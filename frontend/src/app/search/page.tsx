'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { Search, Image, Upload, Loader2, Video, Music } from 'lucide-react';
import { searchApi } from '@/lib/api';
import { SearchResult } from '@/types/asset';

type SearchMode = 'text' | 'image';

export default function SearchPage() {
  const [mode, setMode] = useState<SearchMode>('text');
  const [query, setQuery] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const onDrop = useCallback((files: File[]) => {
    if (files.length > 0) {
      setImageFile(files[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const handleSearch = async () => {
    if (mode === 'text' && !query.trim()) return;
    if (mode === 'image' && !imageFile) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = mode === 'text'
        ? await searchApi.text(query, 20)
        : await searchApi.image(imageFile!, 20);
      setResults(res.data);
    } catch {
      console.error('搜索失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">智能搜索</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <ModeToggle mode={mode} onChange={setMode} />

        {mode === 'text' ? (
          <TextSearch query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} />
        ) : (
          <ImageSearch
            imageFile={imageFile}
            setImageFile={setImageFile}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            onSearch={handleSearch}
            loading={loading}
          />
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : searched && results.length === 0 ? (
        <EmptyState />
      ) : results.length > 0 ? (
        <ResultGrid results={results} />
      ) : null}
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: SearchMode; onChange: (m: SearchMode) => void }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => onChange('text')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          mode === 'text' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Search className="w-4 h-4" />
        文字搜图
      </button>
      <button
        onClick={() => onChange('image')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          mode === 'image' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Image className="w-4 h-4" />
        以图搜图
      </button>
    </div>
  );
}

function TextSearch({ query, setQuery, onSearch, loading }: {
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
  loading: boolean;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入搜索内容，如：蓝天白云、办公室场景..."
        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        搜索
      </button>
    </form>
  );
}

function ImageSearch({ imageFile, setImageFile, getRootProps, getInputProps, isDragActive, onSearch, loading }: {
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  getRootProps: () => object;
  getInputProps: () => object;
  isDragActive: boolean;
  onSearch: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      {imageFile ? (
        <div className="flex items-center gap-4">
          <img
            src={URL.createObjectURL(imageFile)}
            alt="搜索图片"
            className="w-32 h-32 object-cover rounded-lg"
          />
          <div className="flex-1">
            <p className="font-medium">{imageFile.name}</p>
            <button onClick={() => setImageFile(null)} className="text-sm text-red-500 mt-1">
              移除
            </button>
          </div>
          <button
            onClick={onSearch}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            搜索相似图片
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">拖拽图片到此处，或点击选择</p>
        </div>
      )}
    </div>
  );
}

function ResultGrid({ results }: { results: SearchResult[] }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">找到 {results.length} 个相似结果</p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((result, idx) => (
          <ResultCard key={idx} result={result} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const { asset, score } = result;
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
            {(score * 100).toFixed(0)}%
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-gray-800 truncate">{asset.name}</p>
        </div>
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
      <p className="text-gray-500">搜索中...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">未找到相似结果</p>
    </div>
  );
}

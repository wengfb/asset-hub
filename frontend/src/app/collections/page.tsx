'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Folder, Image } from 'lucide-react';
import { collectionsApi } from '@/lib/api';
import { Collection } from '@/types/asset';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const res = await collectionsApi.list();
      setCollections(res.data);
    } catch {
      console.error('加载收藏夹失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCollection(null);
    setShowModal(true);
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setShowModal(true);
  };

  const handleDelete = async (collection: Collection) => {
    if (!confirm(`确定要删除收藏夹"${collection.name}"吗？`)) return;
    try {
      await collectionsApi.delete(collection.id);
      setCollections((prev) => prev.filter((c) => c.id !== collection.id));
    } catch {
      alert('删除失败');
    }
  };

  const handleSave = async (name: string, description: string) => {
    try {
      if (editingCollection) {
        const res = await collectionsApi.update(editingCollection.id, { name, description });
        setCollections((prev) => prev.map((c) => (c.id === editingCollection.id ? res.data : c)));
      } else {
        const res = await collectionsApi.create({ name, description });
        setCollections((prev) => [...prev, res.data]);
      }
      setShowModal(false);
    } catch {
      alert('保存失败');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">收藏夹</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新建收藏夹
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : collections.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <CollectionGrid
          collections={collections}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showModal && (
        <CollectionModal
          collection={editingCollection}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function CollectionGrid({ collections, onEdit, onDelete }: {
  collections: Collection[];
  onEdit: (c: Collection) => void;
  onDelete: (c: Collection) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onEdit={() => onEdit(collection)}
          onDelete={() => onDelete(collection)}
        />
      ))}
    </div>
  );
}

function CollectionCard({ collection, onEdit, onDelete }: {
  collection: Collection;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Link href={`/collections/${collection.id}`}>
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <Folder className="w-16 h-16 text-gray-300" />
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/collections/${collection.id}`}>
          <h3 className="font-medium text-gray-800 truncate hover:text-blue-600">
            {collection.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mt-1">{collection.asset_count} 个素材</p>
        {collection.description && (
          <p className="text-xs text-gray-400 mt-1 truncate">{collection.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onEdit}
            className="flex-1 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded"
          >
            <Edit2 className="w-4 h-4 inline mr-1" />编辑
          </button>
          <button
            onClick={onDelete}
            className="flex-1 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4 inline mr-1" />删除
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionModal({ collection, onClose, onSave }: {
  collection: Collection | null;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}) {
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), description.trim());
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">
          {collection ? '编辑收藏夹' : '新建收藏夹'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="输入收藏夹名称"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="输入描述（可选）"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-16">
      <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 mb-4">暂无收藏夹</p>
      <button
        onClick={onCreate}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        创建第一个收藏夹
      </button>
    </div>
  );
}

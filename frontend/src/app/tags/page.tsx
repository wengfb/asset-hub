'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tag as TagIcon } from 'lucide-react';
import { tagsApi } from '@/lib/api';
import { Tag } from '@/types/asset';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const res = await tagsApi.list();
      setTags(res.data);
    } catch {
      console.error('加载标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    setShowModal(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setShowModal(true);
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`确定要删除标签"${tag.name}"吗？`)) return;
    try {
      await tagsApi.delete(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    } catch {
      alert('删除失败');
    }
  };

  const handleSave = async (name: string, color: string) => {
    try {
      if (editingTag) {
        const res = await tagsApi.update(editingTag.id, { name, color });
        setTags((prev) => prev.map((t) => (t.id === editingTag.id ? res.data : t)));
      } else {
        const res = await tagsApi.create({ name, color });
        setTags((prev) => [...prev, res.data]);
      }
      setShowModal(false);
    } catch {
      alert('保存失败');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">标签管理</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新建标签
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : tags.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <TagGrid tags={tags} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {showModal && (
        <TagModal
          tag={editingTag}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function TagGrid({ tags, onEdit, onDelete }: {
  tags: Tag[];
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tags.map((tag) => (
        <TagCard key={tag.id} tag={tag} onEdit={() => onEdit(tag)} onDelete={() => onDelete(tag)} />
      ))}
    </div>
  );
}

function TagCard({ tag, onEdit, onDelete }: {
  tag: Tag;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: tag.color }} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate">{tag.name}</p>
          <p className="text-xs text-gray-500">{tag.asset_count} 个素材</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onEdit} className="flex-1 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">
          <Edit2 className="w-4 h-4 inline mr-1" />编辑
        </button>
        <button onClick={onDelete} className="flex-1 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
          <Trash2 className="w-4 h-4 inline mr-1" />删除
        </button>
      </div>
    </div>
  );
}

function TagModal({ tag, onClose, onSave }: {
  tag: Tag | null;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}) {
  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || '#6366f1');
  const [saving, setSaving] = useState(false);

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), color);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{tag ? '编辑标签' : '新建标签'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">标签名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="输入标签名称"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">颜色</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">
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
        <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-16">
      <TagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 mb-4">暂无标签</p>
      <button onClick={onCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        创建第一个标签
      </button>
    </div>
  );
}

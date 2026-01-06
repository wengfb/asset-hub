'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Image,
  Upload,
  Search,
  Tag,
  Folder,
  Clock,
} from 'lucide-react';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/assets', label: '素材库', icon: Image },
  { href: '/upload', label: '上传', icon: Upload },
  { href: '/search', label: '搜索', icon: Search },
  { href: '/tags', label: '标签', icon: Tag },
  { href: '/collections', label: '收藏夹', icon: Folder },
  { href: '/history', label: '历史', icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Asset Hub</h1>
        <p className="text-xs text-gray-500 mt-1">AI素材管理系统</p>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">v0.1.0</p>
      </div>
    </aside>
  );
}

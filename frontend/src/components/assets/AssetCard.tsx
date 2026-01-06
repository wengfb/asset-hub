'use client';

import { Asset } from '@/types/asset';
import { Image, Video, Music } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
}

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'image':
      return <Image className="w-4 h-4" />;
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'audio':
      return <Music className="w-4 h-4" />;
    default:
      return null;
  }
};

export function AssetCard({ asset }: AssetCardProps) {
  return (
    <div className="group relative rounded-lg overflow-hidden bg-gray-100">
      <div className="aspect-square bg-gray-200">
        {asset.thumbnail_url ? (
          <img
            src={asset.thumbnail_url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon type={asset.type} />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-sm truncate">{asset.name}</p>
      </div>
    </div>
  );
}

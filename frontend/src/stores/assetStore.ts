import { create } from 'zustand';
import { Asset } from '@/types/asset';

interface AssetStore {
  assets: Asset[];
  isLoading: boolean;
  setAssets: (assets: Asset[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  isLoading: false,
  setAssets: (assets) => set({ assets }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChainConfig, SupportedChainId } from '../chains/types';
import { CHAIN_CONFIGS } from '../chains/config';

interface ChainStore {
  // Current active chain
  currentChain: ChainConfig;

  // Switch chain
  switchChain: (chainId: SupportedChainId) => void;

  // Get chain by ID
  getChain: (chainId: SupportedChainId) => ChainConfig | undefined;

  // Testnet mode toggle
  isTestnet: boolean;
  toggleTestnet: () => void;

  // Get available chains based on testnet mode
  getAvailableChains: () => ChainConfig[];
}

export const useChainStore = create<ChainStore>()(
  persist(
    (set, get) => ({
      // Default to Polygon mainnet
      currentChain: CHAIN_CONFIGS['polygon'],
      isTestnet: false,

      switchChain: (chainId: SupportedChainId) => {
        const chain = CHAIN_CONFIGS[chainId];
        if (chain) {
          set({ currentChain: chain });
          console.log(`[ChainStore] Switched to ${chain.name} (${chainId})`);
        } else {
          console.error(`[ChainStore] Chain ${chainId} not found`);
        }
      },

      getChain: (chainId: SupportedChainId) => {
        return CHAIN_CONFIGS[chainId];
      },

      toggleTestnet: () => {
        const newTestnetMode = !get().isTestnet;
        set({ isTestnet: newTestnetMode });

        // Switch to corresponding testnet/mainnet
        const currentChain = get().currentChain;
        if (currentChain.type === 'evm') {
          if (newTestnetMode) {
            // Switch to testnet equivalent
            if (currentChain.id === 'ethereum') {
              get().switchChain('sepolia');
            } else if (currentChain.id === 'polygon') {
              get().switchChain('polygon-mumbai');
            }
          } else {
            // Switch to mainnet equivalent
            if (currentChain.id === 'sepolia') {
              get().switchChain('ethereum');
            } else if (currentChain.id === 'polygon-mumbai') {
              get().switchChain('polygon');
            }
          }
        } else if (currentChain.type === 'stacks') {
          if (newTestnetMode) {
            get().switchChain('stacks-testnet');
          } else {
            get().switchChain('stacks-mainnet');
          }
        }
      },

      getAvailableChains: () => {
        const isTestnet = get().isTestnet;
        return Object.values(CHAIN_CONFIGS).filter(
          chain => chain.testnet === isTestnet
        );
      },
    }),
    {
      name: 'chain-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields
      partialize: (state) => ({
        currentChain: state.currentChain,
        isTestnet: state.isTestnet,
      }),
    }
  )
);

// TODO: need add logic for mock connector

import {
  connect,
  disconnect,
  getAccount,
  GetAccountResult,
  getNetwork,
  getPublicClient,
  getWalletClient,
} from '@wagmi/core';
import { produce } from 'immer';
import { Chain, Hex, PublicClient, WalletClient } from 'viem';

import { StoreSlice } from '../../types/store';
import {
  clearWalletConnectV2LocalStorage,
  clearWalletLinkLocalStorage,
  deleteLocalStorageWallet,
  LocalStorageKeys,
  setLocalStorageWallet,
} from '../../utils/localStorage';
import { ConnectorType, getConnectorName, WalletType } from '../connectors';
import { TransactionsSliceBaseType } from './transactionsSlice';

export interface Wallet {
  walletType: WalletType;
  address: Hex;
  chain?: Chain;
  client: PublicClient;
  walletClient: WalletClient;
  // isActive is added, because Wallet can be connected but not active, i.e. wrong network
  isActive: boolean;
  // isContractAddress is added, to check if wallet address is contract
  isContractAddress: boolean;
}

export type IWalletSlice = {
  isContractWalletRecord: Record<string, boolean>;
  activeWallet?: Wallet;
  setActiveWallet: (
    wallet: Omit<Wallet, 'walletClient' | 'client'>,
  ) => Promise<void>;
  isActiveWalletSetting: boolean;
  connectWallet: (walletType: WalletType) => Promise<void>;
  disconnectActiveWallet: () => Promise<void>;
  walletActivating: boolean;
  walletConnectionError: string;
  resetWalletConnectionError: () => void;
  initDefaultWallet: () => Promise<void>;
  changeActiveWalletAccount: (account?: GetAccountResult) => Promise<void>;
  isActiveWalletAccountChanging: boolean;
  changeActiveWalletChain: (chain?: Chain) => Promise<void>;
  isActiveWalletChainChanging: boolean;
  checkAndSwitchNetwork: (chainId?: number) => Promise<void>;
  connectors: ConnectorType[];
  setConnectors: (connectors: ConnectorType[]) => void;
  _impersonatedAddress?: Hex;
  setImpersonatedAddress: (address: Hex) => void;
  checkIsContractWallet: (
    wallet: Omit<Wallet, 'walletClient'>,
  ) => Promise<boolean>;
};

export function createWalletSlice({
  walletConnected,
}: {
  walletConnected: (wallet: Wallet) => void;
}): StoreSlice<IWalletSlice, TransactionsSliceBaseType> {
  return (set, get) => ({
    isContractWalletRecord: {},
    walletActivating: false,
    walletConnectionError: '',
    connectors: [],
    setConnectors: async (connectors) => {
      if (get().connectors.length !== connectors.length) {
        set(() => ({ connectors }));
        await get().initDefaultWallet();
        get().initTxPool();
      }
    },
    initDefaultWallet: async () => {
      const lastConnectedWallet = localStorage.getItem(
        LocalStorageKeys.LastConnectedWallet,
      ) as WalletType | undefined;

      if (lastConnectedWallet) {
        await get().connectWallet(lastConnectedWallet);
      }
    },

    setActiveWallet: async (wallet) => {
      if (wallet.isActive) {
        if (wallet.chain) {
          set({ isActiveWalletSetting: true });
          const client = getPublicClient({ chainId: wallet.chain.id });
          const walletClient = await getWalletClient({
            chainId: wallet.chain.id,
          });

          if (client && walletClient) {
            const walletWithClients = {
              ...wallet,
              walletClient,
              client,
            };

            const isContractAddress =
              await get().checkIsContractWallet(walletWithClients);
            const activeWallet = { ...walletWithClients, isContractAddress };

            set({ activeWallet });
            walletConnected(activeWallet);
            set({ isActiveWalletSetting: false });
          }
        }
      }
    },
    isActiveWalletSetting: false,

    connectWallet: async (walletType) => {
      clearWalletLinkLocalStorage();
      clearWalletConnectV2LocalStorage();

      if (get().activeWallet?.walletType !== walletType) {
        await get().disconnectActiveWallet();
      }

      set({ walletActivating: true });
      set({ walletConnectionError: '' });

      const connector = get().connectors.find(
        (connector) => getConnectorName(connector) === walletType,
      );

      try {
        if (connector) {
          if (walletType === 'Impersonated') {
            await connect({ connector });
            // @ts-ignore
            await connector.connect({
              address: get()._impersonatedAddress,
            });
          } else {
            await connect({ connector });
          }

          setLocalStorageWallet(walletType);
          get().updateEthAdapter(walletType === 'GnosisSafe');

          const account = getAccount();
          const network = getNetwork();
          if (
            account &&
            account.isConnected &&
            account.address &&
            network.chain
          ) {
            await get().setActiveWallet({
              walletType,
              address: account.address,
              chain: network.chain,
              isActive: account.isConnected,
              isContractAddress: false,
            });
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          let errorMessage = e.message ? e.message.toString() : e.toString();
          set({
            walletConnectionError: errorMessage,
          });
        }
        console.error(e);
      }
      set({ walletActivating: false });
    },
    checkAndSwitchNetwork: async (chainId) => {
      const activeWallet = get().activeWallet;
      if (
        chainId &&
        activeWallet &&
        activeWallet.chain?.id &&
        activeWallet.chain.id !== chainId
      ) {
        set({ isActiveWalletSetting: true });
        await activeWallet.walletClient.switchChain({
          id: chainId,
        });
        await new Promise((resolve) => {
          function loop() {
            if (!get().isActiveWalletSetting) {
              return resolve(() =>
                console.info('Chain for wallet client changed'),
              );
            }
            setTimeout(loop, 10);
          }
          loop();
        });
      }
    },
    disconnectActiveWallet: async () => {
      await disconnect();
      set({ activeWallet: undefined });
      deleteLocalStorageWallet();
      clearWalletLinkLocalStorage();
      clearWalletConnectV2LocalStorage();
    },

    checkIsContractWallet: async (wallet) => {
      const address = wallet.address;
      const walletRecord = get().isContractWalletRecord[address];
      if (walletRecord !== undefined) {
        return walletRecord;
      }
      const codeOfWalletAddress = await wallet.client.getBytecode({
        address: wallet.address,
      });
      const isContractWallet = !!codeOfWalletAddress;
      set((state) =>
        produce(state, (draft) => {
          draft.isContractWalletRecord[address] = isContractWallet;
        }),
      );
      return isContractWallet;
    },

    changeActiveWalletAccount: async (account) => {
      const activeWallet = get().activeWallet;
      if (
        account &&
        account.address &&
        activeWallet &&
        activeWallet.isActive &&
        activeWallet.address !== account.address &&
        !get().isActiveWalletAccountChanging
      ) {
        set({ isActiveWalletAccountChanging: true });
        await get().setActiveWallet({
          walletType: activeWallet.walletType,
          address: account.address,
          isActive: activeWallet.isActive,
          isContractAddress: activeWallet.isContractAddress,
          chain: activeWallet.chain,
        });
        set({ isActiveWalletAccountChanging: false });
      }
    },
    isActiveWalletAccountChanging: false,
    changeActiveWalletChain: async (chain) => {
      const activeWallet = get().activeWallet;
      if (
        chain !== undefined &&
        activeWallet &&
        activeWallet.isActive &&
        activeWallet.chain &&
        activeWallet.chain.id !== chain.id &&
        !get().isActiveWalletChainChanging
      ) {
        set({ isActiveWalletChainChanging: true });
        await get().setActiveWallet({
          walletType: activeWallet.walletType,
          address: activeWallet.address,
          isActive: activeWallet.isActive,
          isContractAddress: activeWallet.isContractAddress,
          chain: chain,
        });
        set({ isActiveWalletChainChanging: false });
      }
    },
    isActiveWalletChainChanging: false,

    setImpersonatedAddress: (address) => {
      set({ _impersonatedAddress: address });
    },
    resetWalletConnectionError: () => {
      set({ walletConnectionError: '' });
    },
  });
}

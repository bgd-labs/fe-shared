import type { AddEthereumChainParameter, Connector } from '@web3-react/types';
import { providers } from 'ethers';
import { produce } from 'immer';

import { StoreSlice } from '../../types/store';
import {
  clearWalletConnectLocalStorage,
  deleteLocalStorageWallet,
  LocalStorageKeys,
  setLocalStorageWallet,
} from '../../utils/localStorage';
import { StaticJsonRpcBatchProvider } from '../../utils/StaticJsonRpcBatchProvider';
import { getConnectorName, WalletType } from '../connectors';
import { TransactionsSliceBaseType } from './transactionsSlice';

export interface Wallet {
  walletType: WalletType;
  accounts: string[];
  chainId?: number;
  provider: providers.JsonRpcProvider;
  signer: providers.JsonRpcSigner;
  // isActive is added, because Wallet can be connected but not active, i.e. wrong network
  isActive: boolean;
  // isContractAddress is added, to check if wallet address is contract
  isContractAddress: boolean;
}

export type IWalletSlice = {
  isContractWalletRecord: Record<string, boolean>;
  activeWallet?: Wallet;
  getActiveAddress: () => string | undefined;
  connectWallet: (walletType: WalletType, chainID?: number) => Promise<void>;
  disconnectActiveWallet: () => Promise<void>;
  walletActivating: boolean;
  walletConnectionError: string;
  resetWalletConnectionError: () => void;
  initDefaultWallet: () => Promise<void>;
  setActiveWallet: (wallet: Omit<Wallet, 'signer'>) => Promise<void>;
  changeActiveWalletChainId: (chainId?: number) => void;
  checkAndSwitchNetwork: (chainId?: number) => Promise<void>;
  connectors: Connector[];
  setConnectors: (connectors: Connector[]) => void;
  _impersonatedAddress?: string;
  setImpersonatedAddress: (address: string) => void;
  checkIsContractWallet: (wallet: Omit<Wallet, 'signer'>) => Promise<boolean>;
};

export function createWalletSlice({
  walletConnected,
  getChainParameters,
}: {
  walletConnected: (wallet: Wallet) => void; // TODO: why all of them here hardcoded
  getChainParameters: (chainId: number) => AddEthereumChainParameter | number;
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
        LocalStorageKeys.LastConnectedWallet
      ) as WalletType | undefined;
      const lastConnectedChainId = localStorage.getItem(
        LocalStorageKeys.LastConnectedChainId
      ) as string | undefined;

      if (lastConnectedWallet && lastConnectedChainId) {
        await get().connectWallet(lastConnectedWallet, +lastConnectedChainId);
      }
    },
    connectWallet: async (walletType: WalletType, txChainID?: number) => {
      let chainID = txChainID;

      const activeWallet = get().activeWallet;

      if (
        typeof txChainID === 'undefined' &&
        activeWallet &&
        activeWallet.chainId
      ) {
        if (activeWallet.chainId !== chainID) {
          chainID = activeWallet.chainId;
        }
      }

      if (get().activeWallet?.walletType !== walletType) {
        await get().disconnectActiveWallet();
      }

      const impersonatedAddress = get()._impersonatedAddress;
      set({ walletActivating: true });
      set({ walletConnectionError: '' });
      const connector = get().connectors.find(
        (connector) => getConnectorName(connector) === walletType
      );
      try {
        if (connector) {
          switch (walletType) {
            case 'Impersonated':
              if (impersonatedAddress) {
                await connector.activate({
                  address: impersonatedAddress,
                  chainId: chainID,
                });
              }
              break;
            case 'Coinbase':
            case 'Metamask':
              await connector.activate(
                typeof chainID !== 'undefined'
                  ? getChainParameters(chainID)
                  : undefined,
              );
              break;
            case 'WalletConnect':
              await connector.activate(chainID);
              break;
            case 'GnosisSafe':
              await connector.activate(chainID);
              break;
          }
          setLocalStorageWallet(walletType);
          get().updateEthAdapter(walletType === 'GnosisSafe');
        }
      } catch (e) {
        if (e instanceof Error) {
          let errorMessage = e.message ? e.message.toString() : e.toString();
          if (errorMessage === 'MetaMask not installed') {
            errorMessage = 'Browser wallet not installed';
          }

          set({
            walletConnectionError: errorMessage,
          });
        }
        console.error(e);
      }
      set({ walletActivating: false });
    },
    checkAndSwitchNetwork: async (chainID?: number) => {
      const activeWallet = get().activeWallet;
      if (activeWallet) {
        await get().connectWallet(activeWallet.walletType, chainID);
      }
    },
    disconnectActiveWallet: async () => {
      const activeWallet = get().activeWallet;
      if (activeWallet) {
        const activeConnector = get().connectors.find(
          (connector) => getConnectorName(connector) == activeWallet.walletType
        );

        if (activeConnector?.deactivate) {
          await activeConnector.deactivate();
        }
        await activeConnector?.resetState();
        set({ activeWallet: undefined });
      }
      deleteLocalStorageWallet();
      clearWalletConnectLocalStorage();
    },
    checkIsContractWallet: async (wallet: Omit<Wallet, 'signer'>) => {
      const account = wallet.accounts[0];
      const walletRecord = get().isContractWalletRecord[account];
      if (walletRecord !== undefined) {
        return walletRecord;
      }
      const codeOfWalletAddress = await wallet.provider.getCode(
        wallet.accounts[0]
      );
      const isContractWallet = codeOfWalletAddress !== '0x';
      set((state) =>
        produce(state, (draft) => {
          draft.isContractWalletRecord[account] = isContractWallet;
        })
      );
      return isContractWallet;
    },
    /**
     * setActiveWallet is separate from connectWallet for a reason, after metaMask.activate()
     * only provider is available in the returned type, but we also need accounts and chainID which for some reason
     * is impossible to pull from .provider() still not the best approach, and I'm looking to find proper way to handle it
     */
    setActiveWallet: async (wallet: Omit<Wallet, 'signer'>) => {
      const providerSigner =
        wallet.walletType == 'Impersonated'
          ? wallet.provider.getSigner(get()._impersonatedAddress)
          : wallet.provider.getSigner(0);

      if (wallet.chainId !== undefined) {
        get().setProvider(
          wallet.chainId,
          wallet.provider as StaticJsonRpcBatchProvider
        );
      }
      const isContractAddress = await get().checkIsContractWallet(wallet);
      set({
        activeWallet: {
          ...wallet,
          isContractAddress: isContractAddress,
          signer: providerSigner,
        },
      });
      const activeWallet = get().activeWallet;
      if (activeWallet) {
        walletConnected(activeWallet);
      }
    },
    changeActiveWalletChainId: (chainId?: number) => {
      if (chainId !== undefined) {
        set((state) =>
          produce(state, (draft) => {
            if (draft.activeWallet) {
              draft.activeWallet.chainId = chainId;
            }
          }),
        );
      }
    },

    getActiveAddress: () => {
      const activeWallet = get().activeWallet;
      if (activeWallet && activeWallet.accounts) {
        return activeWallet.accounts[0];
      }
      return undefined;
    },

    setImpersonatedAddress: (address) => {
      set({ _impersonatedAddress: address });
    },

    resetWalletConnectionError: () => {
      set({ walletConnectionError: '' });
    },
  });
}

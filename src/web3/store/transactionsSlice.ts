import { TimeoutError, waitUntil } from 'async-wait-until';
import { ethers, providers } from 'ethers';
import { Draft, produce } from 'immer';

import { StoreSlice } from '../../types/store';
import {
  getLocalStorageTxPool,
  setLocalStorageTxPool,
} from '../../utils/localStorage';
import { Web3Slice } from './walletSlice';

export type BaseTx = {
  type: string;
  hash: string;
  from: string;
  to: string;
  nonce: number;
  payload?: object;
  chainId: number;
  timestamp?: number;
};

export type ProvidersRecord = Record<
  number,
  ethers.providers.JsonRpcBatchProvider
>;

export type TransactionPool<T extends BaseTx> = Record<string, T>;

export interface ITransactionsState<T extends BaseTx> {
  transactionsPool: TransactionPool<
    T & {
      status?: number;
      pending: boolean;
    }
  >;
}

interface ITransactionsActions<T extends BaseTx> {
  txStatusChangedCallback: (
    data: T & {
      status?: number;
    }
  ) => void;
  executeTx: (params: {
    body: () => Promise<ethers.ContractTransaction>;
    params: {
      type: T['type'];
      payload: T['payload'];
      desiredChainID: number;
    };
  }) => Promise<
    T & {
      status?: number;
      pending: boolean;
    }
  >;
  waitForTx: (hash: string) => Promise<void>;
  waitForTxReceipt: (
    tx: ethers.providers.TransactionResponse,
    txHash: string,
    provider: providers.JsonRpcBatchProvider
  ) => Promise<void>;
  updateTXStatus: (hash: string, status?: number) => void;
  initTxPool: () => void;
}

export type ITransactionsSlice<T extends BaseTx> = ITransactionsActions<T> &
  ITransactionsState<T>;

export function createTransactionsSlice<T extends BaseTx>({
  txStatusChangedCallback,
  providers,
}: {
  txStatusChangedCallback: (tx: T) => void;
  providers: ProvidersRecord;
}): StoreSlice<
  ITransactionsSlice<T>,
  Pick<Web3Slice, 'checkAndSwitchNetwork'>
> {
  return (set, get) => ({
    transactionsPool: {},
    txStatusChangedCallback,
    executeTx: async ({ body, params }) => {
      await get().checkAndSwitchNetwork(params.desiredChainID);
      const tx = await body();
      const chainId = Number(params.desiredChainID);
      const transaction = {
        chainId,
        hash: tx.hash,
        type: params.type,
        payload: params.payload,
        from: tx.from,
        to: tx.to,
        nonce: tx.nonce,
      };
      set((state) =>
        produce(state, (draft) => {
          draft.transactionsPool[transaction.hash] = {
            ...transaction,
            pending: true,
          } as Draft<
            T & {
              pending: boolean;
            }
          >;
        })
      );
      const txPool = get().transactionsPool;
      setLocalStorageTxPool(txPool);
      get().waitForTx(tx.hash);
      return txPool[tx.hash];
    },

    waitForTx: async (hash) => {
      const txData = get().transactionsPool[hash];
      if (txData) {
        const provider = providers[
          txData.chainId
        ] as providers.JsonRpcBatchProvider;

        try {
          const tx = await waitUntil<{
            tx: ethers.providers.TransactionResponse;
          }>(
            async () => {
              return { tx: await provider.getTransaction(txData.hash) };
            },
            { timeout: 10000 }
          );
          if (tx.tx) {
            await get().waitForTxReceipt(tx.tx, txData.hash, provider);
          }
        } catch (e) {
          if (e instanceof TimeoutError) {
            const tx = await provider.getTransaction(txData.hash);
            if (tx) {
              await get().waitForTxReceipt(tx, txData.hash, provider);
            }
          } else {
            console.error(e);
          }
        }
      } else {
        // TODO: no transaction in waiting pool
      }
    },

    waitForTxReceipt: async (
      tx: ethers.providers.TransactionResponse,
      txHash: string,
      provider: providers.JsonRpcBatchProvider
    ) => {
      const txn = await tx.wait();

      get().updateTXStatus(txHash, txn.status);

      const updatedTX = get().transactionsPool[txHash];
      const txBlock = await provider.getBlock(txn.blockNumber);
      get().txStatusChangedCallback({
        ...updatedTX,
        timestamp: txBlock.timestamp,
      });
    },

    updateTXStatus: (hash, status) => {
      set((state) =>
        produce(state, (draft) => {
          draft.transactionsPool[hash].status = status;
          draft.transactionsPool[hash].pending = false;
        })
      );

      setLocalStorageTxPool(get().transactionsPool);
    },
    initTxPool: () => {
      const localStorageTXPool = getLocalStorageTxPool();
      if (localStorageTXPool) {
        const transactionsPool = JSON.parse(localStorageTXPool);
        // TODO: figure out type casting from string via ZOD or similar
        set(() => ({
          transactionsPool,
        }));
      }
      Object.values(get().transactionsPool).forEach((tx) => {
        if (tx.pending) {
          get().waitForTx(tx.hash);
        }
      });
    },
  });
}

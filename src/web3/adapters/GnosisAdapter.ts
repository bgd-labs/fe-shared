import dayjs from 'dayjs';
import { produce } from 'immer';

import { SafeTransactionServiceUrls } from '../../utils/constants';
import { setLocalStorageTxPool } from '../../utils/localStorage';
import {
  BaseTx,
  EthBaseTx,
  InitialEthTx,
  InitialTx,
  ITransactionsSlice,
  NewTx,
  PoolEthTx,
  TransactionStatus,
} from '../store/transactionsSlice';
import { Wallet } from '../store/walletSlice';
import { AdapterInterface } from './interface';

export type GnosisTxStatusResponse = {
  transactionHash: string;
  safeTxHash: string;
  isExecuted: boolean;
  isSuccessful: boolean | null;
  executionDate: string | null;
  submissionDate: string | null;
  modified: string;
  nonce: number;
  trusted: boolean;
};

export type GnosisTxSameNonceResponse = {
  count: number;
  countUniqueNonce: number;
  results: GnosisTxStatusResponse[];
};

export type SafeTx = {
  safeTxHash: string;
};

export function isSafeTx(tx: InitialTx): tx is SafeTx {
  return (tx as SafeTx).safeTxHash !== undefined;
}

export class GnosisAdapter<T extends BaseTx> implements AdapterInterface<T> {
  private activeWallet: Wallet | undefined = undefined;

  get: () => ITransactionsSlice<T>;
  set: (fn: (state: ITransactionsSlice<T>) => ITransactionsSlice<T>) => void;
  transactionsIntervalsMap: Record<string, number | undefined> = {};

  constructor(
    get: () => ITransactionsSlice<T>,
    set: (fn: (state: ITransactionsSlice<T>) => ITransactionsSlice<T>) => void,
    activeWallet: Wallet | undefined,
  ) {
    this.get = get;
    this.set = set;
    this.activeWallet = activeWallet;
  }

  executeTx = async (params: {
    tx: NewTx;
    activeWallet: Wallet;
    payload: object | undefined;
    chainId: number;
    type: T['type'];
  }): Promise<T & { status?: TransactionStatus; pending: boolean }> => {
    const { activeWallet, chainId, type } = params;
    const tx = params.tx as InitialEthTx;

    const from = activeWallet.address;
    const transaction = {
      chainId,
      hash: tx.hash,
      type,
      payload: params.payload,
      from,
    } as EthBaseTx;
    const txPool = this.get().addTXToPool(transaction, activeWallet.walletType);
    this.startTxTracking(tx.hash);
    return txPool[tx.hash];
  };

  startTxTracking = async (txKey: string) => {
    const tx = this.get().transactionsPool[txKey];
    const isPending = tx.pending;
    if (!isPending) {
      return;
    }

    this.stopPollingGnosisTXStatus(txKey);

    let retryCount = 5;
    const newGnosisInterval = setInterval(async () => {
      if (retryCount > 0) {
        const response = await this.fetchGnosisTxStatus(txKey);
        if (!response.ok) {
          retryCount--;
        }
      } else {
        this.stopPollingGnosisTXStatus(txKey);
        this.get().removeTXFromPool(txKey);
        return;
      }
    }, 5000);

    this.transactionsIntervalsMap[txKey] = Number(newGnosisInterval);
  };

  private fetchGnosisTxStatus = async (txKey: string) => {
    const tx = this.get().transactionsPool[txKey];
    const response = await fetch(
      `${
        SafeTransactionServiceUrls[tx.chainId]
      }/multisig-transactions/${txKey}/`,
    );
    if (response.ok) {
      const gnosisStatus = (await response.json()) as GnosisTxStatusResponse;

      const allTxWithSameNonceResponse = await fetch(
        `${SafeTransactionServiceUrls[tx.chainId]}/safes/${this.activeWallet
          ?.address}/multisig-transactions/?nonce=${gnosisStatus.nonce}`,
      );

      if (allTxWithSameNonceResponse.ok) {
        const sameNonceResponse =
          (await allTxWithSameNonceResponse.json()) as GnosisTxSameNonceResponse;

        const isPending =
          !gnosisStatus.isExecuted &&
          gnosisStatus.trusted &&
          sameNonceResponse.count <= 1;
        // check if more than a day passed and tx wasn't executed still, remove the transaction from the pool
        const gnosisStatusModified = dayjs(gnosisStatus.modified);
        const currentTime = dayjs();
        const daysPassed = currentTime.diff(gnosisStatusModified, 'day');
        if (daysPassed >= 1 && isPending) {
          this.stopPollingGnosisTXStatus(txKey);
          this.get().removeTXFromPool(txKey);
          return response;
        }

        if (sameNonceResponse.count > 1) {
          const replacedHash = sameNonceResponse.results.filter(
            (safeTx) => safeTx.safeTxHash !== gnosisStatus.safeTxHash,
          )[0].safeTxHash;

          this.updateGnosisTxStatus(txKey, gnosisStatus, replacedHash);
          this.stopPollingGnosisTXStatus(txKey);

          return response;
        }

        this.updateGnosisTxStatus(txKey, gnosisStatus);

        if (!isPending) {
          this.stopPollingGnosisTXStatus(txKey);
          this.get().txStatusChangedCallback(tx);
        }

        return response;
      } else {
        return response;
      }
    } else {
      return response;
    }
  };

  private stopPollingGnosisTXStatus = (txKey: string) => {
    const currentInterval = this.transactionsIntervalsMap[txKey];
    clearInterval(currentInterval);
    this.transactionsIntervalsMap[txKey] = undefined;
  };

  private updateGnosisTxStatus = (
    txKey: string,
    statusResponse: GnosisTxStatusResponse,
    replacedHash?: string,
  ) => {
    this.set((state) =>
      produce(state, (draft) => {
        const tx = draft.transactionsPool[txKey] as PoolEthTx;

        if (
          statusResponse.isExecuted ||
          !statusResponse.trusted ||
          !!replacedHash
        ) {
          tx.status = statusResponse.isSuccessful
            ? TransactionStatus.Success
            : !!replacedHash
            ? TransactionStatus.Replaced
            : TransactionStatus.Reverted;
        }

        tx.pending =
          !statusResponse.isExecuted && statusResponse.trusted && !replacedHash;
        tx.nonce = statusResponse.nonce;
        if (!!replacedHash) {
          tx.replacedTxHash = replacedHash;
        }
      }),
    );
    setLocalStorageTxPool(this.get().transactionsPool);
  };
}

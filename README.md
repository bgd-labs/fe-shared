# FE Shared repo

IMPORTANT REPO IN ALFA STATE

The purpose of this repo is to have shared solutions for typical web3 related problems.

Transactions, signing, provider etc

### Limitations

This is not a 1 size fit all library and more like a set of recipies to be used across multiple BGD projects. All solutions heavily rely on BGD tech stack, such as `ethers.js` `zustand` `web3-react` outside this stack using BGD solutions will be a problem and repo is provided as is. Feel free to use it as example

### Requirements

Each solution should provide a complete flow with clear boundaries and entry point for custom logic

---

## Web3Slice and TransactionsSlice

Although it is possible to use both of these slices separately, it’s unrealistic scenario.

*Transaction observer flow*

First we need to define callbackObserver like so

```typescript
...createTransactionsSlice<TransactionsUnion>({
    callbackObserver: (tx) => {
      switch (tx.type) {
        case "somethingNotVeryImportantHappened":
          console.log(tx.payload.buzz);
          return;
        case "somethingImportantHappened":
          console.log(tx.payload.fuzz);
          return;
      }
    },
  })(set, get),
```

`TransactionUnion`  will be different for each application and is used to associate payload type by transaction type

and `providers: Record<number, ethers.providers.JsonRpcProvider>;`

Providers will be used to watch tx on multiple chains if needed.

`transactionSlice`  is used as a “black box” it will add, wait, save to localstorage and do all the necessary logic to check for network switch

To make it all work, each tx should go through `.executeTx`  callback. It’s fire and forget flow at the end `callbackObserver`  will fire tx with type ‘wear’, custom payload and all the data from transaction

```typescript
const tx = await get().executeTx({
      body: () => {
        return get().boredNFTService.wear(tokenID, {
          location: collectionAddress,
          id: svgId,
        });
      },
      params: {
        type: 'wear',
        payload: { tokenID, collectionAddress },
      },
    });
```

## Web3Slice

Web3Slice is a set of ready solutions to work with web3-react

[GitHub - NoahZinsmeister/web3-react: A simple, maximally extensible, dependency minimized framework for building modern Ethereum dApps](https://github.com/NoahZinsmeister/web3-react)

It will do appropriate logic to handle different connectors type and save the required states to zustand store

Since web3-react properties are only available through React.Context. Custom <Web3Provider /> is required to make web3Slice work

Example of how to use <Web3Provider /> in your own app

`yourapp/web3Provider.tsx` →

```typescript
const connectors: [
  MetaMask | WalletConnect | CoinbaseWallet | ImpersonatedConnector,
  Web3ReactHooks
][] = [
  [metaMask, metaMaskHooks],
  [walletConnect, walletConnectHooks],
  [coinbaseWallet, coinbaseWalletHooks],
  [impersonatedConnector, impersonatedHooks],
];

export default function Web3Provider() {
  const setActiveWallet = useStore((state) => state.setActiveWallet);
  const changeChainID = useStore((state) => state.changeActiveWalletChainId);
  return (
    <Web3BaseProvider
      connectors={connectors}
      setActiveWallet={setActiveWallet}
      changeChainID={changeChainID}
    />
  );
}
```

`yourapp/App.tsx`  →

```typescript
function MyApp({ Component, pageProps }: AppProps) {
  // TODO: execute only on client side for now
  const initDefaultWallet = useStore((state) => state.initDefaultWallet);
  const initTransactionPool = useStore((state) => state.initTxPool);

  useEffect(() => {
    if (typeof window !== undefined) {
      void initDefaultWallet();
      void initTransactionPool();
    }
  }, []);

  return (
    <Fragment>
      <Web3Provider />
      <Component {...pageProps} />
    </Fragment>
  );
}

export default MyApp;
```

Once the setup is done you can finally initialize web3Slice

```typescript
...createWeb3BaseSlice({
    walletConnected: () => {
      get().connectSigner();
    },
    metamask: metaMask,
    coinbaseWallet: coinbaseWallet,
    walletConnect: walletConnect,
    impersonatedConnector: impersonatedConnector,
    getAddChainParameters,
  })(set, get),
```

metmask, coinbaseWallet, walletConnect and impersonatedConnector are all web3-react connectors type

wallet connected is a callback which will be executed once wallet is connected, meaning get().activeWallet is set.

All the logic is going **through** store and **NOT** through web3-react hooks

After all the init steps are done, you can finally use

`const connectWallet = useStore((state) => state.connectWallet);`

---


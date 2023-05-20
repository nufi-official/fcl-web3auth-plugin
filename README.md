# fcl-web3auth-plugin

[![npm version](https://badge.fury.io/js/fcl-web3auth-plugin.svg)](https://badge.fury.io/js/fcl-web3auth-plugin)

## Description

This package is a plugin for dapps on Flow blockchain which already use [FCL](https://github.com/onflow/fcl-js). It enables users to login in through popular social login providers such as Google, Facebook, Discord and others. With [couple of lines of code](https://github.com/nufi-official/walletless-flow/pull/12), allow your users to onboard more easily through social login of their choice and keep your FCL integration untouched. Find more about web3Auth [here](https://web3auth.io/).

## Installation

```bash
npm install fcl-web3auth-plugin
```

or

```bash
yarn add fcl-web3auth-plugin
```

## API Reference

### `init(args: InitArgs): void`

Initialize the package with the specified arguments.

- `clientId`: The client ID for authentication. [Create a web3auth account](https://dashboard.web3auth.io/) (it's free) and create a project. Choose your project name, pick environment (`network` parameter), choose for "Chain" select "Any other chain". You will get a client id specific your application.
- `network`: The Web3AuthNetwork to connect to (`mainnet` or `testnet`)
- `mfaLevel` (optional): The MFA (Multi-Factor Authentication) level. Default: `'none'`.
- `uxMode` (optional): The UX (User Experience) mode. Default: `'popup'`.

**NOTE:** call this function basically as soon as possible, ideally in a `useEffect` or somewhere else when the `window` object is available

**Examples**

```javascript
export default function MyApp() {
  useEffect(() => {
    config({
      clientId: 'your_key'
      networkType: 'testnet',
    })
  }, [])
  return <App />
}
```

### `auth(args?: AuthArgs): Promise<void>`

Authenticate the user.

- `args` (optional): An object specifying the authentication arguments.
  - If `args` contains a `loginProviderWhiteList` property, the user will be shown a login modal with the specified login provider whitelist (ordered).
  - If `args` are `undefined`, the user will be shown a login modal with all login options.

**Examples**

In case you want to use the default UI

```html
import {auth} from 'fcl-web3auth-plugin'
...
...
<div>
  <button onClick={() => auth()}>
    Log in
  </button>
</div>
```

### `authWithProvider(loginProvider: Web3AuthLoginProvider): Promise<void>`

Authenticate the user with selected login provider.

- user will be authenticated using the specified `Web3AuthLoginProvider`.

In case you want to use your own UI

```html
import {auth, loginProviders} from 'fcl-web3auth-plugin'
...
...
<div>
  {loginProviders.map(({loginProvider, name}) => {
    return (
      <button onClick={() => auth(loginProvider)}>
        {name}
      </button>
    )
  }}}
</div>
```

### `loginProviders: Web3AuthLoginProvider[]`

An array of available login providers. Handy if you want to have your own UI for the login options or if you want display more info about them.

### `setCallbacks(callbacks: Partial<WalletActionsCallbacks>): void`

Configure the package with the specified callbacks.

- `callbacks`: An object containing partial implementations of the `WalletActionsCallbacks` interface.
- it allows you to call you own actions instead of the default ones
- when and account is being created, (which might take a while and for this reason a default loading overlay is provided)
- when signing transactions

**NOTE:** calling `setCallbacks` is optional, in case you are fine with using the default UI you do not need to call it

**Examples**

If you want to disable confirm popup

```javascript
import {setCallbacks} from 'fcl-web3auth-plugin'
...
setCallbacks({
  confirmSign: (onSign) => {
    return onSign()
  },
})
```

### `experimentalLinkAccount(args: LinkAccountArgs): Promise<string>`

Experimental feature, not production ready, waiting for the official standard for hybrid custody to be finalized

- submits two transaction, first a child account (web3Auth account) publishes its auth account capability to parent address, then parent (a regular wallet like NuFi, Lilico) submits a transaction claiming the capability

## Key derivation

Keys are derived according to [FLIP-200](https://github.com/onflow/flow/pull/200)

- get `seed` from web3auth
- derive bip32 keypair using `m/44'/539'/0'/0/0` path
- use `secp256k1` derivation curve
- use `SHA2` hashing algorithm

## Examples

Check KittyItems demo app [here](https://wallet.nu.fi/).
Check the repo [here](https://github.com/nufi-official/walletless-flow/pull/12)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
import {Web3AuthProviderMetadata} from '../types'
import {Web3AuthLoginProvider} from '../web3auth/types'

const getLoginProviderButtonInnerHtml = (
  serviceName: string,
  imgSrc: string,
) => `
  <div style="padding: 0.75rem;">
    <div>
      <div style="display: flex;-webkit-box-align: center;align-items: center;">
        ${imgSrc ? `<img src="${imgSrc}" style="width: 3rem;height: 3rem;">` : ''}
        <b style="margin-inline: 0.5rem 0px;">${serviceName}</b>
      </div>
    </div>
  </div>
`

const modalInnerHtml = `
  <button class="close-button" type="button" aria-label="Close" style="cursor: pointer;display: flex;-webkit-box-align: center;align-items: center;-webkit-box-pack: center;justify-content: center;width: 2rem;height: 2rem;font-size: 0.75rem;position: absolute;top: 0.5rem;right: 0.75rem;">
    <svg viewBox="0 0 24 24" focusable="false" style="width: 1em;height: 1em;display: inline-block;line-height: 1em;flex-shrink: 0;color: currentcolor;vertical-align: middle;" aria-hidden="true">
      <path fill="currentColor" d="M.439,21.44a1.5,1.5,0,0,0,2.122,2.121L11.823,14.3a.25.25,0,0,1,.354,0l9.262,9.263a1.5,1.5,0,1,0,2.122-2.121L14.3,12.177a.25.25,0,0,1,0-.354l9.263-9.262A1.5,1.5,0,0,0,21.439.44L12.177,9.7a.25.25,0,0,1-.354,0L2.561.44A1.5,1.5,0,0,0,.439,2.561L9.7,11.823a.25.25,0,0,1,0,.354Z">
      </path>
    </svg>
  </button>
  <style>
    .provider-list::-webkit-scrollbar {
      display: none;
    }
    .provider-list {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  </style>
  <div style="padding-inline-start: 1.5rem;padding-inline-end: 1.5rem;padding-top: 1.25rem;padding-bottom: 1.25rem;">
    <div>
      <div class="provider-list" style="padding-inline-start: 1rem;padding-inline-end: 1rem;padding-top: 1.25rem;padding-bottom: 1.25rem;max-height: 38rem;overflow: overlay;">
        <div style="display: flex;flex-direction: column;" class="wallet-provider-list">
        </div>
      </div>
    </div>
  </div>
`

export type CreateModalArgs = {
  loginProvidersMetadata: Web3AuthProviderMetadata[]
  onAuthWithProvider: (loginProvider: Web3AuthLoginProvider) => Promise<unknown>
  onClose: () => unknown
  onLogin: () => unknown
}

export const createLoginModal = ({
  loginProvidersMetadata,
  onAuthWithProvider,
  onClose,
  onLogin,
}: CreateModalArgs) => {
  const modal = window.document.createElement('section')
  modal.style.cssText =
    'display: flex;flex-direction: column;position: relative;width: 100%;border-radius: 0.375rem;background: #FFFFFF;margin-top: 4rem;margin-bottom: 4rem;z-index: 1400;box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),0 4px 6px -2px rgba(0, 0, 0, 0.05);max-width: 28rem;'
  modal.innerHTML = modalInnerHtml

  const buttons = loginProvidersMetadata.map(({name, icon, loginProvider}) => {
    const button = window.document.createElement('button')
    button.innerHTML = getLoginProviderButtonInnerHtml(name, icon)
    button.style.cssText =
      'margin-top: 10px;margin-bottom: 10px;background: transparent;cursor: pointer;background-color: #FFFFFF;box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12),0 1px 2px 0 rgba(0, 0, 0, 0.16);border-radius: 0.25rem;'

    button.onclick = () => {
      onLogin()
      onAuthWithProvider(loginProvider).then(() => onClose())
    }
    return button
  })
  const walletProviderList = modal.getElementsByClassName(
    'wallet-provider-list',
  )[0]
  buttons.forEach((b) => walletProviderList.append(b))
  const closeButton = modal.getElementsByClassName(
    'close-button',
  )[0] as HTMLButtonElement
  closeButton.onclick = onClose

  return modal
}

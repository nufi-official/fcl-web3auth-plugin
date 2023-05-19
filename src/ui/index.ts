import {createConfirmPopup} from './confirmPopup'
import {createFailText} from './fail'
import {createLoadingSpinner} from './loadingSpinner'
import {CreateModalArgs, createLoginModal} from './modal'
import {createSuccessText} from './success'
import {SigningMetadata} from './types'

const overlayInnerHtml = `
<div>
  <div style="position: fixed;left: 0px;top: 0px;width: 100vw;height: 100vh;z-index: 1000;background: rgba(0, 0, 0, 0.16);backdrop-filter: blur(6px);"></div>
  <div>
    <div class="overlay-body" style="display: flex;width: 100vw;height: 100%;position: fixed;left: 0px;top: 0px;z-index: 1001;-webkit-box-pack: center;justify-content: center;-webkit-box-align: center;align-items: center;overflow: auto;overscroll-behavior-y: none;" tabindex="-1">
    </div>
  </div>
</div>
`

const createOverlayElement = () => {
  const overlay = window.document.createElement('div')
  overlay.innerHTML = overlayInnerHtml

  return {
    close: () => overlay.remove(),
    show: () => window.document.body.append(overlay),
    replaceBody: (node: HTMLElement) =>
      overlay.getElementsByClassName('overlay-body')[0].replaceChildren(node),
  }
}

const createUi = () => {
  const overlay = createOverlayElement()

  const showLoginModal = (
    args: Omit<CreateModalArgs, 'onClose' | 'onLogin'>,
  ) => {
    overlay.show()
    const onLogin = () => {
      const loadingSpinner = createLoadingSpinner('Logging in...')
      overlay.replaceBody(loadingSpinner)
    }
    overlay.replaceBody(
      createLoginModal({...args, onClose: overlay.close, onLogin}),
    )
  }

  const showLoading = (loadingText: string) => {
    overlay.show()
    const loadingSpinner = createLoadingSpinner(loadingText)
    overlay.replaceBody(loadingSpinner)
  }

  const showSuccess = (successText: string) => {
    overlay.show()
    const success = createSuccessText(successText)
    overlay.replaceBody(success)
  }

  const showFail = (failText: string) => {
    overlay.show()
    const fail = createFailText(failText)
    overlay.replaceBody(fail)
  }

  const confirmSign = (
    onSign: () => Promise<string>,
    metadata: SigningMetadata,
  ) => {
    overlay.show()
    const {popup, confirmPromise} = createConfirmPopup({
      metadata,
      onSign,
      onClose: overlay.close,
    })
    overlay.replaceBody(popup)
    return confirmPromise
  }

  return {
    showLoginModal,
    showLoading,
    close: overlay.close,
    confirmSign,
    showSuccess,
    showFail,
  }
}

let ui: ReturnType<typeof createUi> | undefined

export const getUi = () => {
  if (!ui) {
    ui = createUi()
  }
  return ui
}

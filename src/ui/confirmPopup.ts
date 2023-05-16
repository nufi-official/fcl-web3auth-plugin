import {SigningMetadata} from './types'

const getConfirmPopupInnerHtml = (confirmText: string) => `
<section style="display: flex; flex-direction: column; position: relative; width: 100%; border-radius: 0.375rem; background: rgb(255, 255, 255); margin-top: 4rem; margin-bottom: 4rem; z-index: 1400; box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px; max-width: 27rem;">
  <div style="padding-inline-start: 0.5rem;padding-inline-end: 0.5rem;padding-top: 0.25rem;padding-bottom: 0.25rem;">
    <div>
      <div style="padding-inline-start: 1rem;padding-inline-end: 1rem;padding-top: 1.25rem;padding-bottom: 1.25rem;">
        <b style="display: flex;justify-content: center;font-family: arial;margin-bottom: 12px">${confirmText}</b>
        <div style="display: flex;flex-direction: row;justify-content:center" class="wallet-provider-list">
          <button class="confirm-button" style="min-width: 7rem;flex: 1;margin-left: 12px;margin-right: 12px;;margin-top: 10px; margin-bottom: 2epx; background: rgb(255, 255, 255); cursor: pointer; box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px 0px, rgba(0, 0, 0, 0.16) 0px 1px 2px 0px; border-radius: 0.25rem;">
            <div style="display: flex;justify-content:center;-webkit-box-align: center;align-items: center;padding: 0.75rem;">
              <b>Confirm</b>
            </div>
          </button>
          <button class="reject-button" style="min-width: 7rem;flex: 1;margin-left: 12px;margin-right: 12px;;margin-top: 10px; margin-bottom: 2epx; background: rgb(255, 255, 255); cursor: pointer; box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px 0px, rgba(0, 0, 0, 0.16) 0px 1px 2px 0px; border-radius: 0.25rem;">
            <div style="display: flex;justify-content:center;-webkit-box-align: center;align-items: center;padding: 0.75rem;">
              <b>Reject</b>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
`

export type CreateConfirmPopupArgs = {
  onSign: () => Promise<string>
  onClose: () => unknown
  metadata: SigningMetadata
}
export const createConfirmPopup = ({
  onSign,
  onClose,
  metadata,
}: CreateConfirmPopupArgs) => {
  const confirmPopup = window.document.createElement('div')
  confirmPopup.innerHTML = getConfirmPopupInnerHtml(
    metadata.type === 'message' ? 'Sign message?' : 'Sign transaction?',
  )

  const confirmButton = confirmPopup.getElementsByClassName('confirm-button')[0]

  const rejectButton = confirmPopup.getElementsByClassName('reject-button')[0]

  return {
    confirmPromise: new Promise<string>((resolve, reject) => {
      confirmButton.addEventListener('click', async () => {
        onClose()
        resolve(await onSign())
      })
      rejectButton.addEventListener('click', () => {
        onClose()
        reject()
      })
    }),
    popup: confirmPopup,
  }
}

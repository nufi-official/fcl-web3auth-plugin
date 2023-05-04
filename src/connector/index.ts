import {Api} from './api'
import {isExtensionServiceInitiationMessage, isMessage} from './utils'

export const listenToMessages = (api: Api): void => {
  window.addEventListener('message', async (e) => {
    const msg = e.data
    const response = await (async () => {
      if (isExtensionServiceInitiationMessage(msg)) {
        return api.extensionServiceInitiationMessage(msg)
      } else if (isMessage(msg) && msg.type === 'FCL:VIEW:READY:RESPONSE') {
        return await api.message(msg)
      }
      return null
    })()
    if (response != null) {
      window.postMessage(response)
    }
  })
}

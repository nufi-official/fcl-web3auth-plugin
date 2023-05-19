const getLoadingSpinnerInnerHtml = (initialLoadingText: string) => `
  <div>
    <style>
      .spinner-border {
        display: inline-block;
        width: 2rem;
        height: 2rem;
        vertical-align: text-bottom;
        border: 0.25em solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        -webkit-animation: spinner-border .75s linear infinite;
        animation: spinner-border .75s linear infinite;
        color: white;
      }

      @-webkit-keyframes spinner-border {
        from {
          -webkit-transform: rotate(0deg);
          transform: rotate(0deg);
        }

        to {
          -webkit-transform: rotate(359deg);
          transform: rotate(359deg);
        }
      }

      @keyframes spinner-border {
        from {
          -webkit-transform: rotate(0deg);
          transform: rotate(0deg);
        }

        to {
          -webkit-transform: rotate(359deg);
          transform: rotate(359deg);
        }
      }

    </style>
  </div>
  <div class="spinner-border"></div>
  <b class="loading-text" style="margin-inline: 0.5rem 0px;color: white;">${initialLoadingText}</b>
`

export const createLoadingSpinner = (initialLoadingText: string) => {
  const loadingSpinner = window.document.createElement('div')
  loadingSpinner.style.cssText = 'display: flex;align-items: center;'
  loadingSpinner.innerHTML = getLoadingSpinnerInnerHtml(initialLoadingText)
  return loadingSpinner
}

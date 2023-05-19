const getSuccessIconSvgInnerHtml = (successText: string) =>
  `<svg class="svg-icon" style="width: 2rem; height: 2rem;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M469.333333 640l0.384 0.384L469.333333 640z m-106.282666 0l-0.384 0.384 0.384-0.384z m48.512 106.666667a87.466667 87.466667 0 0 1-61.653334-24.874667l-179.52-173.632a67.797333 67.797333 0 0 1 0-98.24c28.032-27.157333 73.493333-27.157333 101.589334 0l139.584 134.997333 319.168-308.544c28.032-27.157333 73.493333-27.157333 101.589333 0a67.925333 67.925333 0 0 1 0 98.24L472.981333 722.069333A87.530667 87.530667 0 0 1 411.562667 746.666667z" fill="#78C326" /></svg><b class="loading-text" style="margin-inline: 0.5rem 0px;color: white;"><b>${successText}</b>`

export const createSuccessText = (successText: string) => {
  const svgSuccessIcon = window.document.createElement('div')
  svgSuccessIcon.style.cssText = 'display: flex;align-items: center;'
  svgSuccessIcon.innerHTML = getSuccessIconSvgInnerHtml(successText)
  return svgSuccessIcon
}

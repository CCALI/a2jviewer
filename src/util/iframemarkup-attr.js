import canViewCallbacks from 'can-view-callbacks'

canViewCallbacks.attr('iframemarkup', function (element, attrData) {
  const scopePath = element.getAttribute(attrData.attributeName)
  const markup = attrData.scope.get(scopePath)

  // The delay is required because element.contentWindow.document
  // is not available until the iframe is in the DOM.
  setTimeout(() => {
    const frameDocument = element.contentWindow.document
    frameDocument.open()
    frameDocument.write(markup)
    frameDocument.close()

    // Set the title
    const titleElement = frameDocument.querySelector('title')
    if (titleElement && titleElement.textContent) {
      element.setAttribute('title', titleElement.textContent)
    }
  }, 0)
})

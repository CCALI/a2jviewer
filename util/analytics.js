function initialize (authorId) {
  window._paq = window._paq || []
  window._paq.push(['enableHeartBeatTimer', 30])
  window._paq.push(['enableLinkTracking'])
  window._paq.push(['setSessionCookieTimeout', 300])

  setAuthorId(authorId)
  // track hash changes as page changes
  handleHashChanges()
  // inserts piwik.js script tag into demo/viewer/viewer.html
  generatePiwikScriptTag('https://analytics.a2jauthor.org/', '5')
}

function trackPageView (title, url) {
  window._paq.push(['setDocumentTitle', title])
  window._paq.push(['setCustomUrl', url])
  window._paq.push(['trackPageView'])
}

function trackCustomEvent (category, action, name, value) {
  // signature: _paq.push([trackEvent, category, action, [name], [value]])
  // example: _paq.push([trackEvent, 'Learn-More', 'opened', currentPage, learnMoreTitle])
  window._paq.push(['trackEvent', category, action, name, value])
}

function trackExitLink (url) {
  window._paq.push(['trackLink', url, 'link'])
}

function setAuthorId (id) {
  window._paq.push(['setCustomDimension', 1, id])
}

export const analytics = {
  initialize,
  trackPageView,
  trackCustomEvent,
  trackExitLink,
  setAuthorId
}

/**
 * HELPER FUNCTIONS
 */

function handleHashChanges () {
  // this code is for tracking single page hash changes as page changes
  var currentUrl = window.location.href
  window.addEventListener('hashchange', function () {
    window._paq.push(['setReferrerUrl', currentUrl])
    currentUrl = window.location.href
    // this can fine tuned with window.location.hash.(indexOf('page/')) + 5 to get the simple page name
    var hostName = window.location.hostname
    var pageHash = window.location.hash
    var searchStr = 'page/'
    var pageName = pageHash ? pageHash.substr(pageHash.indexOf(searchStr) + 5) : 'unnamed page'
    window._paq.push(['setDocumentTitle', hostName + ': ' + pageName])

    window._paq.push(['setGenerationTimeMs', 0])
    window._paq.push(['trackPageView'])
  })
}

function generatePiwikScriptTag (dashboardUrl, siteId) {
  window._paq.push(['setTrackerUrl', dashboardUrl + 'piwik.php'])
  window._paq.push(['setSiteId', siteId])
  var d = document
  var g = d.createElement('script')
  var s = d.getElementsByTagName('script')[0]
  g.type = 'text/javascript'
  g.async = true
  g.defer = true
  g.src = dashboardUrl + 'piwik.js'
  s.parentNode.insertBefore(g, s)
}

/*
  GhostHistory is built from a serialzied VisitedPages pojo that was stored in the interview's answers.
  GhostHistory is only used when VisitedPages hydrate() has rejected the serialized pojo.
  VisitedPages hydrate() rejects the pojo when the key doesn't match the current interview.
  :: The key is these interview props joined: [title, authorId, version, publishedVersion].join('-')

  The purpose of GhostHistory is to use the serialized information to highlight buttons if the
  history is similar to the current interview. (like when the only difference was publishedVersion)
*/

export class GhostHistory {
  constructor (init) {
    Object.assign(this, {
      serializedVisitedPages: [],
      expectNextPageNameToBe: '',
      nextActiveIndex: 0,
      memoize: new WeakMap(),
      // if GhostHistory has reached the end of its activeSerializedList or stops trying,
      // this will be true so it can be freed from whatever's listening
      finished: false
    }, init)

    this.activeSerializedList = this.extractActiveSerializedList(this.serializedVisitedPages)
    if (!this.expectNextPageNameToBe) {
      const ghostRoot = this.activeSerializedList[0]
      this.expectNextPageNameToBe = ghostRoot.interviewPage
    }

    return this
  }

  letGo () {
    this.serializedVisitedPages = []
    this.expectNextPageNameToBe = undefined
    this.memoize = undefined
    this.finished = true
  }

  extractActiveSerializedList (svp) {
    const reversedActiveHistory = []
    let treeNode = svp[svp.length - 1] // active leaf
    while (treeNode) {
      reversedActiveHistory.push(treeNode)
      treeNode = svp[treeNode.parentVisitedPage]
    }

    return reversedActiveHistory.reverse()
  }

  // This is the whole purpose of GhostHistory, it tries to report what button on the current page might have been used
  // returns undefined or an index >= 0
  suggestNextButtonIndex (currentVisitedPage) {
    if (this.finished || !currentVisitedPage || this.memoize.has(currentVisitedPage)) {
      return this.memoize.get(currentVisitedPage)
    }
    // memoizing here so we never re-run this twice on the same page because we progressively track what the next page should be
    this.memoize.set(currentVisitedPage, undefined) // will be updated to an index if we can determine one here

    const cip = currentVisitedPage.interviewPage
    const currentPageName = cip.name || ''
    const activeSerializedList = this.activeSerializedList

    const rootReached = this.nextActiveIndex > 0

    if (this.expectNextPageNameToBe !== currentPageName) {
      /* if (rootReached) {
        // this ghost history is not sync'd with the user's navigation through the interview, stop trying
        // TODO: maybe let this happen once before letting go?
        this.letGo()
        return
      } else {
        // this interview doesn't map to ghost history (yet)
        // TODO: add a counter here and stop trying aftr a certain threshhold? Maybe 3?
        return
      } */
      rootReached && this.letGo()
      return
    }
    // we're on the expected page
    this.nextActiveIndex = this.nextActiveIndex + 1

    const nextSerializedNode = activeSerializedList[this.nextActiveIndex]
    if (!nextSerializedNode) {
      // no ghosts exist in the future, GhostHistory's unfinished business has finished
      this.letGo()
      return
    }

    const nextPageName = nextSerializedNode.interviewPage
    this.expectNextPageNameToBe = nextPageName

    const buttons = cip.buttons || []

    if (nextSerializedNode.parentButtonUsedIndex > -1) {
      const button = buttons[nextSerializedNode.parentButtonUsedIndex] || {}
      if (button.next === nextPageName) {
        // High Confidence suggestion
        const x = buttons.indexOf(button)
        this.memoize.set(currentVisitedPage, x)
        return x
      }
    }

    const matchingButton = buttons.filter(b => b.next === nextPageName).pop()

    if (matchingButton) {
      // mid confidence suggestion
      // TODO: we probably don't want to allow this to happen more than once or twice
      const x = buttons.indexOf(matchingButton)
      this.memoize.set(currentVisitedPage, x)
      return x
    }

    // else we don't want to suggest anything here due to low confidence.
    // However, it might be logic that takes us to the next expected page
    // so GhostHistory's business is unfinished since the user may end up
    // landing on the expected page anyway and we can keep on suggesting.
    // (when this doesn't return a value, pages-vm could check for GOTOs)

    // return
  }
}

export default GhostHistory

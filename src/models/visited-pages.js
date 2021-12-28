import _findIndex from 'lodash/findIndex'
import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import formatDisplayText from '~/src/util/format-display-text'
import FuturePages from './future-pages'

// interview pages (appState.interview.pages[x]) can be shown any number of times during the interview when it repeats.
// Visted Pages are repeat-loop-itterations of a page from the interview;
// VPs track the itteration values that specify where in the loop we are. The list of VPs is a history of where the user has been.
// If the interview page is not visited inside a loop, there should only ever be one corresponding visit to it in the active branch.
// If two different paths are taken to, for example, the same last page: Both appear in the full list but only one per timeline branch.
// The answers on a page visited in two timelines will be exactly the same and changing it in one alters the other (for now...)
// (this is because answers were implemented to match the final expected export structure, which isn't flexible and doesn't allow branches
// because they're meant to be rendered in a single pdf/document...)

// In a hypothetical major refactor or rewrite:
// Storing the user's provided answers on each visitedPage instead could allow more branching and then decisions on
// how to *finalize* their answers could be made at the end, which then exports to the expected, linear, answer set.
// (essentially it would allow them to approach their answers multiple ways and hotswap for the best conclusion)

// Currently, to fit with the linear answers model, the only way to cause a branch is to nav to the past and use a different button
export const VisitedPage = DefineMap.extend('VisitedPage', {
  // reference to the page from the current interview that this visitedPage is an itteration of
  interviewPage: {},

  // reference to shared logic instance
  logic: {},

  // reference to shared answers instance
  answers: {},

  // itteration values. TODO: Always number type?
  repeatVarValue: {},
  outerLoopVarValue: {},

  skipped: {
    type: 'boolean',
    default: false
  },

  stepNumber: {
    get () {
      return parseInt(this.interviewPage.step.number)
    }
  },

  questionNumber: {
    get () {
      const stepNumber = this.stepNumber
      let pvp = this.parentVisitedPage
      while (pvp) {
        if (pvp.stepNumber === stepNumber) {
          return pvp.questionNumber + 1
        }
        pvp = pvp.parentVisitedPage
      }
      return 1
    }
  },

  // displayed title data of this visitedPage
  display: {
    get () {
      // re-eval if answer values have updated via beforeCode
      const answersChanged = this.answers && this.answers.serialize() // eslint-disable-line
      const questionText = this.interviewPage.text || ''
      // logic needs to be refactored from the old global into a util module. passing it context for the ORDINAL helper
      // and other macros would require modifying much of the legacy callstack. This is not a proper way to do this but
      // after discussing it, we've decided it's the best option we have without taking on the whole refactor to fix it
      window._macrosLoopContext = {}
      const { repeatVar, outerLoopVar } = this.interviewPage
      if (repeatVar) {
        window._macrosLoopContext[repeatVar.toUpperCase()] = this.repeatVarValue
      }
      if (outerLoopVar) {
        window._macrosLoopContext[outerLoopVar.toUpperCase()] = this.outerLoopVarValue
      }

      const resolvedText = this.logic && this.logic.eval(questionText)

      window._macrosLoopContext = undefined

      return formatDisplayText({
        name: this.interviewPage.name,
        text: resolvedText || questionText,
        repeatVarValue: this.repeatVarValue,
        stepNumber: this.stepNumber,
        questionNumber: this.questionNumber
      })
    }
  },
  // when hydrated: this is a reference to the visitedPage the user was on when this visited page was created (undefined on root/intro)
  // when serialized: this is the visitedPages index of its parent node (serialized into PAGEHISTORY answer)
  // This opens the door to make each visited page a node in a tree with branches instead of a 1D-list-item to assist with future pages and time travel
  parentVisitedPage: {},
  // Which button was pressed is ambiguous because of var setting buttons, goto logic, and logic that changes answers.
  // This explicitly tracks which button was clicked on the previous visited page that lead to this visited page.
  // There is a best-guess fallback algorithm in pages-vm if this value is not present.
  parentButtonUsedIndex: {
    type: 'number',
    default: -1
  },
  // points to visited pages that come directly after this one.
  // The active branch will always be at branches.length - 1
  // This is not serialized, but is reconstructed on hydrate.
  // In a happy-path, this just points to the nextVisitedPage and there will only be 1 (or 0 on the last visited page),
  // time travel may cause additional branches though.
  branches: {
    serialize: false,
    default: () => []
  },
  // returns the tree's root
  setActive: function () {
    const pvp = this.parentVisitedPage
    if (pvp) {
      const i = pvp.branches.indexOf(this)
      if (i > -1 && i !== pvp.branches.length - 1) {
        pvp.branches.splice(i, 1)
        pvp.branches.push(this)
      }
      return (i === -1) ? this : pvp.setActive()
    }
    return this
  },
  // shortcust to the nextVisitedPage on the active timeline
  get nextVisitedPage () {
    return this.branches[this.branches.length - 1]
  },

  // how many pages in the future already happened after this visited page (not counting downstream pruned branches)
  get nextDepth () {
    const nvp = this.nextVisitedPage
    return nvp ? 1 + nvp.nextDepth : 0
  }
})

// vistedPages
// ##########################################################################################################
export const VisitedPages = VisitedPage.List = DefineList.extend('VisitedPages', {
  '#': VisitedPage,

  // REQUIRED PROPS in sharedRefs:
  // interview, logic, answers
  // currently this is just a reference to appState
  // (we can't pass the required refs in on new() directly because they don't exist yet)
  sharedRefs: {},

  // root of the tree / first page of the interview
  get root () {
    const i = this.length - 1
    return this[i]
  },

  // opposite of root, this is stored at index 0 if no timeline splitting has happened
  get activeLeaf () {
    let leaf = this.selected
    while (leaf && leaf.nextVisitedPage) {
      leaf = leaf.nextVisitedPage
    }
    return leaf
  },

  // Flat list of only active branch items; useful for dropdown bindings where selected option index needs to map to a specific vp.
  // Most of the time this will be a copy of visitedPages # items, but if there are branches, this will be a subset of those items.
  // For historical reasons, index 0 is the last active page and index length - 1 is the root. (same order the original list is in)
  get activeList () {
    const activeList = []
    let active = this.activeLeaf
    while (active) {
      activeList.push(active)
      active = active.parentVisitedPage
    }
    return activeList
  },

  // TODO: move these __getters to the interview model itself, probably (interview should be upgraded from the old can Map first)
  get __allInterviewPagesByName () {
    const sharedRefs = this.sharedRefs
    const pagesList = sharedRefs.interview.pages
    const pagesByName = pagesList.reduce((acc, p) => {
      acc[p.name] = p
      return acc
    }, {})
    return pagesByName
  },
  get __interviewKey () {
    const sharedRefs = this.sharedRefs
    const invw = sharedRefs.interview
    const key = (invw.attr('title') || '') +
      '-' + (invw.attr('authorId') || '') +
      '-' + (invw.attr('version') || '') +
      '-' + (invw.attr('publishedVersion') || '')
    return key
  },

  get futureVisitedPages () {
    let parentLeaf = this.activeLeaf // fake the parent rel into the tree without branching from the tree into the future visited pages
    if (!parentLeaf) {
      return []
    }
    const pagesByName = this.__allInterviewPagesByName
    const futurePages = new FuturePages({
      interviewPage: parentLeaf.interviewPage,
      interviewPagesByName: pagesByName
    })
    const futureInterviewPages = futurePages.futureInterviewPages
    const futureVisitedPages = futureInterviewPages.map(
      (fip, i) => parentLeaf = new VisitedPage({ // eslint-disable-line
        interviewPage: fip.interviewPage,
        answers: this.sharedRefs.answers,
        logic: this.sharedRefs.logic,
        parentVisitedPage: parentLeaf // allows Q number in the display text to work
      })
    )
    return futureVisitedPages
  },

  // current visited page. Can be set directly to any VisitedPage that's already in the tree
  selected: {
    set (visitedPage) {
      const shouldBeRoot = visitedPage && visitedPage.setActive()
      if (shouldBeRoot === this.root) {
        return visitedPage
      }
      return undefined
    }
  },

  get hasNext () {
    return !!(this.selected && this.selected.nextVisitedPage)
  },

  get hasParent () {
    return !!(this.selected && this.selected.parentVisitedPage)
  },

  // update state to next active page in the tree (user navigated to an earlier visitedPage and is going back to the future)
  selectNext () {
    const selected = this.selected
    if (selected && selected.nextVisitedPage) {
      this.selected = selected.nextVisitedPage
      return true
    }
    return false
  },

  // update state to previous active page in the tree (user is traveling to the past of the current active branch)
  selectParent () {
    const selected = this.selected
    if (selected && selected.parentVisitedPage) {
      this.selected = selected.parentVisitedPage
      return true
    }
    return false
  },

  // newInterviewPage the appState's currentPage; which is the first thing updated after the page routes changes
  // buttonUsedIndex is the button on the current interview page that was clicked to trigger this check
  // called from pages-vm tryToVisitPage() and pages-vm connectedCallback to visit the first page if there's no history to hydrate
  visit: function (newInterviewPage, buttonUsedIndex, flagAsSkipped = false) {
    // branches a new path or collapses the existing visitedPages timeline by returning the existing one with its existing answers
    // currently, it will always collapse if it's been to the page before on this timeline
    // (visiting a page itteration more than once via different timelines shows the same answers because answers model only allows it once)
    const visitCausedByButton = buttonUsedIndex > -1 // (as opposed to a visit caused by route/initial load)
    const answers = this.sharedRefs.answers
    const logic = this.sharedRefs.logic

    // handle whether a page is visited or re-visited
    const repeatVar = newInterviewPage.repeatVar
    const outerLoopVar = newInterviewPage.outerLoopVar
    const repeatVarValue = repeatVar ? logic.varGet(repeatVar) : undefined
    const outerLoopVarValue = outerLoopVar ? logic.varGet(outerLoopVar) : undefined
    const destinationMatchesVP = vp => (
      vp.interviewPage === newInterviewPage &&
      vp.repeatVarValue == repeatVarValue && // eslint-disable-line
      vp.outerLoopVarValue == outerLoopVarValue // eslint-disable-line
    )

    if (this.selected && destinationMatchesVP(this.selected)) {
      // bad buttons (that point to missing pages) might try to visit() the same current selected page.
      // No matter what called visit() though, if it results in the exact same visited page, ignore it.
      return
    }

    // NOTE: if the refactor/rewire mentioned in the comments at the top of this file ever happens,
    // new answers stored on this page may cuase branches too, currently they don't so it's
    // artificially collapsed and the final answers may not make sense if history was changed
    // (for example: add info for a 3rd child, go back and only enter 2 children, as it is now,
    // the 3rd still has answers in the export.)

    if (visitCausedByButton) {
      // a button on the current page was used to cause this visit, so collapse forward into existing branches if there's a match
      const selected = this.selected || {}
      const branchesBackToTheFuture = selected.branches || []
      const i = _findIndex(branchesBackToTheFuture, destinationMatchesVP)
      if (i > -1) {
        this.selected = branchesBackToTheFuture[i]
        return
      }
      // else it didn't match an immediate future so now we check if the button points backwards in visited history.
      // Going back one page isn't that common but it is explicitly allowed. Technically though, buttons might point
      // back to *any* page that already happened too (but not really back to inside of a loop (yet)). That extended
      // history-jump ability isn't well defined for buttons yet, so this may change based on author feedback/ideas.
      let previous = selected.parentVisitedPage
      while (previous) {
        if (destinationMatchesVP(previous)) {
          this.selected = previous
          return
        }
        previous = previous.parentVisitedPage
      }
      // if it reaches this point without returning, a new visited page will be made
    } else {
      // this visit wasn't from a button; it may be a route change or the initial load.
      if (this.selected && destinationMatchesVP(this.selected)) {
        // do not create a new visited page if the path (not from a button use) "changed" to the same current page
        // if a button caused it, this won't run but it's likely a self-looping page and a new vp will be created.
        return
      }

      // First, search all of the active branch for a match - routes might point to any page
      const activeList = this.activeList
      const activeIndex = _findIndex(activeList, destinationMatchesVP)
      if (activeIndex > -1) {
        this.selected = activeList[activeIndex]
        return
      }

      // if the visit is from a route change && there isn't an exisitng match in the active branch, check all other timelines too
      // (this is the previous behavior in ALL cases)
      // TODO: should we allow route navigation to place us in and reactivate an abandoned timeline? If yes, why? If no, delete this:
      const anyIndex = _findIndex(this, destinationMatchesVP)
      if (anyIndex > -1) {
        this.selected = this[anyIndex]
        return
      }
      // if it reaches this point without returning, a new visited page will be made
    }

    // create a new visited page
    // this is hopefully an initial page load so there's no button used index and activeList & visitedPages (this) are length 0
    // (it may instead be a weird manual navigation from author previews instead of an initial load)
    const currentVisitedPage = this.selected
    const newVisitedPage = new VisitedPage({
      interviewPage: newInterviewPage,
      answers: answers,
      logic: logic,
      repeatVarValue: repeatVarValue,
      outerLoopVarValue: outerLoopVarValue,
      parentButtonUsedIndex: buttonUsedIndex,
      parentVisitedPage: currentVisitedPage,
      skipped: flagAsSkipped === true
    })
    this.unshift(newVisitedPage)
    if (currentVisitedPage) {
      currentVisitedPage.branches.push(newVisitedPage)
    }
    this.selected = newVisitedPage
  },

  // flatten into an array for serialization, produces a list of visited pages in a meaningful order:
  // root is at index 0, then the most recently active branches have bigger indexes than previous timelines, activeLeaf is last.
  // on hydrate, this order allows each node's `branches` to be rebuilt in the same order they last appeared before serializing.
  // Note: the visitedPages list itself is reversed for historical reasons, so hydrate flips it back.
  flatten (flattened = [], vp = this.root) {
    flattened.push(vp)
    vp.branches.forEach(vp => {
      this.flatten(flattened, vp)
    })
    // if (vp === this.root) console.log(this.length, flattened.length, this.length === flattened.length)
    return flattened
  },

  serialize () {
    const vps = this.flatten()
    const indexes = new WeakMap()
    const selected = this.selected
    const key = this.__interviewKey

    const serializedVisitedPages = []
    vps.forEach((vp, i) => {
      indexes.set(vp, i)
      const svp = {
        interviewPage: vp.interviewPage.name,
        repeatVarValue: vp.repeatVarValue,
        outerLoopVarValue: vp.outerLoopVarValue,
        parentVisitedPage: indexes.get(vp.parentVisitedPage),
        parentButtonUsedIndex: vp.parentButtonUsedIndex
      }
      if (i === 0) { // root/firstpage
        svp.key = key // some way to identify that this serialized history belongs to the interview that's hydrating it
      }
      if (vp === selected) {
        svp.selected = true
      }
      if (vp.skipped === true) {
        svp.skipped = true
      }
      serializedVisitedPages.push(svp)
    })
    return serializedVisitedPages
  },

  hydrate (serializedVisitedPages) {
    this.length = 0
    let selected // = undefined
    const sharedRefs = this.sharedRefs
    const pagesByName = this.__allInterviewPagesByName
    const key = this.__interviewKey
    const hydratedVisitedPages = []

    serializedVisitedPages.every((svp, i) => {
      const p = pagesByName[svp.interviewPage]
      const isFirstPage = i === 0
      const historyIsForThisInterview = isFirstPage && svp.key === key && svp.interviewPage === sharedRefs.interview.attr('firstPage')
      if (!p || (isFirstPage && !historyIsForThisInterview)) {
        return false
      }
      const vp = new VisitedPage({
        interviewPage: p,
        answers: sharedRefs.answers,
        logic: sharedRefs.logic,
        repeatVarValue: svp.repeatVarValue,
        outerLoopVarValue: svp.outerLoopVarValue,
        parentButtonUsedIndex: svp.parentButtonUsedIndex,
        skipped: !!svp.skipped
      })
      hydratedVisitedPages.push(vp)
      if (svp.selected) {
        selected = vp
      }
      // ipvp = index of parent visited page. On serialize, the references are converted to indexes of the parent within the serialized array
      const ipvp = svp.parentVisitedPage
      // every serialized parent has a lower index than all its further decendants, so if this has a parent, the parent is already hydrated
      const parentVisitedPage = hydratedVisitedPages[ipvp]
      if (parentVisitedPage) {
        vp.assign({ parentVisitedPage: parentVisitedPage })
        parentVisitedPage.branches.push(vp) // last-active-path will be at branches length - 1
      }
      // the underlying in-memory list is reversed for historical reasons
      this.unshift(vp)
      return true
    })

    this.selected = selected || hydratedVisitedPages[hydratedVisitedPages.length - 1]
    return !!this.selected
  }
})

export default VisitedPages

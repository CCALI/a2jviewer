import compute from 'can-compute'

const mql = window.matchMedia('only screen and (max-width: 768px)')
let forceMobile = false

export default compute(mql.matches, {
  get: function () {
    if (forceMobile) return forceMobile
    return mql.matches
  },

  set: function ({forceMobileViewer}) {
    forceMobile = forceMobileViewer
    return forceMobileViewer
  },

  on: function (updated) {
    mql.addListener(updated)
  },

  off: function (updated) {
    mql.removeListener(updated)
  }
})

import compute from 'can-compute'

let mql = window.matchMedia('only screen and (max-width: 768px)')

export default compute(mql.matches, {
  get: function () {
    return mql.matches
  },

  set: function () {},

  on: function (updated) {
    mql.addListener(updated)
  },

  off: function (updated) {
    mql.removeListener(updated)
  }
})

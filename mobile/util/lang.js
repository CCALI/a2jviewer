import DefineMap from 'can-define/map/map'
import TLang from 'a2jviewer/mobile/util/tlang'
import cString from 'a2jviewer/mobile/util/string'

export default DefineMap.extend({
  seal: false
},
{
  init: function (id) {
    var o = {}

    TLang(o, cString.makestr.bind(cString)).set(id)
    return this.assign(o)
  }
})

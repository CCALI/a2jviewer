import $ from 'jquery'

export default function setMobileDesktopClass (isMobileCompute, $element) {
  let isMobile = isMobileCompute()
  let $el = $element || $('body')

  let toggleClassName = function (isMobile, $el) {
    let className = isMobile ? 'mobile' : 'desktop'
    $el.removeClass('mobile desktop').addClass(className)
  }

  toggleClassName(isMobile, $el)

  isMobileCompute.bind('change', function () {
    toggleClassName(isMobileCompute(), $el)
  })
}

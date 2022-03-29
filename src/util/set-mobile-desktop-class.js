import $ from 'jquery'

export default function setMobileDesktopClass (isMobileCompute, $element) {
  const isMobile = isMobileCompute()
  const $el = $element || $('body')

  const toggleClassName = function (isMobile, $el) {
    const className = isMobile ? 'mobile' : 'desktop'
    $el.removeClass('mobile desktop').addClass(className)
  }

  toggleClassName(isMobile, $el)

  isMobileCompute.bind('change', function () {
    toggleClassName(isMobileCompute(), $el)
  })
}

import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import Component from 'can-component'
import template from './audio-player.stache'

function leftPad (len, char, str) {
  while (str.length < len) {
    str = char + str
  }
  return str
}

function formatTime (inputSeconds) {
  const isReal = typeof inputSeconds === 'number' && isFinite(inputSeconds)
  if (!isReal) {
    return '--:--'
  }

  const minuteSeconds = 60
  const hourSeconds = minuteSeconds * 60

  const hours = Math.floor(inputSeconds / hourSeconds)
  const minutes = Math.floor((inputSeconds % hourSeconds) / minuteSeconds)
  const seconds = Math.floor(inputSeconds % minuteSeconds)

  const minTwoDigit = num => leftPad(2, '0', '' + num)

  if (hours) {
    return `${hours}:${minTwoDigit(minutes)}:${minTwoDigit(seconds)}`
  }

  return `${minutes}:${minTwoDigit(seconds)}`
}

export const AudioPlayerVm = DefineMap.extend('AudioPlayer', {
  player: { default: null },
  isPlaying: { default: false },
  sourceUrl: { default: null },
  isLoadingAudio: { default: false },
  loadAudioError: { default: null },
  isVolumeShowing: { default: false },
  currentVolume: { default: 0 },
  currentSecond: { default: null },
  totalSeconds: { default: null },
  currentTime: {
    get () {
      return formatTime(this.currentSecond)
    }
  },
  totalTime: {
    get () {
      return formatTime(this.totalSeconds)
    }
  },
  currentPercentProgress: {
    get () {
      const currentSecond = this.currentSecond
      const totalSeconds = this.totalSeconds
      if (!totalSeconds) {
        return 0
      }

      const percent = (currentSecond / totalSeconds) * 100
      return percent
    }
  },
  volumePercent: {
    get () {
      return this.currentVolume * 100
    }
  },
  volumeType: {
    get () {
      const loudVolume = 0.5
      const softVolume = 0.05
      const currentVolume = this.currentVolume
      if (currentVolume >= loudVolume) {
        return 'loud'
      }
      if (currentVolume >= softVolume) {
        return 'soft'
      }
      return 'none'
    }
  },

  togglePlay () {
    const player = this.player
    const isPlaying = !this.isPlaying
    this.isPlaying = isPlaying
    if (player) {
      if (isPlaying) {
        player.play()
      } else {
        player.pause()
      }
    }
  },

  toggleVolume () {
    this.isVolumeShowing = !this.isVolumeShowing
  },

  updateMetadata () {
    if (this.player) {
      this.totalSeconds = this.player.duration
    }
  },

  updateLoading () {
    this.isLoadingAudio = false
    if (this.player) {
      this.currentSecond = this.player.currentTime
      this.currentVolume = this.player.volume
      this.totalSeconds = this.player.duration
    }
  },

  updateProgress () {
    if (this.player) {
      this.currentSecond = this.player.currentTime
    }
  },

  updateVolume () {
    if (this.player) {
      this.currentVolume = this.player.volume
    }
  },

  playerEnded () {
    this.isPlaying = false
    if (this.player) {
      this.player.currentTime = 0
      this.player.pause()
    }
  },

  playerErrored () {
    const error = this.player && this.player.error
    if (error) {
      this.loadAudioError = error
    }
  }
})

function isDraggable (el) {
  const className = el.className
  return typeof className === 'string' && className.indexOf('pin') !== -1
}

function getRangeBox (event, targetElement) {
  let rangeBox = event.target
  if (event.type === 'click' && isDraggable(event.target)) {
    rangeBox = event.target.parentElement.parentElement
  }
  if (event.type === 'mousemove') {
    rangeBox = targetElement.parentElement.parentElement
  }
  return rangeBox
}

function getCoefficient (event, targetElement) {
  const slider = getRangeBox(event, targetElement)
  const isHorizontal = slider.dataset.direction === 'horizontal'
  const rect = slider.getBoundingClientRect()
  if (isHorizontal) {
    const offsetX = event.clientX - rect.left
    const width = slider.clientWidth
    return offsetX / width
  }

  const height = slider.clientHeight
  const offsetY = event.clientY - rect.top
  return 1 - offsetY / height
}

const clamp = (min, num, max) => Math.max(min, Math.min(num, max))

function changeTime (player, event, dragElement) {
  // We prevent the user from dragging to the absolute end of
  // the audio as that triggers the playerEnded handler, which
  // resets the player currentTime to 0.
  const maxCoefficient = 1 - 0.0005
  const dragCoefficient = getCoefficient(event, dragElement)
  const coefficient = clamp(0, dragCoefficient, maxCoefficient)
  player.currentTime = player.duration * coefficient
}

function changeVolume (player, event, dragElement) {
  const coefficient = getCoefficient(event, dragElement)
  player.volume = clamp(0, coefficient, 1)
}

export default Component.extend({
  view: template,
  leakScope: false,
  ViewModel: AudioPlayerVm,
  tag: 'audio-player',
  events: {
    inserted () {
      const player = $(this.element).find('audio')[0]
      this.viewModel.player = player
      this.viewModel.isLoadingAudio = true
    },
    '{element} beforeremove' () {
      this.viewModel.player = null
    },
    '{window} mousedown' (target, event) {
      if (!isDraggable(event.target)) return

      const dragElement = event.target
      const handleMethod = dragElement.dataset.method
      const handler = handleEvent => {
        const player = $(this.element).find('audio')[0]
        if (handleMethod === 'time') {
          changeTime(player, handleEvent, dragElement)
        }
        if (handleMethod === 'volume') {
          changeVolume(player, handleEvent, dragElement)
        }
      }

      const done = () => {
        window.removeEventListener('mousemove', handler, false)
        window.removeEventListener('mouseup', done)
        const visualDelay = 300
        setTimeout(() => {
          this.viewModel.isVolumeShowing = false
        }, visualDelay)
      }

      window.addEventListener('mousemove', handler, false)
      window.addEventListener('mouseup', done, false)
    },
    '.slider-time click' (target, event) {
      const player = $(this.element).find('audio')[0]
      changeTime(player, event)
    },
    '.slider-volume click' (target, event) {
      const player = $(this.element).find('audio')[0]
      changeVolume(player, event)
    }
  }
})

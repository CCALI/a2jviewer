import $ from 'jquery'
import CanMap from 'can-map'
import Component from 'can-component'
import template from './audio-player.stache'

import 'can-map-define'

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

export const AudioPlayerVm = CanMap.extend('AudioPlayer', {
  define: {
    player: { value: null },
    isPlaying: { value: false },
    sourceUrl: { value: null },
    isLoadingAudio: { value: false },
    loadAudioError: { value: null },
    isVolumeShowing: { value: false },
    currentVolume: { value: 0 },
    currentSecond: { value: null },
    totalSeconds: { value: null },
    currentTime: {
      get () {
        return formatTime(this.attr('currentSecond'))
      }
    },
    totalTime: {
      get () {
        return formatTime(this.attr('totalSeconds'))
      }
    },
    currentPercentProgress: {
      get () {
        const currentSecond = this.attr('currentSecond')
        const totalSeconds = this.attr('totalSeconds')
        if (!totalSeconds) {
          return 0
        }

        const percent = (currentSecond / totalSeconds) * 100
        return percent
      }
    },
    volumePercent: {
      get () {
        return this.attr('currentVolume') * 100
      }
    },
    volumeType: {
      get () {
        const loudVolume = 0.5
        const softVolume = 0.05
        const currentVolume = this.attr('currentVolume')
        if (currentVolume >= loudVolume) {
          return 'loud'
        }
        if (currentVolume >= softVolume) {
          return 'soft'
        }
        return 'none'
      }
    }
  },

  togglePlay () {
    const player = this.player
    const isPlaying = !this.attr('isPlaying')
    this.attr('isPlaying', isPlaying)
    if (player) {
      if (isPlaying) {
        player.play()
      } else {
        player.pause()
      }
    }
  },

  toggleVolume () {
    this.attr('isVolumeShowing', !this.attr('isVolumeShowing'))
  },

  updateMetadata () {
    if (this.player) {
      this.attr('totalSeconds', this.player.duration)
    }
  },

  updateLoading () {
    this.attr('isLoadingAudio', false)
    if (this.player) {
      this.attr('currentSecond', this.player.currentTime)
      this.attr('currentVolume', this.player.volume)
      this.attr('totalSeconds', this.player.duration)
    }
  },

  updateProgress () {
    if (this.player) {
      this.attr('currentSecond', this.player.currentTime)
    }
  },

  updateVolume () {
    if (this.player) {
      this.attr('currentVolume', this.player.volume)
    }
  },

  playerEnded () {
    this.attr('isPlaying', false)
    if (this.player) {
      this.player.currentTime = 0
      this.player.pause()
    }
  },

  playerErrored () {
    const error = this.player && this.player.error
    if (error) {
      this.attr('loadAudioError', error)
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
      this.viewModel.attr('player', player)
      this.viewModel.attr('isLoadingAudio', true)
    },
    '{element} beforeremove' () {
      this.viewModel.attr('player', null)
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
          this.viewModel.attr('isVolumeShowing', false)
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

import DefineMap from 'can-define/map/map'

export default DefineMap.extend('ModalContent', {
  // variable name
  answerName: { default: '' },

  // shows glyphicon-lifebuoy if emptry
  title: { default: '' },

  // used for 'zoom in' on long text fields
  textLongValue: { default: '' },

  // question text
  text: { default: '' },

  audioURL: { default: '' },

  // summary or transcription of audio content
  mediaLabel: { default: '' },

  imageURL: { default: '' },

  // represents imageURL
  altText: { default: '' },

  videoURL: { default: '' },

  // text transcript of video content
  helpReader: { default: '' },

  // only used for textlong modals
  textlongVM: { Default: DefineMap },
  field: { Default: DefineMap }
})

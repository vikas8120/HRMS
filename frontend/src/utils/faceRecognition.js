import * as faceapi from '@vladmandic/face-api'

const MODEL_URI = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
let modelsReady = false

export const ensureFaceModels = async () => {
  if (modelsReady) return true
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI)
  ])
  modelsReady = true
  return true
}

export const detectFaceDescriptor = async (videoEl) => {
  await ensureFaceModels()
  const result = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!result?.descriptor) return null
  return Array.from(result.descriptor).map((n) => Number(n.toFixed(6)))
}

export const detectFaceDescriptorFromImageFile = async (file) => {
  await ensureFaceModels()
  const imageUrl = URL.createObjectURL(file)
  try {
    const img = await faceapi.fetchImage(imageUrl)
    const result = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor()
    if (!result?.descriptor) return null
    return Array.from(result.descriptor).map((n) => Number(n.toFixed(6)))
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

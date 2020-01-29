const video = document.getElementById('video')

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ]).then(StartCam)
function StartCam(){
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}

video.addEventListener('playing', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    
    setInterval(async () => {
        const labeledFaceDescriptors = await loadLabeledImages()
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
    /*canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections)*/
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box
        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
        drawBox.draw(canvas)
    })
    }, 100)

  })

  function loadLabeledImages() {
    const labels = ['Sam', 'Tien', 'Tran Thanh', 'Tri', 'Truong Giang', 'Vu']
    return Promise.all(
      labels.map(async label => {
        const descriptions = []
        for (let i = 0; i < 2; i++) {
          const img = await faceapi.fetchImage(`http://127.0.0.1:5500/images/${label}/${i}.jpg`)
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          descriptions.push(detections.descriptor)
        }

        return new faceapi.LabeledFaceDescriptors(label, descriptions)
      })
    )
  }

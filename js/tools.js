////////////////////////////////////////////////////////////////////////////////
////                  Website/Questionair related functions                 ////
////////////////////////////////////////////////////////////////////////////////

function initForm() {
  // Hide questions to begin with
  $("#boxyBox").hide()
  $("#questionTwo").hide()
  $("#questionThree").hide()
}

function setRange(asset, value, hide, fadeIn, fadeOut) {
  /**
    * Set the range for pollution indicators oil, plastic and forest.

    * asset -> string (one of "oil", "plastic", "forest")
    * value -> integer, so far one of (1, 2, 3)
    * hide -> string, id to hide the given DOM-element
    * fadeIn -> string, id to fade the given DOM-element in
  **/
  // set value
  pollutionIndicators[asset].range = value

  // input sanitizing
  let args = [hide, fadeIn, fadeOut]
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== undefined) {
      args[i] = typeof args[i] !== "object" ? [args[i]] : args[i]
    } else {
      args[i] = []
    }
  }

  // update argument values
  [hide, fadeIn, fadeOut] = args

  // hiding, fading
  hide.forEach(id => $(`#${id}`).hide())
  fadeIn.forEach(id => $(`#${id}`).fadeIn())
  fadeOut.forEach(id => $(`#${id}`).fadeOut())

  // calling impact function based on value set
  if (pollutionIndicators[asset].hasOwnProperty("impact")) {
    pollutionIndicators[asset].impact.forEach(func => func(value))
  }
}

////////////////////////////////////////////////////////////////////////////////
////                  Algorithmic/Computational stuff                       ////
////////////////////////////////////////////////////////////////////////////////

function createGrid(bottomleft, topright, stepsize=-1) {
  /**
    * Takes the bottom left and top right (x, y) coordinates of a rectangle to
    * to create a grid on that with coarseness defined by stepsize.

    * bottomleft, topright -> arrays
    * stepsize -> positive integer
  **/
  let [x0, y0] = bottomleft
  let [x1, y1] = topright
  let grid = []

  if (!(stepsize > 0)) {
    let diff = x1 - x0
    stepsize = diff / 100
  }

  for (let xinc = x0; xinc <= x1; xinc += stepsize) {
    for (let yinc = y0; yinc <= y1; yinc += stepsize) {
      grid.push([xinc, yinc])
    }
  }

  return grid
}

function shuffle(a) {
  /**
    * Shuffle given array a using the modern version of Fisher-Yates shuffle.
  **/
  let j, x, i
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = a[i]
    a[i] = a[j]
    a[j] = x
  }
  return a
}

////////////////////////////////////////////////////////////////////////////////
////                  Canvas/Camera/Scene related Stuff                     ////
////////////////////////////////////////////////////////////////////////////////

// stolen from https://github.com/jeromeetienne/AR.js/issues/358#issuecomment-404543089
function resizeCanvas(origCanvas, width, height) {
  let resizedCanvas = document.createElement("canvas");
  let resizedContext = resizedCanvas.getContext("2d");

  resizedCanvas.height = height;
  resizedCanvas.width = width;

  if (width > height) {
    // Landscape
    resizedContext.drawImage(origCanvas, 0, 0, width, height);
  } else {
    // Portrait
    var scale = height / width;
    var scaledHeight = origCanvas.width * scale;
    var scaledWidth = origCanvas.height * scale;
    var marginLeft = (origCanvas.width - scaledWidth) / 2;
    resizedContext.drawImage(origCanvas, marginLeft, 0, scaledWidth, scaledHeight);
  }

  return resizedCanvas.toDataURL();
}

// stolen from https://github.com/jeromeetienne/AR.js/issues/358#issuecomment-395911581
function captureVideoFrame(video, format, width, height) {
  if (typeof video === 'string') {
    video = document.querySelector(video)
  }

  format = format || 'jpeg'

  if (!video || (format !== 'png' && format !== 'jpeg')) {
    return false
  }

  let canvas = document.createElement("CANVAS")

  canvas.width = width || video.videoWidth
  canvas.height = height || video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  let dataUri = canvas.toDataURL('image/' + format)
  let data = dataUri.split(',')[1]
  let mimeType = dataUri.split(';')[0].slice(5)

  let bytes = window.atob(data)
  let buf = new ArrayBuffer(bytes.length)
  let arr = new Uint8Array(buf)

  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i)
  }

  let blob = new Blob([arr], {
    type: mimeType
  })
  return {
    blob: blob,
    dataUri: dataUri,
    format: format,
    width: canvas.width,
    height: canvas.height
  }
}

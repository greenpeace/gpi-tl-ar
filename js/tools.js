////////////////////////////////////////////////////////////////////////////////
////                  Website/Questionair related functions                 ////
////////////////////////////////////////////////////////////////////////////////

function initForm() {
  // Hide questions to begin with
  $("#boxyBox").hide()
  $("#questionTwo").hide()
  $("#questionThree").hide()
}

function Begin() {
  $("#formtitle").hide()
  $("#description").hide()
  $("#calculationBox").hide()
  $("#boxyBox").fadeIn()
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
    if (args[i] != undefined) {
      args[i] = typeof args[i] != "object" ? [args[i]] : args[i]
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

function setGrassGreenness(greenness) {
  /**
    * setting the rgb values of the grass material manually using greenness
  **/
  model("island_forest").children[2].material[0].color.r = (139 - (greenness*139))/255
  model("island_forest").children[2].material[0].color.g = (69+(186*greenness))/255
  model("island_forest").children[2].material[0].color.b = (19-(19*greenness))/255
}

function setWaterClarity(clarity) {
  /**
    * setting rgb + opacity values of water material manually using clarity
  **/
  model("island_forest").children[0].material[2].color.r = 0
  model("island_forest").children[0].material[2].color.g = clarity * 0.2
  model("island_forest").children[0].material[2].color.b = clarity
  model("island_forest").children[0].material[2].opacity = 1 - clarity * .3
}

////////////////////////////////////////////////////////////////////////////////
////                       DOM-related stuff                                ////
////////////////////////////////////////////////////////////////////////////////

function model(name) {
  /**
    * return the DOM-element with given name.
  **/
  for (var i = 0; i < arWorldRoot.children.length; i++) {
    if (arWorldRoot.children[i].name == name) {
      return arWorldRoot.children[i]
    }
  }
}


////////////////////////////////////////////////////////////////////////////////
////                  Algorithmic/Computational stuff                       ////
////////////////////////////////////////////////////////////////////////////////

function distanceBetweenTwoPoints(x1, z1, x2, z2) {
  /**
    * Euclidian distance between two points (x1, z1), (x2, z2)
  **/
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2))
}

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

function ajaxDataToPlatform (formData, platform) {
  /**
    * Upload the formData to a platform
  **/
  $.ajax({
    type: 'POST',
    url: 'https://ul.greenpeace.international/upload',
    processData: false,
    contentType: false,
    async: false,
    cache: false,
    data: formData,
    success: response => {
      let href = {
        "facebook": `https://www.facebook.com/sharer/sharer.php?u=${response}&amp;src=sdkpreparse`,
        "twitter": `https://twitter.com/intent/tweet?text=${response}%20Check%20out%20my%20AR%20Impact%21&source=webclient`}

      console.log(response)
      window.location.href = href[platform]
    },
    error: error => { console.log(error) }
  })
}

////////////////////////////////////////////////////////////////////////////////
////                  Canvas/Camera/Scene related Stuff                     ////
////////////////////////////////////////////////////////////////////////////////

function base64ToBlob(base64, mime) {
  mime = mime || ''
  let sliceSize = 1024
  let byteChars = window.atob(base64)
  let byteArrays = []

  for (let offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
    let slice = byteChars.slice(offset, offset + sliceSize)

    let byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    let byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, { type: mime })
}

function snappysnap(platform) {
  /**
    * save the current frame and canvas, merge them, and upload them to
    * a platform like twitter or facebook.
  **/
  let frame = captureVideoFrame("video", "png")  // save camera frame
  // save canvas object
  let canvas = renderer.domElement // just object is needed

  // resize canvas to match frame dimensions
  canvas = resizeCanvas(canvas, frame.width, frame.height)
  frame = frame.dataUri

  // merge frame and canvas and download the resulting file
  mergeImages([frame, canvas]).then(b64 => {
    let base64ImageContent = b64.replace(/^data:image\/(png|jpg);base64,/, "")
    console.log("b64: " + base64ImageContent)

    let blob = base64ToBlob(base64ImageContent, 'image/png')
    let formData = new FormData()
    formData.append('picture', blob)

    ajaxDataToPlatform(formData, platform)

  })
}

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
  if (typeof video == 'string') {
    video = document.querySelector(video)
  }

  format = format || 'jpeg'

  if (!video || (format != 'png' && format != 'jpeg')) {
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

function loadAsset(propsObject, assetDirectory, assetName, position) {
  /**
    * something like a docstring

    * propsObject         JS object that contains props, like islands, trees.
    * assetName 					Name of the Asset to load
    * mtlLoader		 				THREE.MTLLoader instance
    * islandDirectory			str, path to directory that contains .mtl, .obj
    * islandName					str, the name of the island files
    * positions						array of length 3, containing xyz coords for placement
  **/
  let props = ['scale', 'rotation', 'position']

  mtlLoader.setTexturePath(assetDirectory)
  mtlLoader.setPath(assetDirectory)
  // load material
  mtlLoader.load(assetName + ".mtl", materials => {
    materials.preload();
    let objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials)
    objLoader.setPath(assetDirectory)
    // load object
    objLoader.load(assetName + ".obj", object => {
      console.log(`currently loading ${assetName}`)
      console.log(object)
      object.traverse(node => {
        if (node instanceof THREE.Mesh) {
          node.geometry.computeVertexNormals()
        }
      })

    console.log(assetName, typeof assetName)
    if (assetName.includes("tree")) { // tree branch of condition --------------
      if (position == undefined) {
        spacefound = false
        let calcdx, calcdz
        while (!spacefound) {
          potentialx = -1.3 + (Math.random())
          potentialz = -1.8 + (Math.random())
          if (treeposses.length > 0) {
            for (var j = 0; j < treeposses.length; j++) {
              let distance = distanceBetweenTwoPoints(potentialx, treeposses[j].x, potentialz, treeposses[j].z)

              if (distance > treespacing) {
                calcdx = potentialx
                calcdz = potentialz
                spacefound = true
                console.log("positionfound!: " + distance)
              } else {
                console.log("looking for more space because too small: " + distance)
              }
            }
          } else {
            calcdx = potentialx
            calcdz = potentialz
            spacefound = true
          }
        }
        // NOTE: 0.4 seems a bit arbitrary here
        object.position.set(calcdx, 0.4, calcdz)
        treeposses.push(object.position)
      } else {
        console.log(`tree has position ${position}`)
        object.position.set(...position)
      }
      // set tree scaling
      object.scale.set(...propsObject[assetName].scale)

      // add name
      object.name = assetName

      // add tree to specific group
      let parent = trees[assetName].parent
      islands[parent].group.children.push(object) // .add no workey?

    } else { // island branch of condition -------------------------------------
      props.forEach( prop => {
        if (prop != "rotation") {
          object[prop].set(...propsObject[assetName][prop])
        } else {
          object.rotation.set(...Object.values(propsObject[assetName].rotation))
        }
        // add name
        object.name = assetName
      })
    }
    // add to the AR world
    arWorldRoot.add(object)

    })
  })
}

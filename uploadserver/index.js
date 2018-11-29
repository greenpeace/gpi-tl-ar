const express = require('express')
const https = require('https')
const fileUpload = require('express-fileupload')
const path = require('path')
const fs = require('fs')
const app = express()
const port = 443

// default options
app.use(fileUpload())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
app.use(express.static(path.join(__dirname, 'public')))

// letsencrypt setup
const privateKey = fs.readFileSync('/path/to/your/letsencrypt/privkey.pem', 'utf8')
const certificate = fs.readFileSync('/path/to/your/letsencrypt/cert.pem', 'utf8')
const ca = fs.readFileSync('/path/to/your/letsencrypt/chain.pem', 'utf8')

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
}

app.post('/upload', (req, res) => {
  if (Object.keys(req.files).length == 0) { // I refuse to use three '='.
    return res.status(400).send('No files were uploaded.')
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.picture
  // console.log(req.files) // diag
  let uid = makeid()
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(`/var/www/public/${uid}.png`, err => {
    // if error, return it
    if (err) return res.status(500).send(err)

    // otherwise continue with file creation
    let writeStream = fs.createWriteStream(`/var/www/public/${uid}.html`)

    // write contents of html file for twitter card
    writeStream.write('<html>')
    writeStream.write('<head>')
    writeStream.write('<meta name="twitter:card" content="summary_large_image" />')
    writeStream.write('<meta name="twitter:site" content="https://ul.greenpeace.international/' + uid + '.html" />')
    // post content, i.e. description, message...
    writeStream.write('<meta name="twitter:title" content="My AR impact!" />')
    writeStream.write('<meta name="twitter:description" content="I used the app, and this is what my impact looks like!" />')
    // image part
    writeStream.write('<meta name="twitter:image" content="https://ul.greenpeace.international/' + uid + '.png" />')
    // set meta properties
    writeStream.write('<meta property="og:url"           content="https://ul.greenpeace.international/' + uid + '.html" />')
    writeStream.write('<meta property="og:type" content="website" />')
    writeStream.write('<meta property="og:title" content="My AR impact!" />')
    writeStream.write('<meta property="og:description"   content="I used the app, and this is what my impact looks like!" />')
    writeStream.write('<meta property="og:image"         content="https://ul.greenpeace.international/' + uid + '.png" />')
    // closing html file
    writeStream.write('</head>')
    writeStream.write('<body>')
    writeStream.write('<img src="https://ul.greenpeace.international/' + uid + '.png">')
    writeStream.write('<body>')
    writeStream.write('</html>')
    writeStream.end()
    res.send('https://ul.greenpeace.international/' + uid + '.html')
  })
})

// https part
const httpsServer = https.createServer(credentials, app)
httpsServer.listen(port, () => console.log(`App listening on port ${port}!`))

// helper funcion -------------------------------------------------------------
function makeid (idLength = 5) {
  /**
    * make an id consisting of 5 characters, containing upper and lowercase
    * letters and numbers.
    * create longer ids for less chance of multiple occurance.
  **/
  let text = ''
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  // put 5 random characters in a row
  for (let i = 0; i < idLength; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

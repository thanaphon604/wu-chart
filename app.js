const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const {Data} = require('./dataModel')

var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI ||'mongodb://localhost/serDB')
  .then(() =>  console.log('@@@ Connection db is succes @@@'))
  .catch((err) => console.error('!!! Fail to connect db !!!'));

var app = express()

app.use(bodyParser.json())

app.get('/getData', (req, res) => {
    Data.find().then((data) => {
        res.send(data)
    }, (e) => {
        res.status(400).send(e)
    })
})

app.post('/photo-upload', upload.any(), (req, res) => {
    let len = req.files.length
    let data = []
    for(let i=0;i<len;i++) {
        let obj = {
            node: eval('req.body.data.node'+i),
            links: eval("req.body.data.link"+i),
            url: eval("req.body.data.url"+i),
            imgName: req.files[i].filename
        }
        data.push(obj)
    }
    //myRes = JSON.stringify(req.files)+JSON.stringify(req.body.data)
    res.send(data)
})

app.post('/postData', (req, res) => {
    let data = {
        node: req.body.node,
        links: req.body.links,
        url: req.body.url
    }
    let newData = new Data({data})
    newData.save().then((doc) => {
        res.send(doc)
    }, (e) => {
        res.status(400).send(e)
    })
})

app.post('/editData', (req, res) => {
    res.send('edit')
})

app.listen(3000, () => {
    console.log('is running on port 3000')
})

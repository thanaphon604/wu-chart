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

app.post('/submit-data', upload.any(), (req, res) => {
    let len = req.files.length
    let data = []
    let groupLen = req.body.data.groupCount
    let groupArray = []
    let groupColorArray = []
    for(let i=0;i<groupLen;i++) {
        groupArray.push(eval('req.body.data.group'+i))
        groupColorArray.push(eval('req.body.data.groupColor'+i))
    }

    let chartData = {
        chartName: req.body.data.chartName,
        groupCount: req.body.data.groupCount,
        groupNames: groupArray,
        groupColors: groupColorArray 
    }

    for(let i=0;i<len;i++) {
        let obj = {
            node: eval('req.body.data.node'+i),
            links: eval("req.body.data.link"+i),
            url: eval("req.body.data.url"+i),
            imgName: req.files[i].filename,
            groupNumber: eval('req.body.data.groupNumberInput'+i)            
        }
        data.push(obj)
    }

    //make links array from string
    
    for(let i=0;i<len;i++) {
        let link = []
        let splitString = data[i].links.split(',')    
        // console.log(splitString)
        for(let j=0;j<splitString.length;j++) {
            if(splitString[j]!='') {
                link.push(splitString[j])
            }
        }
        data[i].links = link        
    }

    chartData.data = data
    console.log(chartData)
    //Save model to DB
    let newData = new Data(chartData)
    newData.save().then((doc) => {
        res.send(doc)
    }, (e) => {
        res.status(400).send(e)
    })
    //myRes = JSON.stringify(req.files)+JSON.stringify(req.body.data)
    // res.send(chartData)
    // res.send(req.body.data)
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

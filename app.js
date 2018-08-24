const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const fs = require('fs')
const hbs = require('hbs')
const {Data} = require('./dataModel')


var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI ||'mongodb://localhost/serDB')
  .then(() =>  console.log('@@@ Connection db is succes @@@'))
  .catch((err) => console.error('!!! Fail to connect db !!!'));

var app = express()

app.set('view engine', 'hbs')
app.use(bodyParser.json())
app.use("/public", express.static(__dirname + "/public"));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use("/views", express.static(__dirname + "/views"));

app.get('/getData', (req, res) => {
    Data.find().then((data) => {
        res.send(data)
    }, (e) => {
        res.status(400).send(e)
    })
})

// render chart by name 
app.get('/chart/:name', (req, res) => {
    Data.find({chartName: req.params.name}).then((d) => {
        console.log(d[0])
        res.render('chart.hbs', {
           chartName: d[0].chartName,
           groupCount: d[0].groupCount,
           fontSize: d[0].fontSize,
           circleSize: d[0].circleSize,
           groupNames: encodeURI(JSON.stringify(d[0].groupNames)),
           groupColors: encodeURI(JSON.stringify(d[0].groupColors)),
           data: encodeURI(JSON.stringify(d[0].data))
        })
    }, (e) => {
        res.status(404).send(e)
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
        groupColors: groupColorArray,
        circleSize: req.body.data.circleSize,
        fontSize: req.body.data.fontSize
    }

    for(let i=0;i<len;i++) {
        let obj = {
            name: eval('req.body.data.node'+i),
            imports: eval("req.body.data.link"+i),
            url: eval("req.body.data.url"+i),
            imgName: req.files[i].filename,
            groupNumber: eval('req.body.data.groupNumberInput'+i)            
        }
        data.push(obj)
    }

    //make links array from string
    
    for(let i=0;i<len;i++) {
        let link = []
        let splitString = data[i].imports.split(',')    
        // console.log(splitString)
        for(let j=0;j<splitString.length;j++) {
            if(splitString[j]!='') {
                link.push(splitString[j])
            }
        }
        data[i].imports = link        
    }
    chartData.data = data
    console.log(chartData)
    
    //=========== Write Json File ==============
    let stringData = JSON.stringify(data)
    fs.writeFile("./views/"+req.body.data.chartName+".json", stringData, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log('is made json file to db')
    }); 

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

app.listen(3000, () => {
    console.log('is running on port 3000')
})

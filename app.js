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
app.use("/", express.static(__dirname + "/public"));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use("/views", express.static(__dirname + "/views"));

app.get('/getData', (req, res) => {
    Data.find().then((data) => {
        res.send(data)
    }, (e) => {
        res.status(400).send(e)
    })
})

app.get('/makefile', (req, res) => {
    fs.writeFile('file.txt', 'Hello COntent', function(err) {
        if(err) throw err
        console.log('Saved!')
        res.send('Saved')
    })
})

app.get('/readfile', (req, res) => {
    fs.read('file.txt', function(err, data) {
        res.send(data)
    })
})

app.get('/edit', (req, res) => {
    Data.find().then((data) => {
        let str = '<h1>Select your chart for edit.</h1><br />'
        for(let i=0;i<data.length;i++) {
            str += '<a href="https://wu-chart.herokuapp.com/edit/'+data[i].chartName+'"><h2>'+data[i].chartName+'</h2></a>'
        }
        res.send(str)
    }, (e) => {
        res.status(400).send(e)
    })
})

app.get('/edit/:name', (req, res) => {
    Data.find({chartName: req.params.name}).then((d) => {
        console.log(d[0])
        res.render('edit.hbs', {
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

app.get('/chart/:name/:groupNumber', (req, res) => {
    // read file because file .json is already sort
    if (fs.existsSync('./views/'+req.params.name+'.json')){
        let obj = JSON.parse(fs.readFileSync('./views/'+req.params.name+'.json', 'utf8'));
        let data = []
        for(let i=0;i<obj.length;i++) {
            if(''+obj[i].groupNumber == req.params.groupNumber) {
                data.push(obj[i])
            }
        }
        
        res.send(data)
    }else {
        res.status(404).send('not found this file')
    }
    
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

app.post('/edit-data', upload.any(), (req, res) => {
    let imageData = []
    let count = 0
    while(eval('req.body.data.node'+count)!=undefined) {
        // console.log('data is ', eval('req.body.data.node'+count))
        count++
    }
    console.log('count is ', count)

    Data.find({chartName: req.body.data.chartName}, function(err, dd) {
        if(err) {
            res.status(400).send(err)
            return console.log('not found is Data')
        }
        let imgArray = []
        for(let i=0;i<count;i++) {
            let curName = eval('req.body.data.node'+i)
            // find old pic by curName
            let oldPic = ''
            for(let j=0;j<dd[0].data.length;j++) {
                if(dd[0].data[j].name == curName) {
                    oldPic = dd[0].data[j].imgName
                    break
                }
            }
            imgArray.push(oldPic) // old pic
        }
        // console.log('imgArray before', imgArray)
        // got oldPic now get newPic and set to array

        for(let i=0;i<req.files.length;i++) {
            let curImgName = '' + req.files[i].filename
            let curImgFieldName = '' + req.files[i].fieldname
            let curPos = curImgFieldName.substring(curImgFieldName.indexOf('e')+1, curImgFieldName.indexOf(']'))
            curPos = parseInt(curPos)

            // console.log('filedname: ', curImgFieldName)
            // console.log('pos is :', curPos)
            let d = {
                imgName: curImgName,
                index: curPos
            }
            // push newNew in imgArray
            imgArray[d.index] = d.imgName
            // console.log('d :', d)
        }
        console.log('=================================')
        // console.log('imgArray after', imgArray)

        //Clear old data and save new data 
        
        let groupLen = req.body.data.groupCount
        let groupColorsArray = []
        let groupNamesArray = []
        let data_all = []
        for(let i=0;i<groupLen;i++) {
            groupColorsArray.push(eval('req.body.data.groupColor'+i))
            groupNamesArray.push(eval('req.body.data.group'+i))
        }
        let Chart_Data = {
            chartName: req.body.data.chartName,
            fontSize: req.body.data.fontSize,
            circleSize: req.body.data.circleSize,
            groupCount: req.body.data.groupCount,
            groupNames: groupNamesArray,
            groupColors: groupColorsArray
        }

        //count is len all of new data
        for(let i=0;i<count;i++) {
            let obj = {
                name: eval('req.body.data.node'+i),
                imports: eval("req.body.data.link"+i),
                url: eval("req.body.data.url"+i),
                imgName: imgArray[i],
                groupNumber: eval('req.body.data.groupNumberInput'+i)            
            }
            data_all.push(obj)
        }

        //make links array from string
    
        for(let i=0;i<count;i++) {
            let link = []
            let splitString = data_all[i].imports.split(',')
            // console.log(splitString)
            for(let j=0;j<splitString.length;j++) {
                if(splitString[j]!='') {
                    link.push(splitString[j])
                }
            }
            data_all[i].imports = link        
        }
        Chart_Data.data = data_all
        
        // console.log('Chart_data : ', Chart_Data)

        Data.remove({chartName: Chart_Data.chartName}).then(() => {
            let newD = new Data(Chart_Data)
            newD.save().then((doc) => {
                console.log('is saved', doc)
                if (fs.existsSync('./views/'+Chart_Data.chartName+'.json')){
                    fs.unlinkSync('./views/'+Chart_Data.chartName+'.json')
                    console.log("have dir file for remove")
                }else {
                    console.log("no have dir file for remove so just save it!")
                }
                
                
                lastNameNumber = []
                for(let i=0;i<Chart_Data.groupCount;i++) {
                    if(Chart_Data.groupNames[i].charAt(0) == '!') {
                        lastNameNumber.push(i)
                    }
                }
            
                let _d = SortData(Chart_Data.data, Chart_Data.groupCount, lastNameNumber)
                fs.writeFile("./views/"+Chart_Data.chartName+".json", JSON.stringify(_d), function(err) {

                    if(err) {
                        return console.log(err);
                    }
                    console.log('is made json file to db')
                }); 
            }, (e) => {
                console.log('can not save', e)
            })
        })
        res.send(req.body.data)
    })
    
    // res.send(req.files)
    
})

app.get('/remove-chart', (req, res) => {
    Data.remove().then((doc) => {
        res.send(doc)
    }, (e) => {
        res.status(400).send(e)
    })
})

app.post('/submit-data', upload.any(), (req, res) => {
    let count = 0
    while(eval('req.body.data.node'+count)!=undefined) {
        // console.log('data is ', eval('req.body.data.node'+count))
        count++
    }

    let groupLen = req.body.data.groupCount
    let groupColorsArray = []
    let groupNamesArray = []
    let data_all = []
    for(let i=0;i<groupLen;i++) {
        groupColorsArray.push(eval('req.body.data.groupColor'+i))
        groupNamesArray.push(eval('req.body.data.group'+i))
    }
    let Chart_Data = {
        chartName: req.body.data.chartName,
        fontSize: req.body.data.fontSize,
        circleSize: req.body.data.circleSize,
        groupCount: req.body.data.groupCount,
        groupNames: groupNamesArray,
        groupColors: groupColorsArray
    }

    //count is len all of new data
    for(let i=0;i<count;i++) {
        let obj = {
            name: eval('req.body.data.node'+i),
            imports: eval("req.body.data.link"+i),
            url: eval("req.body.data.url"+i),
            imgName: req.files[i].filename,
            groupNumber: eval('req.body.data.groupNumberInput'+i)            
        }
        data_all.push(obj)
    }

    //make links array from string

    for(let i=0;i<count;i++) {
        let link = []
        let splitString = data_all[i].imports.split(',')
        // console.log(splitString)
        for(let j=0;j<splitString.length;j++) {
            if(splitString[j]!='') {
                link.push(splitString[j])
            }
        }
        data_all[i].imports = link        
    }
    Chart_Data.data = data_all
    lastNameNumber = []
    for(let i=0;i<Chart_Data.groupCount;i++) {
        if(Chart_Data.groupNames[i].substr(0,1) == "!") {
            lastNameNumber.push(i)
        }
    }

    
    //=========== Write Json File ==============
    // let stringData = JSON.stringify(data)
    // sort before save @@@@
    let _d = SortData(Chart_Data.data, Chart_Data.groupCount, lastNameNumber)
    fs.writeFile("./views/"+Chart_Data.chartName+".json", JSON.stringify(_d), function(err) {

        if(err) {
            return console.log(err);
        }
        console.log('is made json file to db')
    }); 

    //Save model to DB
    let newData = new Data(Chart_Data)
    newData.save().then((doc) => {
        res.send(doc)
    }, (e) => {
        res.status(400).send(e)
    })
    //myRes = JSON.stringify(req.files)+JSON.stringify(req.body.data)
    // res.send(chartData)
    res.send(req.body.data)

    
})

function SortData(data, gNo, byLastNameGroupNumber) {
    let groupArray = new Array(gNo)
    let sizeArray = new Array(gNo)
    for(let i=0;i<gNo;i++) {
        sizeArray[i] = 0
    }
    for(let i=0;i<gNo;i++) {
        for(let j=0;j<data.length;j++) {
            if(data[j].groupNumber == i+1) {
                sizeArray[i]++
            }
        }
    }
    for(let i=0;i<gNo;i++) {
        groupArray[i] = new Array(sizeArray[i])
        console.log('size of array '+i+' is', groupArray[i].length)
        sizeArray[i] = 0
    }

    console.log('###########################')
    console.log('sizeArray is', sizeArray)

    // groupArray[0][0] = '1234'
    for(let i=0;i<gNo;i++) {
        for(let j=0;j<data.length;j++) {
            if(data[j].groupNumber == i+1) {
                groupArray[i][sizeArray[i]] = data[j]
                sizeArray[i]++
            }
        }
    }

    //sort data 
    for(let i=0;i<gNo;i++) {
        groupArray[i].sort(function(a, b) {
            return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
        })
    }

    console.log('garray is', groupArray)

    console.log('$$$$$$$$$')
    console.log('last name is', byLastNameGroupNumber)

    //sort by lastname if groupname input like this => !groupname
    // swap name and last name
    // //Sort
    for(let i=0;i<byLastNameGroupNumber.length;i++) {
        for(let j=0;j<groupArray[byLastNameGroupNumber[i]].length;j++) {
            groupArray[byLastNameGroupNumber[i]][j].lastName = (groupArray[byLastNameGroupNumber[i]][j].name.split(" "))[1]
            console.log('sss', groupArray[byLastNameGroupNumber[i]][j].lastName)
        }
    }
    for(let i=0;i<byLastNameGroupNumber.length;i++) {
        groupArray[byLastNameGroupNumber[i]].sort(function(a, b) {
            return (a.lastName > b.lastName) ? 1 : ((b.lastName > a.lastName) ? -1 : 0);
        })
    }
   
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')

    console.log('group4 is ', groupArray[4])
    // console.log('data is ', JSON.stringify(groupArray))

    let my_data = new Array(data.length)
    let count = 0
    for(let i=0;i<gNo;i++) {
        for(let j=0;j<sizeArray[i];j++) {
            my_data[count] = groupArray[i][j]
            count++ 
        }
    }
    console.log('#########################')
    // console.log('my_data is', my_data)


    return my_data

}

app.listen(process.env.PORT || 3000, () => {
    console.log('is running on port 3000')
})

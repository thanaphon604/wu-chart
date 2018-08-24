const mongoose = require('mongoose')

var Schema = mongoose.Schema

var DataSchema = new Schema({
    chartName: {
        type: String,
        required: true,
        unique: true
        // will change unique for 2 primary key!
    },
    fontSize: {
        type: Number,
        required: true
    },
    circleSize: {
        type: Number,
        required: true
    },
    groupCount: {
        type: Number,
        required: true
    },
    groupNames: [
        {
            type: String,
            required: true   
        }
    ],
    groupColors: [
        {
            type: String,
            required: true   
        }
    ],
    data: [
        {
            name: {
                type: String,
                required: true
            },
            imports: [
                {
                    type: String
                }
            ],
            url: {
                type: String,
                required: true
            },
            imgName: {
                type: String,
                required: true
            },
            groupNumber: {
                type: Number,
                required: true
            },
        }
    ]
})

var Data = mongoose.model('Data', DataSchema)

module.exports = {
    Data
}
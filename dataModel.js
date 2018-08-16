const mongoose = require('mongoose')

var Schema = mongoose.Schema

var DataSchema = new Schema({
    chartName: {
        type: String,
        required: true,
        unique: true
    },
    groupCount: {
        type: Number,
        required: true
    },
    groupName: [
        {
            type: String,
            required: true   
        }
    ],
    groupColor: [
        {
            tyep: String,
            required: true
        }
    ],
    data: [
        {
            node: {
                type: String,
                required: true
            },
            links: [
                {
                    type: String,
                    required: true
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
const mongoose = require('mongoose')

var Schema = mongoose.Schema

var DataSchema = new Schema({
    node: {
        type: String,
        required: true,
        unique: true
    },
    links: [
        {
            type: String,
            required: true,
        }
    ],
    url: String,
    img: { 
        data: Buffer, 
        contentType: String 
    }
})

var Data = mongoose.model('Data', DataSchema)

module.exports = {
    Data
}
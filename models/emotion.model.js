const mongoose = require('mongoose');

const emotionSchema = new mongoose.Schema({
    emotion : {
        type : String
    },
    frequency : {
        type : Number
    }
},
{
    timestamps : true
});

const Emotion = mongoose.model('Emotion', emotionSchema);

module.exports = Emotion;
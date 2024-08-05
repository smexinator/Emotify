const Emotion = require('../models/emotion.model');

exports.getEmotionsData = async function(req, res, next){
    try {
        const emotionsData = await Emotion.find();

        res.locals.emotionsNames = emotionsData.map((item)=>{
            return item.emotion
        });

        res.locals.emotionsFrequency = emotionsData.map((item)=>{
            return item.frequency
        });
        
        next();

    } catch (error) {
        console.log(error);
        next();
    }
}
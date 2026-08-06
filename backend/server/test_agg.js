const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const ApiLog = require('./models/ApiLog');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const aggResult = await ApiLog.aggregate([
        { $match: { createdAt: { $gte: yesterday } } },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } }},
        { $sort: { _id: 1 } }
    ]);
    console.log('Agg:', aggResult);
    process.exit(0);
}).catch(console.error);

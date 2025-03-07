
const MongoClient = require('mongodb').MongoClient

module.exports = handler => {
    const url = process.env.MONGODB_URI
    MongoClient.connect(url, { useUnifiedTopology: true, serverSelectionTimeoutMS: 1000 })
        .then(server => server.db(process.env.MONGODB_DB))
        .then(handler)
        .catch(e => console.log(e))
}
const { v4: uuid } = require('uuid')
const databaseSetup = require('./database_setup')

module.exports.UserStore = class {
    constructor() {
        databaseSetup(db => this.db = db)
    }

    getOrCreateUser(steamId) {
        return this.db.collection('users').findOneAndUpdate(
            { steamId },
            {
                $setOnInsert: {
                    identifier: uuid(),
                    steamId,
                    displayName: 'Name'
                }
            },
            {
                returnNewDocument: true,
                upsert: true
            }
        )
    }
}
const { v4: uuid } = require('uuid')
const databaseSetup = require('./database_setup')

module.exports.UserStore = class {
    constructor() {
        databaseSetup(db => this.db = db)
    }

    getOrCreateUser(steamId, profile) {
        return this.db.collection('users').findOneAndUpdate(
            { steamId },
            {
                $setOnInsert: {
                    identifier: uuid(),
                    steamId,
                    displayName: 'Name'
                },
                $set: {
                    profile
                }
            },
            {
                returnNewDocument: true,
                upsert: true
            }
        )
    }

    getUserByIdentifier(identifier) {
        return this.db.collection('users').findOne(
            { identifier }
        )
    }
}
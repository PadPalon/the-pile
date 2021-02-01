const { v4: uuid } = require('uuid')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/users.json')
const db = low(adapter)

db.defaults({ users: [] }).write()

const createUser = steamId => {
    return {
        identifier: uuid(),
        steamId: steamId,
        displayName: 'Name'
    }
}

exports.getOrCreateUser = steamId => {
    const user = db.get('users').find({steamId: steamId}).value()
    if (user) {
        return user
    } else {
        const newUser = createUser(steamId)
        db.get('users').push(newUser).write()
        return newUser
    }
}
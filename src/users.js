const { v4: uuid } = require('uuid')

const users = {}

const createUser = steamId => {
    return {
        identifier: uuid(),
        steamId: steamId,
        displayName: 'Name'
    }
}

exports.getOrCreateUser = steamId => {
    const user = users[steamId]
    if (user) {
        return user
    } else {
        const newUser = createUser(steamId)
        users[steamId] = newUser
        return newUser
    }
}
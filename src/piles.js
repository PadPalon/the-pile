const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/piles.json')
const db = low(adapter)

db.defaults({ piles: [] }).write()

const { v4: uuid } = require('uuid')

const getPileForUser = (identifier, user) => {
    return db.get('piles')
        .find(pile => pile.identifier == identifier && (pile.creator == user.identifier || pile.shared.includes(user.identifier)))
        .value()
}

const getPile = identifier => {
    return db.get('piles').find({identifier: identifier}).value()
}

const getPiles = user => {
    return db.get('piles').filter({'creator': user.identifier}).value()
}

const createPile = (name = 'New list', user) => {
    const pile = {
        identifier: uuid(),
        name,
        items: [],
        creator: user.identifier,
        shared: []
    }
    db.get('piles')
        .push(pile)
        .write()
    return pile
}

const sharePile = (pileId, user) => {
    db.get('piles')
        .find(pile => pile.identifier == pileId && !pile.shared.includes(user.identifier))
        .update('shared', shared => [...shared, user.identifier])
        .write()
}

const createItem = (pile, name = 'New item') => {
    const item = {
        identifier: uuid(),
        name
    }
    db.get('piles').find({identifier: pile.identifier})
        .get('items').push(item)
        .write()
    return item
}

module.exports = {
    getPileForUser,
    getPile,
    getPiles,
    createPile,
    sharePile,
    createItem
}
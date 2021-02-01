const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/piles.json')
const db = low(adapter)

db.defaults({ piles: [] }).write()

const { v4: uuid } = require('uuid')

const getPile = (identifier, user) => {
    return db.get('piles').find({identifier: identifier, creator: user.identifier}).value()
}

const getPiles = user => {
    return db.get('piles').filter({'creator': user.identifier}).value()
}

const createPile = (name = 'New list', user) => {
    const pile = {
        identifier: uuid(),
        name,
        items: [],
        creator: user.identifier
    }
    db.get('piles')
        .push(pile)
        .write()
    return pile
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
    getPile,
    getPiles,
    createPile,
    createItem
}
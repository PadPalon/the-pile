const piles = {}

const { v4: uuid } = require('uuid')

const getPile = (identifier, user) => {
    const pile = piles[identifier]
    if (pile && pile.creator === user.identifier) {
        return pile
    } else {
        return null
    }
}

const getPiles = user => {
    return Object.values(piles).filter(pile => pile.creator === user.identifier)
}

const createPile = (name = 'New list', user) => {
    const pile = {
        identifier: uuid(),
        name,
        items: [createItem()],
        creator: user.identifier
    }
    piles[pile.identifier] = pile
    return pile
}

const createItem = (name = 'New item') => {
    return {
        identifier: uuid(),
        name,
        upvotes: 0,
        downvotes: 0
    }
}

module.exports = {
    getPile,
    getPiles,
    createPile,
    createItem
}
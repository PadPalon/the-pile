const { v4: uuid } = require('uuid')
const databaseSetup = require('./database_setup')

module.exports.PileStore = class {
    constructor() {
        databaseSetup(db => this.db = db)
    }

    getPileForUser(identifier, user) {
        return this.db.collection('piles')
            .findOne({
                identifier: identifier,
                $or: [
                    { creator: user.identifier },
                    { shared: user.identifier }
                ]
            })
    }

    getPile(identifier) {
        return this.db.collection('piles')
            .findOne({
                identifier: identifier
            })
    }

    getPiles(user) {
        return this.db.collection('piles')
            .find({
                $or: [
                    { creator: user.identifier },
                    { shared: user.identifier }
                ]
            })
            .toArray()
    }

    createPile(name = 'New list', user) {
        const pile = {
            identifier: uuid(),
            name,
            items: [],
            creator: user.identifier,
            shared: []
        }
        this.db.collection('piles').insertOne(pile)
        return pile
    }

    sharePile(pileId, user) {
        return this.db.collection('piles').updateOne(
            {
                identifier: pileId,
                shared: { $nin: [user.identifier] }
            },
            {
                $push: { 'shared': user.identifier }
            }
        )
    }

    createItem(pileId, name = 'New item') {
        const item = {
            identifier: uuid(),
            name
        }
        this.db.collection('piles').updateOne(
            {
                identifier: pileId
            },
            {
                $push: { 'items': item }
            }
        )
        this.db.collection('votes').insertOne({
            identifier: item.identifier,
            upvotes: 0,
            downvotes: 0
        })
        return item
    }

    deleteItem(pileId, itemId) {
        return this.db.collection('piles').updateOne(
            { identifier: pileId },
            { $pull: { 'items': { identifier: itemId } } }
        )
    }
}
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/votes.json')
const db = low(adapter)

db.defaults({ votes: [] }).write()

const setupItemVotes = item => {
    db.get('votes').push({
        identifier: item.identifier,
        upvotes: 0,
        downvotes: 0
    }).write()
}

const getVote = (item, user) => {
    return db.get('votes').find({identifier: item.identifier}).get(user.identifier).value()
}

const addUpvote = (item, user) => {
    const votes = db.get('votes').find({identifier: item.identifier})
    votes.set(user.identifier, 'UP').update('upvotes', v => v + 1).write()
}

const addDownvote = (item, user) => {
    const votes = db.get('votes').find({identifier: item.identifier})
    votes.set(user.identifier, 'DOWN').update('downvotes', v => v + 1).write()
}

const removeVote = (item, user) => {
    const votes = db.get('votes').find({identifier: item.identifier})
    const currentVote = votes.get(user.identifier).value()
    if (currentVote === 'UP') {
        votes.update('upvotes', v => v - 1).write()
    } else if (currentVote === 'DOWN') {
        votes.update('downvotes', v => v - 1).write()
    }
    votes.set(user.identifier, null).write()
}

const getUpvotes = item => {
    return db.get('votes').find({identifier: item.identifier}).get('upvotes').value() || 0
}

const getDownvotes = item => {
    return db.get('votes').find({identifier: item.identifier}).get('downvotes').value() || 0
}

module.exports = {
    setupItemVotes,
    getVote,
    addUpvote,
    addDownvote,
    removeVote,
    getUpvotes,
    getDownvotes
}
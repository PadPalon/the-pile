const votes = {}

const getItemVotes = item => {
    const itemVotes = votes[item.identifier]
    if (!itemVotes) {
        const newItemVotes = {}
        votes[item.identifier] = newItemVotes
        return newItemVotes
    } else {
        return itemVotes
    }
}

const getVote = (item, user) => {
    const itemVotes = getItemVotes(item)
    return itemVotes[user.identifier]
}

const addUpvote = (item, user) => {
    const itemVotes = getItemVotes(item)
    itemVotes[user.identifier] = 'UP'
}

const addDownvote = (item, user) => {
    const itemVotes = getItemVotes(item)
    itemVotes[user.identifier] = 'DOWN'
}

const removeVote = (item, user) => {
    const itemVotes = getItemVotes(item)
    itemVotes[user.identifier] = null
}

module.exports = {
    getVote,
    addUpvote,
    addDownvote,
    removeVote
}
const databaseSetup = require('./database_setup')

module.exports.VoteStore = class {
    constructor() {
        databaseSetup(db => this.db = db)
    }

    getVote(item, user) {
        return this.db.collection('votes').findOne({
            identifier: item.identifier,
            [user.identifier]: { $ne: null }
        }).then(vote => vote ? vote[user.identifier] : null)
    }

    addUpvote(item, user) {
        return this.db.collection('votes').updateOne(
            { identifier: item.identifier },
            {
                $set: { [user.identifier]: 'UP' },
                $inc: { upvotes: 1 }
            }
        )
    }

    addDownvote(item, user) {
        return this.db.collection('votes').updateOne(
            { identifier: item.identifier },
            {
                $set: { [user.identifier]: 'DOWN' },
                $inc: { downvotes: 1 }
            }
        )
    }

    removeVote(item, user) {
        const decreaseVotes = field => {
            this.db.collection('votes').updateOne(
                {
                    identifier: item.identifier
                },
                {
                    $set: { [user.identifier]: null },
                    $inc: { [field]: -1 }
                }
            )
        }

        return this.db.collection('votes')
            .findOne({ identifier: item.identifier })
            .then(votes => {
                if (votes[user.identifier] === 'UP') {
                    decreaseVotes('upvotes')
                } else if (votes[user.identifier] === 'DOWN') {
                    decreaseVotes('downvotes')
                }
            })
    }

    getUpvotes(item) {
        return this.db.collection('votes').findOne({
            identifier: item.identifier
        }).then(votes => votes.upvotes)
    }

    getDownvotes(item) {
        return this.db.collection('votes').findOne({
            identifier: item.identifier
        }).then(votes => votes.downvotes)
    }
}
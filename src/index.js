const express = require('express')
const passport = require('passport')
const session = require('express-session')
const LowdbStore = require('lowdb-session-store')(session)
const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const SteamStrategy = require('passport-steam').Strategy
const bodyParser = require('body-parser')

const fs = require('fs')
if (!fs.existsSync('data/')) {
    fs.mkdirSync('data')
}

const adapter = new FileSync('data/sessions.json', { defaultValue: [] })
const db = lowdb(adapter)

require('dotenv').config()

const PileStore = require('./piles').PileStore
const pileStore = new PileStore()

const UserStore = require('./users').UserStore
const userStore = new UserStore()

const VoteStore = require('./votes').VoteStore
const voteStore = new VoteStore()

var app = express()

app.set('views', __dirname + '/../views')
app.set('view engine', 'ejs')

app.use(express.static('public'))

const fileStoreOptions = {
}
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new LowdbStore(db, fileStoreOptions)
}))

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))

passport.use(new SteamStrategy(
    {
        returnURL: `${process.env.URL}/auth/steam/return`,
        realm: process.env.URL,
        profile: false
    },
    (identifier, profile, done) => {
        userStore.getOrCreateUser(identifier, profile).then(user => done(null, user.value))
    }
))

app.use(passport.initialize())
app.use(passport.session())

app.use(bodyParser.json())

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    console.log('Unauthenticated access')
    res.redirect('/')
}

const getItemFromPile = (pile, itemId) => {
    return pile.items.find(i => i.identifier === itemId)
}

app.get('/', (req, res) => res.render('index', { user: req.user }))

app.get('/piles', ensureAuthenticated, (req, res) => {
    pileStore.getPiles(req.user).then(piles => res.render('piles', { piles: piles || [] }))
})
app.get('/piles/create', ensureAuthenticated, (req, res) => res.render('pile_create', {}))
app.get('/piles/:id', ensureAuthenticated, (req, res) => {
    const pileId = req.params.id
    pileStore.getPileForUser(pileId, req.user)
        .then(pile => {
            const votes = {}
            const votePromises = pile.items.map(item => ([
                voteStore.getUpvotes(item).then(votes => item.upvotes = votes),
                voteStore.getDownvotes(item).then(votes => item.downvotes = votes),
                voteStore.getVote(item, req.user).then(vote => votes[item.identifier] = vote),
                voteStore.getUpVoters(item)
                    .then(userIdentifiers => Promise.all(userIdentifiers.map(identifier => userStore.getUserByIdentifier(identifier))))
                    .then(voters => item.upVoters = voters.map(voter => voter.displayName)),
                voteStore.getDownVoters(item)
                    .then(userIdentifiers => Promise.all(userIdentifiers.map(identifier => userStore.getUserByIdentifier(identifier))))
                    .then(voters => item.downVoters = voters.map(voter => voter.displayName)),
            ])).reduce((acc, curr) => ([...curr, ...acc]), [])
            Promise.all(votePromises).then(() => res.render('pile_detail', { pile, votes, pageUrl: process.env.URL, isCreator: pile.creator === req.user.identifier }))
        })
})
app.get('/piles/:id/share', ensureAuthenticated, (req, res) => {
    const pileId = req.params.id
    pileStore.sharePile(pileId, req.user).then(() => res.redirect(`/piles/${pileId}`))
})

app.get('/account', ensureAuthenticated, (req, res) => res.render('account', { user: req.user }))

app.post('/pile', ensureAuthenticated, (req, res) => {
    const name = req.body.name
    const pile = pileStore.createPile(name, req.user)
    res.send(pile)
})

app.post('/item', ensureAuthenticated, (req, res) => {
    const pileId = req.body.pileId
    const name = req.body.name
    const item = pileStore.createItem(pileId, name)
    res.send(item)
})
app.put('/item/vote/up', ensureAuthenticated, (req, res) => {
    const pileId = req.body.pileId
    const itemId = req.body.itemId
    pileStore.getPileForUser(pileId, req.user)
        .then(pile => {
            const item = getItemFromPile(pile, itemId)
            voteStore.getVote(item, req.user)
                .then(vote => {
                    if (vote === 'DOWN') {
                        voteStore.removeVote(item, req.user).then(() => voteStore.addUpvote(item, req.user)).then(() => res.end())
                    } else if (vote === 'UP') {
                        voteStore.removeVote(item, req.user).then(() => res.end())
                    } else if (vote !== 'UP') {
                        voteStore.addUpvote(item, req.user).then(() => res.end())
                    }
                })
        })
})
app.put('/item/vote/down', ensureAuthenticated, (req, res) => {
    const pileId = req.body.pileId
    const itemId = req.body.itemId
    pileStore.getPileForUser(pileId, req.user)
        .then(pile => {
            const item = getItemFromPile(pile, itemId)
            voteStore.getVote(item, req.user)
                .then(vote => {
                    if (vote === 'UP') {
                        voteStore.removeVote(item, req.user).then(() => voteStore.addDownvote(item, req.user)).then(() => res.end())
                    } else if (vote === 'DOWN') {
                        voteStore.removeVote(item, req.user).then(() => res.end())
                    } else if (vote !== 'DOWN') {
                        voteStore.addDownvote(item, req.user).then(() => res.end())
                    }
                })
        })
})

app.delete('/piles/:pileId/item/:itemId', ensureAuthenticated, (req, res) => {
    const pileId = req.params.pileId
    const itemId = req.params.itemId
    pileStore.getPileForUser(pileId, req.user)
        .then(pile => {
            if (pile.creator === req.user.identifier) {
                Promise.all([voteStore.deleteVotes(itemId), pileStore.deleteItem(pileId, itemId)]).then(() => res.end())
            } else {
                res.end()
            }
        })
})

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

app.get('/auth/steam',
    passport.authenticate('steam', { failureRedirect: '/' }),
    (req, res) => res.redirect('/'))

app.get('/auth/steam/return',
    passport.authenticate('steam', { failureRedirect: '/' }),
    (req, res) => res.redirect('/'))

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server started at ${port}`))
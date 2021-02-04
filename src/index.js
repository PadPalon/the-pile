const express = require('express')
const passport = require('passport')
const session = require('express-session')
const LowdbStore = require('lowdb-session-store')(session)
const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const SteamStrategy = require('passport-steam').Strategy
const bodyParser = require('body-parser')

const fs = require('fs')
if(!fs.existsSync('data/')) {
    fs.mkdirSync('data')
}

const adapter = new FileSync('data/sessions.json', { defaultValue: [] })
const db = lowdb(adapter)

const userStore = require('./users')
const pileStore = require('./piles')
const voteStore = require('./votes')

require('dotenv').config()

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
        return done(null, userStore.getOrCreateUser(identifier))
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

app.get('/piles', ensureAuthenticated, (req, res) => res.render('piles', { piles: pileStore.getPiles(req.user) }))
app.get('/piles/create', ensureAuthenticated, (req, res) => res.render('pile_create', {}))
app.get('/piles/:id', ensureAuthenticated, (req, res) => {
    const pileId = req.params.id
    const pile = pileStore.getPileForUser(pileId, req.user)
    pile.items.forEach(item => {
        item.upvotes = voteStore.getUpvotes(item)
        item.downvotes = voteStore.getDownvotes(item)
    })
    const votes = pile.items.map(item => [item.identifier, voteStore.getVote(item, req.user)])
        .reduce((acc, curr) => ({
            ...acc,
            [curr[0]]: curr[1]
        }), {})
    res.render('pile_detail', { pile, votes, pageUrl: process.env.URL })
})
app.get('/piles/:id/share', ensureAuthenticated, (req, res) => {
    const pileId = req.params.id
    pileStore.sharePile(pileId, req.user)
    res.redirect(`/piles/${pileId}`)
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
    const pile = pileStore.getPileForUser(pileId, req.user)
    const item = pileStore.createItem(pile, name)
    voteStore.setupItemVotes(item)
    res.send(item)
})
app.put('/item/vote/up', ensureAuthenticated, (req, res) => {
    const pileId = req.body.pileId
    const itemId = req.body.itemId
    const pile = pileStore.getPileForUser(pileId, req.user)
    const item = getItemFromPile(pile, itemId)
    if (voteStore.getVote(item, req.user) === 'DOWN') {
        voteStore.removeVote(item, req.user)
        voteStore.addUpvote(item, req.user)
    } else if (voteStore.getVote(item, req.user) === 'UP') {
        voteStore.removeVote(item, req.user)
    } else if (voteStore.getVote(item, req.user) !== 'UP') {
        voteStore.addUpvote(item, req.user)
    }
    res.end()
})
app.put('/item/vote/down', ensureAuthenticated, (req, res) => {
    const pileId = req.body.pileId
    const itemId = req.body.itemId
    const pile = pileStore.getPileForUser(pileId, req.user)
    const item = getItemFromPile(pile, itemId)
    if (voteStore.getVote(item, req.user) === 'UP') {
        voteStore.removeVote(item, req.user)
        voteStore.addDownvote(item, req.user)
    } else if (voteStore.getVote(item, req.user) === 'DOWN') {
        voteStore.removeVote(item, req.user)
    } else if (voteStore.getVote(item, req.user) !== 'DOWN') {
        voteStore.addDownvote(item, req.user)
    }
    res.end()
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

const port = process.env.PORT | 3000
app.listen(port, () => console.log(`Server started at ${port}`))
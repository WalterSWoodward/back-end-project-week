// Libraries:
const { ExtractJwt } = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;
const passport = require('passport');
const LocalStrategy = require('passport-local');
const jwt = require('jsonwebtoken');

const User = require('./schemas/User');
const secret = 'no size limit on tokens';

function makeToken(user) {
  const timestamp = new Date().getTime();
  const payload = {
    sub: user._id,
    username: user.username,
    iat: timestamp
  };

  const options = { expiresIn: '300000' }; // 300,000 milliseconds or 5 minutes
  return jwt.sign(payload, secret, options);
}

const localStrategy = new LocalStrategy(function(username, password, done) {
  User.findOne({ username }, function(err, user) {
    if (err) {
      done(err);
    }
    if (!user) {
      done(null, false);
    }

    user.verifyPassword(password, function(err, isValid) {
      if (err) {
        return done(err);
      }
      if (isValid) {
        const { _id, username } = user;
        return done(null, { _id, username });
      }
      return done(null, false);
    });
  });
});

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

  secretOrKey: secret
};

const jwtStrategy = new JwtStrategy(jwtOptions, function(payload, done) {
  User.findById(payload.sub)

    .select('username race')
    .then(user => {
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    })
    .catch(err => {
      return done(err, false);
    });
});

passport.use(localStrategy);
passport.use(jwtStrategy);

const authenticate = passport.authenticate('local', { session: false });
const protected = passport.authenticate('jwt', { session: false });

module.exports = function(server) {

    server.get('/api/notes', protected, (req, res) => {
      // PSEUDO: You need to access ALL notes
      User.find({ username: req.body.username }) // ??? For now I'll just send back the username
        .select('-password')
        .then(notes => {
          res.json(notes);
        })
        .catch(err => {
          res.status(500).json(err);
        });
    });

  server.get('/', function(req, res) {
    res.send({ api: 'up and running' });
  });

  server.post('/api/register', function(req, res) {
    const credentials = req.body;
    const user = new User(credentials);
    user.save().then(inserted => {
      const token = makeToken(inserted);
      res.status(201).json(token);
    });
  });

  server.post('/api/login', authenticate, (req, res) => {
    res.json({
      success: `${req.user.username}, you are logged in!`,
      token: makeToken(req.user),
      user: req.user
    });
  });
};

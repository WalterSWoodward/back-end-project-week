const express = require('express');
const server = express();
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cors = require('cors');

const PORT = process.env.PORT || 5000;

server.use(helmet());
server.use(morgan('dev'));
server.use(express.json());
server.use(cors());

mongoose
  .connect(
    'mongodb:// pacManKana : LambdaN0t3s >@ds111050.mlab.com:11050/lambda-notes'
  )
  .then(cnn => {
    console.log('\n=== connected to mongo ===\n');
  })
  .catch(err => {
    console.log('\n=== ERROR connecting to mongo ===\n');
  });

// ==================================================== ROUTES.JS ======================================================= //

// ====================================================================================================================== //

// Libraries:
const { ExtractJwt } = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;
const passport = require('passport');
const LocalStrategy = require('passport-local');
const jwt = require('jsonwebtoken');

const User = require('./setup/users/User');
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


  server.get('/', (req, res) => {
    res.send({
      dummyData: [
        {
          title: 'Note Title 1',
          text:
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
          id: 1
        },
        {
          title: 'Note Title 2',
          text:
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
          id: 2
        },
        {
          title: 'Note Title 3',
          text:
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
          id: 3
        },
        {
          title: 'Note Title 4',
          text:
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
          id: 4
        },
        {
          title: 'Note Title 5',
          text:
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
          id: 5
        },
        {
          title: 'Note Title 6',
          text:
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
          id: 6
        }
      ]
    });
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

// ========= END OF ROUTES.JS ========== //


server.listen(PORT);

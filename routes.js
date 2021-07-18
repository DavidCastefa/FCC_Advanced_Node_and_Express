const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = (app, myDataBase) => {
  app.route('/').get((req, res) => {
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile');
    }
  );

  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };
  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/profile', {
      username: req.user.username
    });
  });

  app.get('/chat', ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/chat', {
      user: req.user
    });
  });

  app.route('/logout')   // vary from app.get('logout', (req, res) =>... for fun
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          const hash = bcrypt.hashSync(req.body.password, 12);
          myDataBase.insertOne({
              username: req.body.username,
              password: hash
            },
            (err, doc) => {
              if (err) {
                res.redirect('/');
              } else {
                // The inserted document is held within
                // the ops property of the doc
                next(null, doc.ops[0]);
              }
            }
          )
        }
      })
      },
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => {
        res.redirect('/profile');
      }
    );

  app.get('/auth/github',
    passport.authenticate('github')
  );
  app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
      req.session.user_id = req.user.id;
      res.redirect('/chat');
    }
  );

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}

module.exports = function(app, passport){

  app.get('/', function(req, res){
    res.render('index');
  });

  // Twitter
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/secret', failureRedirect: '/login' }));

  // Todoist
  app.get('/auth/todoist', passport.authenticate('todoist', { scope: 'data:read_write'}));
  app.get('/auth/todoist/callback', passport.authenticate('todoist', {successRedirect: '/profile', failureRedirect: '/'}));

  app.get('/profile', function(req, res){
    var user = req.user;
    console.log(user);
    res.render('profile', {user: user});
  });
}
var request = require('request')

module.exports = function(app, passport){

  app.get('/', function(req, res){
    res.render('index');
  });

  // Twitter
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/secret', failureRedirect: '/login' }));

  // TODOIST

  //Authentication
  app.get('/auth/todoist', passport.authenticate('todoist', { scope: 'data:read_write'}));
  app.get('/auth/todoist/callback', passport.authenticate('todoist', {successRedirect: '/todoist', failureRedirect: '/'}));

  //Load Todoist Page
  app.get('/todoist', function(req, res){
    global.backendUser = req.user.todoist;
    global.frontendUser = todoistUser(req.user.todoist);
    res.render('todoist', {user: frontendUser});
  });

  function todoistUser(userInput){
    var tempUser = {
      full_name: userInput.full_name
    }
    return tempUser
  }

  //Todoist API calls
  var syncURL = 'https://todoist.com/API/v7/sync'

  app.get('/api/todoist/projects', function(req, res){
    //Make request to get all projects
    todoistRequest(backendUser, 'projects', 'todoist', {user: frontendUser}, res);
  });

  app.get('/api/todoist/tasks', function(req, res){
    //Make request to get all tasks- referred to as items by Todoist API
    todoistRequest(backendUser, 'items', 'todoist', {user: frontendUser}, res);
  });

  function todoistRequest(user, dataField, template, localVariables, res){
    var callOptions = {
      url: syncURL,
      method: 'POST',
      form: {
        token: user.access_token,
        sync_token: '*',
        resource_types: JSON.stringify([dataField])
      }
    };
    request(callOptions, function (error, response, body) {
      if (error){
        return [{message: 'Error retrieving data'}]
      }
      var rawData = parseRawData(body,dataField);

      localVariables.projectlist = rawData;
      res.json(rawData);
    });
  }

  function parseRawData(rawData,dataField){
    rawData = JSON.parse(rawData);
    if (dataField == 'projects'){
      rawData = rawData.projects
      return rawData
    }
    if (dataField == 'items'){
      rawData = rawData.items
      return rawData
    }
  }
}
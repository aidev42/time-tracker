var request = require('request')
// Load models
var User = require('../model/user');
var Task = require('../model/tasks');

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

  //Check/update task and time data
  app.post('/todoist/workingtask', function(req, res){
    console.log('now in routes')
    console.log('backendUser.id')
    //check database to see if tasks exists. if not: save to database. If yes, check existing timeElapsed value and pass it back to the frontend
    User.findOne({
      //ADD AUTHENTIFICATION
      //_id: req.user._id,
      tasks: {$elemMatch: {taskID: req.body.task.id}}
    },
    function(err, user){
      if(err){ return err; }

      if(!user){
        console.log('creating new task')
        //create new task within current backendUser
        User.findOne({
          'todoist.id': backendUser.id
        },
        function(err,user){
          if(err){ return err; }
          if(!user) { console.log('couldnt find any user')}

          else{
            var task = new Task({
              'task_name': req.body.task.content,
              'taskID': req.body.task.id,
              'project_name': req.body.projectName,
              'projectID': req.body.task.project_id,
              'ownerID': req.body.task.user_id,
              'timeElapsed': req.body.elapsed,
              'estimatedTime': 0
          })}
          task.save(function(err){
            if(err) console.log('error saving task' + err);
          });
          console.log('task should have been saved')
          console.log('logging tasks: '+ user.tasks)
        }
        )
      }
      //Task already exists since user was found by child taskID
      else{
        //Need to get timeElapsed property from specific task
        console.log('getting existin task data')
        var userTasks = user.tasks;
        var elapsed = 0;
        for (i=0; i< userTasks.length; i++){
          if (userTasks[i].taskID == req.body.task.id){
            elapsed = userTasks[i].timeElapsed;
            break
          }
        }
        //now return this to the front end
        console.log('this much time has gone:' + elapsed)
        res.json(elapsed)
      }
    });
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
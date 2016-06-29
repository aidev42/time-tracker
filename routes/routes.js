var request = require('request')
// Load models
var User = require('../model/user');
var Task = require('../model/task');

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

  //Load Todoist Pages
  app.get('/todoist', function(req, res){
    global.backendUser = req.user.todoist;
    global.frontendUser = todoistUser(req.user.todoist);
    res.render('todoist', {user: frontendUser});
  });

  app.get('/todoistanalyze', function(req, res){
    res.render('todoistanalyze', {user: frontendUser});
  });

  //Update store elasped time value every X seconds
  app.post('/todoist/updatetask', function(req, res){
    console.log('now in routes to update time')
    console.log('this is current elapsed value: '+ req.body.timeElapsed)
    Task.findOne({
    'taskID': req.body.task.id
    },
    function(err, task){
      if(err){ return err; }

      //we know the task already exists
      else{
        //Need to get timeElapsed property from specific task
        console.log('updating time')
        console.log(task)
        task.timeElapsed = req.body.timeElapsed
        task.save(function(err){
          if(err) console.log('error saving task' + err);
        });
        res.json('updated')
      }
    });
  });

  //Add a time estimation to the task
  app.post('/todoist/estimatetask', function(req, res){
    console.log('now in routes to estimate time')
    console.log('this is input estimate: '+ req.body.estimate)
    Task.findOne({
    'taskID': req.body.task.id
    },
    function(err, task){
      if(err){ return err; }

      //we know the task already exists
      else{
        //Need to get estimatedTime property from specific task
        console.log('updating estimate')
        console.log(task)
        task.estimatedTime = req.body.estimate * 60
        task.save(function(err){
          if(err) console.log('error saving task' + err);
        });
        res.json('updated')
      }
    });
  });

  //Check/update task and time data
  app.post('/todoist/workingtask', function(req, res){
    console.log('now in routes')
    console.log('this is current elapsed value: '+ req.body.timeElapsed)
    //check database to see if tasks exists. if not: save to database. If yes, check existing timeElapsed value and pass it back to the frontend
    console.log('this is the seen task id number: ' +req.body.task.id)
    var needEstimation = 0;
    Task.findOne({
      //ADD AUTHENTIFICATION
      //_id: req.user._id,
      'taskID': req.body.task.id
    },
    function(err, task){
      if(err){ return err; }

      if(!task){
        console.log('creating new task')
        //create new task
        var task = new Task({
          'task_name': req.body.task.content,
          'taskID': req.body.task.id,
          'project_name': req.body.projectName,
          'projectID': req.body.task.project_id,
          'ownerID': req.body.task.user_id,
          'timeElapsed': req.body.timeElapsed,
          'estimatedTime': 0
        })
        console.log(task)
        task.save(function(err){
          if(err) console.log('error saving task' + err);
          return task;
        });
        //since we are just creating the task for the first time, send back an indication that we to get the user input for
        var needEstimation = -1;
        res.json(needEstimation)
      }
      //Task already exists
      else{
        //Need to get timeElapsed property from specific task
        console.log('getting existing task data')
        console.log(task)
        var elapsed = task.timeElapsed;
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
var request = require('request')
// Load models
var User = require('../model/user');
var Task = require('../model/task');

module.exports = function(app, passport){

  app.get('/', function(req, res){
    res.render('index');
  });

  // Trello
  app.get('/auth/trello', passport.authenticate('trello'));
  app.get('/auth/trello/callback', passport.authenticate('trello', {successRedirect: '/trello', failureRedirect: '/'}));

  app.get('/trello', function(req, res){
    // Does this save backendUser to ALL sessions?
    console.log('in routes now', req.user)
    global.backendUser = req.user.trello;
    global.frontendUser = req.user.trello;
    res.render('trello', {user: frontendUser});
  });

  app.get('/trelloanalyze', function(req, res){
    res.render('trelloanalyze', {user: frontendUser});
  });

  // TODOIST

  //Authentication
  app.get('/auth/todoist', passport.authenticate('todoist', { scope: 'data:read_write'}));
  app.get('/auth/todoist/callback', passport.authenticate('todoist', {successRedirect: '/todoist', failureRedirect: '/'}));

  //Load Todoist Pages
  app.get('/todoist', function(req, res){
    // Does this save backendUser to ALL sessions?
    global.backendUser = req.user.todoist;
    global.frontendUser = req.user.todoist
    res.render('todoist', {user: frontendUser});
  });

  app.get('/todoistanalyze', function(req, res){
    res.render('todoistanalyze', {user: frontendUser});
  });

  app.get('/gettaskdata',function(req,res){
    Task.find({
     //find all tasks with the owner id which matches current backend user id
     'ownerID': backendUser.id
    },
    function(err, taskArray){
      if(err){ return err; }
      else{
        res.json(taskArray)
      }
    });
  });

  //Update store elasped time value every X seconds
  app.post('/updatetask', function(req, res){
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
  app.post('/estimatetask', function(req, res){
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
  app.post('/workingtask', function(req, res){
    console.log('now in routes')
    console.log('this is current elapsed value: '+ req.body.timeElapsed)
    //check database to see if tasks exists. if not: save to database. If yes, check existing timeElapsed value and pass it back to the frontend
    console.log('this is the seen task id number: ' +req.body.task.id)
    var needEstimation = 0;
    Task.findOne({
      //ADD AUTHENTIFICATION- can easily add by checking in incoming tasks's owner ID matches current backend user ID
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
          // make this the global user
          'ownerID': backendUser.id,
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
    console.log('done creating or updating task')
    });
  });

  //Trello API calls
  var trelloURL = 'https://api.trello.com/1/'
  var TrelloKey = require('../APIkeys/config.json').trello.appID;

  app.get('/api/trello/boards', function(req, res){
    //Make request to get all projects
    var queryString = 'members/'+backendUser.id+'/boards?'
    trelloRequest(queryString,'boards', 'trello', {user: frontendUser}, res);
  });

  app.post('/api/trello/cards', function(req, res){
    //Make request to get all lists and cards
    var queryString = 'boards/'+req.body.boardID+'/lists?cards=open&card_fields=name&fields=name&'
    trelloRequest(queryString,'cards', 'trello', {user: frontendUser}, res);
  });

  function trelloRequest(queryString, dataField, template, localVariables, res){
    var callOptions = {
      url: trelloURL + queryString + 'key='+TrelloKey+'&token='+backendUser.access_token,
      method: 'GET'
    };
    console.log('queryURL',callOptions.url);
    request(callOptions, function (error, response, body) {
      if (error){
        return [{message: 'Error retrieving data'}]
      }
      var rawData = parseRawData(body,dataField);

      localVariables.projectlist = rawData;
      res.json(rawData);
    });
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
    if (dataField == 'boards'){
      rawData = rawData
      return rawData
    }
    if (dataField == 'cards'){
      rawData = rawData
      return rawData
    }

  }
}
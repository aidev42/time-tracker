//array of object with task id, task content, project name, project id and time elapsed

var mongoose = require('mongoose');

var taskSchema = mongoose.Schema({
  //task name
  task_name: String,
  //task id
  taskID: Number,
  //project name
  project_name: String,
  //project id
  projectID: Number,
  //owner's user ID
  ownerID: Number,
  //time elapsed stored in seconds
  timeElapsed: Number,
  //estimated time stored in seconds
  estimatedTime: Number
})

// create the model for users and expose it to our app
module.exports = mongoose.model('Task', taskSchema);
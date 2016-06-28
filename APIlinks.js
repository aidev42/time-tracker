//Todoist

//run ajax query to return array of projects

var mongoose = require('mongoose');

// 1. loop through users and check for updates, if updated store into updated array
// 2. using updated array use socket to broadcast message, hey we got an update check if you are inside this list, if so rerun ajax calls
// 3.
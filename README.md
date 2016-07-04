# Time-Tracker

##What is it?
A plugin to existing 'to do' and workflow management systems to help better keep track of time spend, inefficiencies and time estimation.

##Currently supported 3rd party management systems:
- [Todoist] (https://doist.com/)
- [Trello] (https://trello.com/)

## Features and How to use?
To use, simply login via your existing Todoist or Trello account via Oauth handled by [Passport.js] (http://passportjs.org/). On the 'Main' page you will see all your current projects/boards (Todoist/Trello). By clicking a project/board, you will see all the current tasks/cards associated with that project/board. By clicking a task/card you set it to the currently working task, which does three things:
1) It begins a timer that tracks how long the task takes to complete
2) If no estimate already exists it prompts the user to estimate how long task will take to complete in minutes
3) For Trello, it moves the card to your designated 'working' or 'to do' list in your board

For Trello you can also drag and drop cards directly in the time-tracker app to rearrange cards in your Trello account.

Once you have data regarding completed tasks, the 'Analyze' page creates visualizes for the user based on their unique data. The top chart displays by project/board the ratio of Estimated Time / Realized Time- to guage how much longer or shorter things typically take then first estimated. By clicking on a given project/board you can see the same breakdown at the task/card level.

The bottom pie chart displays the ratios of actual realized time you have spent on each project/board, or when drilled down into a project/board on each task/card.

## Credits

  - [Matt R O'Connor](http://github.com/mattroconnor)

## License

ISC

Copyright (c) 2016

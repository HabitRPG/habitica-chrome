# [HabitRPG](http://habitrpg.com) browser extensions

### sadly the feature set differs from the official extension... for now;)

### pros:
- site watcher funcionality can turn off
- site watcher can control per day and per hours
- site watcher can control via a website. only detect sites when that site is opened.
- todo page binds (asana, workflowy, google task)
- tomato.es bind. gain exp for every pomodore and loose hp if you over working/breaking the time intervals :)
- also can control the site watcher via tomato.es. only detect sites when you are in a pomodore flow. (on break the vice/good sites are swapped:)

### cons:
- not has a styled options
- not has an action icon
- does not notify on low hp

## About the development
The main goal is keeping away the core code from the browser dependency, so it can use in multiple platform. 
But since every browser has an own extension structure it's not an easy task...

The tools which are help achive that holy goal:

- small separated files
- event based communication
- build system which pack everything together

## Development environment setup
The build system is the [Grunt](http://gruntjs.com/) task runner. If you don't know definitely check it (life saver stuff:).

- The first step is get the [nodejs](http://nodejs.org/download/) and install.
- Secondly get the grunt-cli package `npm install -g grunt-cli`
- And the final step is go to the root of the cloned folder and type `npm install` and it will download all necessary stuff

That's is. You are ready to build some awesome feature :)

## Build system commands
All grunt command must be writen to the terminal (cmd on windows) in the root of the cloned directory.

      grunt # check all javascript file for syntax error
  
      grunt chrome # copy and merge all necessary file to the builds/chrome folder
  
      grunt test_core # run the unit test on the core
  
      grunt watch:core # continuous watch the core and test/core folders
                       # and run jslint and unit test on every save
                   
      grunt watch:chrome # continuous watch the chrome dependency folders 
                         # and run the chrome command on every save
                     
If these not enough for you check the grunt file it has some others and of course fill free to expand :)
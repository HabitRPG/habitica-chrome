HabitRPG Chrome Extension
=========================

The main purpuse same as the [original](https://github.com/lefnire/habitrpg-chrome)

Note:
The extension only use the background and options javascript files (and jquery).
(Don't forget change the sandbox state)

Differences:
------------
    - complete code rewrite ( only the app.js contains chrome code and the activators.js for webpage wacthing, 
      so hopfully easy to transfer to other browsers )
    - the score counting was unified. the script run in the background and watch for tab activation and window focus 
      change. if that detect a listed site store in the memory and do nothing until you the change tab/domain or chrome 
      lost the focus. if it happend the extension compute the score based.
    - the reached score send to the server only every 5 minutes (or whatever based on the user settings 
      (min 1 minutes)). so if you spend 2.5 min on a bad site and 2.5 min on a good side you lost some HP because 
      the bad site worth more in negative context :)
    - user data can store in the cloud (change the comment line in the app.js/options.js)
    - ability to setting a control website (or the chrome focus lost). if this website present in a chrome window, then
      the script will watch for good and bad sites.
    - Day activator (the script auto active itself based on the user settings (which day, which time interval))
    
Roadmap:
--------
    - Pomodoro activator ( with tomato.es )
    - styled options

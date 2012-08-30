chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method === "getLocalStorage") {
      sendResponse({data: localStorage});
    } 
    else if (request.method === "showNotification") {
      spec = request.notification;
      notification = webkitNotifications.createNotification(spec.icon, spec.title, spec.text);
      notification.show();
      setTimeout(function(){notification.close();}, spec.time);
    }
    else {
      sendResponse({}); // snub them.
    }
});


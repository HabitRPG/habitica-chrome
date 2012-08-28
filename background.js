chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getLocalStorage")
      sendResponse({data: localStorage});
    else
      sendResponse({}); // snub them.
});
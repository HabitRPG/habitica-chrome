jQuery('document').ready(function(){
    
  //var storage = chrome.storage.managed;
  var storage = chrome.storage.local;
  
  storage.get({
      uid:'',
      watchedUrl: '',
      isActive: 'false',
      sendInterval: '5',
      activatorName: 'alwayon',
      viceDomains: 'reddit.com\n9gag.com\nfacebook.com',
      goodDomains: 'lifehacker.com\ncodeacadamy.com\nkhanacadamy.org',
    }, 
    restore);

  function restore(params) {
    
    for (var name in params) {
      var el = $('#'+name);

      if (el.is('input[type=checkbox]'))
          el.attr('checked', params[name] == 'true');
      else 
        el.val(params[name]);

    }
    
    init();
  }

  function init() {

    $('#habitrpgForm').submit(save);
    $('#uid').bind('change', setEmptyUIDState());
    $('#activatorName').bind('change', changeActivatorOptions());

  }

  function save () {

    var data = {};

    $('input, textarea, select').each(function(){
      var el = $(this),
          name = el.attr('id');

      if (el.is('input[type=checkbox]'))
        data[name] = el.is(':checked') ? 'true' : 'false';
          
      else  
        data[name] = el.val();
    
    });

    // strogae.set only passthrough the really changed data
    // so this line is a hack for the real formOptions control :(
    if (data.activatorName != 'fromOptions') data.isActive = true;
    
    storage.set(data, function(data) {
      $("#status").addClass('good');
      setTimeout(function() {$("#status").removeClass('good')}, 2000);
      }
    );

    return false; //don't refresh page
  }

  function setEmptyUIDState() {
    var input = $('#uid'),
        message = $('#EmptyUID');

    setEmptyUIDState = function() {
      if (input.val())
        message.removeClass('bad');
      else
        message.addClass('bad');
    }
    
    setEmptyUIDState();

    return setEmptyUIDState;
  }

  function changeActivatorOptions() {
    var select = $('#activatorName'),
        options = $('#ActivatorOptions');

    changeActivatorOptions = function() {
      options.find('.visible').removeClass('visible');
      $('#ActOpts-'+select.val()).addClass('visible');
    }

    changeActivatorOptions();

    return changeActivatorOptions;
  }

});

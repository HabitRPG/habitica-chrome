jQuery('document').ready(function(){
    
  //var storage = chrome.storage.managed;
  var storage = chrome.storage.local;
  
  storage.get({
      uid:'',
      isActive: 'false',
      sendInterval: '5',
      activatorName: 'alwayon',
      viceDomains: 'reddit.com\n9gag.com\nfacebook.com',
      goodDomains: 'lifehacker.com\ncodeacadamy.com\nkhanacadamy.org',
    }, 
    restore);

   function restore(params) {
    
    $('#uid').val(params.uid);
    $('#activatorName').val(params.activatorName);

    $('#sendInterval').val(params.sendInterval);
    $('#viceDomains').val(params.viceDomains);
    $('#goodDomains').val(params.goodDomains);

    if (params.isActive == 'true')
      $('#isActive').attr('checked', true);

    init();
  }

  function init() {

    $('#habitrpgForm').submit(save);
    $('#uid').bind('change', setEmptyUIDState());
    $('#activatorName').bind('change', changeActivatorOptions());

  }

  function save () {

    storage.set({
      uid: $('#uid').val(),
      viceDomains: $('#viceDomains').val(),
      goodDomains: $('#goodDomains').val(),
      sendInterval: $('#sendInterval').val(),
      activatorName: $('#activatorName').val(),
      isActive: $('#isActive').is(':checked') ? 'true' : 'false'

    }, 
      function(){
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

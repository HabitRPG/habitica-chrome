jQuery('document').ready(function(){
    
  //var storage = chrome.storage.managed;
  var storage = chrome.storage.local;
  
  var Options= {
        restore: function(params) {
      
          for (var name in params) {
            var el = $('#'+name);

            if (name == 'days')
                DaySettings.setView(params[name]);

            if (el.is('input[type=checkbox]'))
                el.attr('checked', params[name] == 'true');
            else 
              el.val(params[name]);

          }
          
          Options.init();
        },

        init: function() {
          $('#habitrpgForm').submit(Options.save);
          $('#uid').bind('change', EventHandlers.setEmptyUIDState());
          $('#activatorName').bind('change', EventHandlers.changeActivatorOptions());

        },

        save: function() {
          var data = {};

          $('input, textarea, select').each(function(){
            var el = $(this),
                name = el.attr('id');

            if (name.indexOf('days-')==0) return;

            if (el.is('input[type=checkbox]'))
              data[name] = el.is(':checked') ? 'true' : 'false';
                
            else  
              data[name] = el.val();
          
          });

          data.days = DaySettings.getDataFromView();
          
          storage.set(data, function(data) {
            $("#status").addClass('good');
            setTimeout(function() {$("#status").removeClass('good')}, 2000);
            }
          );

          return false; //don't refresh page
        }
    },

    EventHandlers = {

      setEmptyUIDState: function() {
        var input = $('#uid'),
          message = $('#EmptyUID'),
          fn = function() {
          if (input.val())
            message.removeClass('bad');
          else
            message.addClass('bad');
          };
        
        fn();
        EventHandlers.setEmptyUIDState = fn;

        return fn;
      },

      changeActivatorOptions: function() {
        var select = $('#activatorName'),
            options = $('#ActivatorOptions'),
            fn = function() {
              options.find('.visible').removeClass('visible');
              $('#ActOpts-'+select.val()).addClass('visible');
            };

        fn();
        EventHandlers.setEmptyUIDState = fn;

        return fn;
      }
    },

  DaySettings = {

    view: $('#ActOpts-days'),

    setView: function(data) {
      var data = typeof data == 'string' ? JSON.parse(data) : data, inner = '', day,
          dayList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          getNumbInput = function(id, value, isHour ) {
            return '<input type="number" id="'+id+'" value="'+value+'" min="0" max="'+(isHour ? '23' : '59')+'" />';
          };

      for (var i in dayList) {
        day = dayList[i];
        inner +='<div class="day">'+day+'<br />';
        inner += '<label>Active:</label><input type="checkbox" id="days-'+day+'-isActive"'+(data[day].active ? 'checked=true' : '')+'/><br />';
        inner += '<label>Start:</label>'+getNumbInput('days-'+day+'-sH', data[day].start[0], true);
        inner += ':'+getNumbInput('days-'+day+'-sM', data[day].start[1], false)+'<br />';
        inner += '<label>End: </label>'+getNumbInput('days-'+day+'-eH', data[day].end[0], true);
        inner += ':'+getNumbInput('days-'+day+'-eM', data[day].end[1], false);
        inner +='</div>';
      }

      this.view.html(inner);
      
    },

    getDataFromView: function() {
      var data = {}, temp = defaultOptions.days;

      for (var day in temp) {
        data[day] = {
          active: this.view.find('#days-'+day+'-isActive').is(':checked'),
          start: [parseInt(this.view.find('#days-'+day+'-sH').val()), parseInt(this.view.find('#days-'+day+'-sM').val())],
          end: [parseInt(this.view.find('#days-'+day+'-eH').val()), parseInt(this.view.find('#days-'+day+'-eM').val())]
        }
      }

      return data;
    }

  };

  storage.get(defaultOptions, Options.restore);

});

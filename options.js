jQuery('document').ready(function(){

	// Restore saved values
	$('#uid').val(localStorage.uid);

	$('#apiToken').val(localStorage.apiToken);

	if(localStorage.workStart) {
		$('#workStart').val(localStorage.workStart);
	}else {
		$('#workStart').val("0");
	}

	if(localStorage.workEnd) {
		$('#workEnd').val(localStorage.workEnd);
	}else {
		$('#workEnd').val("24");
	}

	if(localStorage.interval) {
		$('#interval').val(localStorage.interval);
	}else {
		$('#interval').val("5");
	}

	if(localStorage.viceDomains) {
		$('#viceDomains').val(localStorage.viceDomains);
	}

	if(localStorage.goodDomains) {
		$('#goodDomains').val(localStorage.goodDomains);
	}

	// Let users know about the work hours error early
	jQuery('#workHours input').on('change', function(e) {
		var start = parseInt($('#workStart').val());
		var end = parseInt($('#workEnd').val());
		if (start >= end) {
			$('#workHours').addClass('alert-error');
		}
		else {
			$('#workHours').removeClass('alert-error');
		}
	});

	// Saves options to localStorage.
	jQuery('#habitrpgForm').on('submit', function(e){
		e.preventDefault();
		localStorage["uid"] = $('#uid').val();
		localStorage["apiToken"] = $('#apiToken').val();
		localStorage["interval"] = $('#interval').val();

		viceStripped = $('#viceDomains').val().replace(/^\s*$[\n\r]{1,}/gm, '');
		localStorage["viceDomains"] = viceStripped;
		goodStripped = $('#goodDomains').val().replace(/^\s*$[\n\r]{1,}/gm, '');
		localStorage["goodDomains"] = goodStripped;    

		var work1 = parseInt($('#workStart').val());
		var work2 = parseInt($('#workEnd').val());

		$('#messages > div').each(function() {
			$(this).fadeOut('slow', function() {
				$(this).remove();
			});
		});

		$alert = $($('#hidden .alert').clone().wrap('<div></div>').parent().html()).hide();
		if( work1 >= work2 ){
			$alert.addClass('alert-error')
				.append('<h3>Work Hours Error</h3>The first number must be lower than the second');
			$('#workHours').addClass('alert-error');
		} else {
			localStorage["workStart"] = $('#workStart').val();
			localStorage["workEnd"] = $('#workEnd').val();
			$alert.addClass('alert-success')
				.append('Options Saved');
		}
		$('#messages').append($alert);
		$alert.fadeIn();
	});

	jQuery('#alwaysOn').on('click', function(e) {
		$('#workStart').val(0);
		$('#workEnd').val(23);
		$('#workStart').change();
	});

});
function syncStorage(keyNameString, value){
		var dataObj = {};
		dataObj[keyNameString] = value;
		chrome.storage.sync.set(dataObj);	
}

jQuery('document').ready(function(){
	// Restore saved values	
	// GET synced values first

	$('#uid').val(localStorage.uid);

	$('#apiToken').val(localStorage.apiToken);
	
	var updateFields = function(){
	if(localStorage.workStart != "undefined") {
		$('#workStart').val(localStorage.workStart);
	} else {
		$('#workStart').val("0");
	}

	if(localStorage.workEnd != "undefined") {
		$('#workEnd').val(localStorage.workEnd);
	} else {
		$('#workEnd').val("24");
	}	
	
	if(localStorage.interval != "undefined") {
		$('#interval').val(localStorage.interval);
	}else {
		$('#interval').val("5");
	}

	if(localStorage.viceDomains != "undefined") {
		$('#viceDomains').val(localStorage.viceDomains);
	} else {
		$('#viceDomains').val("reddit.com\n9gag.com\nfacebook.com");
	}

	if(localStorage.goodDomains != "undefined") {
		$('#goodDomains').val(localStorage.goodDomains);
	} else {
		$('#goodDomains').val("lifehacker.com\ncodecademy.com\nkahnacademy.com");
	}
	}
	updateFields();

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
		var uid = $('#uid').val();
		var apiToken = $('#apiToken').val();
		syncStorage("uid", uid);
		syncStorage("apiToken", apiToken);
		
		localStorage["uid"] = uid;
		localStorage["apiToken"] = apiToken;

		var intervalSync = $('#interval').val();
		syncStorage("interval", intervalSync);
		localStorage["interval"] = intervalSync;

		viceStripped = $('#viceDomains').val().replace(/^\s*$[\n\r]{1,}/gm, '');
		syncStorage("viceDomains", viceStripped);
		localStorage["viceDomains"] = viceStripped;
		goodStripped = $('#goodDomains').val().replace(/^\s*$[\n\r]{1,}/gm, '');
		syncStorage("goodDomains", goodStripped);
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
			
			var workStartSync = $('#workStart').val();
			syncStorage("workStart", workStartSync);
			localStorage["workStart"] = workStartSync;
			
			var workEndSync = $('#workEnd').val();
			syncStorage("workEnd", workEndSync);
			localStorage["workEnd"] = workEndSync;
			
			$alert.addClass('alert-success')
				.append('Options Saved');
		}
		$('#messages').append($alert);
		$alert.fadeIn();
	});

	jQuery('#alwaysOn').on('click', function(e) {
		$('#workStart').val(0);
		$('#workEnd').val(24);
		$('#workStart').change();
	});

	//Load all data we have. Only called on the redownload button to save repeated queries. 
	//There HAS to be a way to bundle this as one data object.
	//I just haven't thought about it yet.
	var loadSyncedData = function(){
	chrome.storage.sync.get("uid", function(result){
	localStorage["uid"] = (result["uid"]);
	});

	chrome.storage.sync.get("apiToken", function(result){
	localStorage["apiToken"] = (result["apiToken"]);
	});

	chrome.storage.sync.get("workStart", function(result){
	localStorage["workStart"] = (result["workStart"]);
	});
	
	chrome.storage.sync.get("workEnd", function(result){
	localStorage["workEnd"] = (result["workEnd"]);
	});
	
	chrome.storage.sync.get("interval", function(result){
	localStorage["interval"] = (result["interval"]);
	});

	chrome.storage.sync.get("viceDomains", function(result){
	localStorage["viceDomains"] = (result["viceDomains"]);
	});

	chrome.storage.sync.get("goodDomains", function(result){
	localStorage["goodDomains"] = (result["goodDomains"]);
	//Ensures that data is updated right when the last piece of data has been received.	
	updateFields();
	});	
	}
	
	jQuery('#reDownload').on('click', function(e) {
		loadSyncedData();
	});

});

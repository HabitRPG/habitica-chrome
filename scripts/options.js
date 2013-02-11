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
		$('#interval').val("1");
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
	
	if(localStorage.workMon != "undefined") {
		$('#workMon')[0].checked = (localStorage.workMon == "true")
	}else {
		$('#workMon')[0].checked = true;
	}
	
	if(localStorage.workTues != "undefined") {
		$('#workTues')[0].checked = (localStorage.workTues == "true")
	}else {
		$('#workTues')[0].checked = true;
	}
	
	if(localStorage.workWed != "undefined") {
		$('#workWed')[0].checked = (localStorage.workWed == "true")
	}else {
		$('#workWed')[0].checked = true;
	}
	
	if(localStorage.workThur != "undefined") {
		$('#workThur')[0].checked = (localStorage.workThur == "true")
	}else {
		$('#workThur')[0].checked = true;
	}
	
	if(localStorage.workFri != "undefined") {
		$('#workFri')[0].checked = (localStorage.workFri == "true")
	}else {
		$('#workFri')[0].checked = true;
	}
	
	if(localStorage.workSat != "undefined") {
		$('#workSat')[0].checked = (localStorage.workSat == "true")
	}else {
		$('#workSat')[0].checked = false;
	}
	
	if(localStorage.workSun != "undefined") {
		$('#workSun')[0].checked = (localStorage.workSun == "true")
	}else {
		$('#workSun')[0].checked = false ;
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
		
		var mon = $('#workMon')[0].checked;
		var tues = $('#workTues')[0].checked;
		var wed = $('#workWed')[0].checked;
		var thur = $('#workThur')[0].checked;
		var fri = $('#workFri')[0].checked;
		var sat = $('#workSat')[0].checked;
		var sun = $('#workSun')[0].checked;
		
		
		syncStorage("workMon", mon);
		syncStorage("workTues", tues);
		syncStorage("workWed", wed);
		syncStorage("workThur", thur);
		syncStorage("workFri", fri);
		syncStorage("workSat", sat);
		syncStorage("workSun", sun);
		
		localStorage["workMon"] = mon;
		localStorage["workTues"] = tues;
		localStorage["workWed"] = wed;
		localStorage["workThur"] = thur;
		localStorage["workFri"] = fri;
		localStorage["workSat"] = sat;
		localStorage["workSun"] = sun;
		
		

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
	
	chrome.storage.sync.get("workMon", function(result){
	localStorage["workMon"] = (result["workMon"]);
	});
	chrome.storage.sync.get("workTues", function(result){
	localStorage["workTues"] = (result["workTues"]);
	});
	chrome.storage.sync.get("workWed", function(result){
	localStorage["workWed"] = (result["workWed"]);
	});
	chrome.storage.sync.get("workThur", function(result){
	localStorage["workThur"] = (result["workThur"]);
	});
	chrome.storage.sync.get("workFri", function(result){
	localStorage["workFri"] = (result["workFri"]);
	});
	chrome.storage.sync.get("workSat", function(result){
	localStorage["workSat"] = (result["workSat"]);
	});
	chrome.storage.sync.get("workSun", function(result){
	localStorage["workSun"] = (result["workSun"]);
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

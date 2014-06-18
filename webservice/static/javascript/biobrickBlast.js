/**
 *
 * @authors Min Huang (huangm.ss.sysu@gmail.com)
 * @date    2014-05-04 23:38:22
 * @version $1.0$
 */
 
var tbody = $('#resultTbody'),
	inputForm = $('form#userInput'),
	querybtn = $('#btn-query'),
	tableModal = $('#tableModal'),
	tableModalHead = $('#tableModal .header'),
	textModal = $('#textModal'),
	textModalHead = $('#textModal .header'),
	textModalContent = $('#textModal textarea'),
	originTable = $('#originTable'),
	userGuideModal = $('#userGuideModal'),
	btnArrowLeft = userGuideModal.find('.btn-arrow.left'),
	btnArrowRight = userGuideModal.find('.btn-arrow.right'),
	inputExample_text = $('#inputExample-txt').contents().find('pre').text(),
	inputFile = $('input.filePrew'),
	cloneTable = $('#cloneTable'),
	circleTab = userGuideModal.children('.circleTab'),
	result = new Object(),
	addTask_id,
	resizeTimeTask;

$(init);



function init() {
	$('.ui.selection.dropdown').dropdown();
	tableModal.modal();
	textModal.modal();
	userGuideModal.modal();



	// load task locally
	if (window.localStorage.getItem('task') 
		&& window.localStorage.getItem('task') !== '') {

		var arr = $.parseJSON(window.localStorage.task);
		// no more than 10 task_id
		while (arr.length>10){
			arr.shift();
		}
		for (var i = 0; i < arr.length; i++) {
			paintTask(i);
		}
	}

	

	

	$('#scrollDiv').scroll(function (){
		var _t = this;
		cloneTable.css('top', _t.scrollTop+'px');
	});

	$('#taskQuery button').click(function(e) {
		e.preventDefault();
		addTask_id = $(this).prev().val();
		$.getJSON('/status/' + addTask_id)
			.done(addTask)
			.fail(ajaxError);
	});

	$('#btn-inputExample').click(function (){
		$('#inputText').val(inputExample_text);
	});

	// load users last dropdown input
	$('div.inputSequences [cached]').each(function (){
		var key = $(this).attr('cached'),
			value = window.localStorage.getItem(key) || $(this).val(),
			_t = $(this);
		if (key==='evalue' || key==='database'){
			_t.val(value).next().text(value);
		}
	}).change(function() {
		window.localStorage.setItem($(this).attr('cached'), $(this).val());
	}).change();

	// submit query
	querybtn.click(function(e) {
		e.preventDefault();
		this.className = "ui loading button";
		submitInput();
		return false;
	});

	$('#btn-clean').click(function(){
		$('#inputText').val("");
		inputFile.val("").change();
	});

	// show result or information
	tbody.click(function(e) {
		_t = e.target;
		var task_id = $(_t).attr('task-id');
		if (_t.className === 'ui green button') {
			//if cached
			if (typeof result[task_id] !== 'undefined') {
				paintTable(task_id);

			} else {
				$(_t).html('<i class="icon loading"></i>');
				$.getJSON('/result/' + task_id)
					.done(function(data) {
						var dataArr;
						if (data.errno === 0) {
							dataArr = data.result;
							// be transfromed to table
							if (typeof dataArr === 'object') {
								result[task_id] = dataArr;
								paintTable(task_id);
							} else {
								// output directly
								textModalHead.text('Task_id : ' + task_id).css('color', '#119000');
								textModalContent.val(data.result)
								textModal.modal('show');
							}
						} else {
							textModalHead.text('Task_id : ' + task_id).css('color', '#119000');
							textModalContent.val(data.err_mag + data.msg)
							textModal.modal('show');
						}

						$(_t).text('show');
					}).fail(ajaxError);
			}
		} else if (_t.className === 'ui red button') {
			var num = $(_t).attr('num'),
				arr = $.parseJSON(window.localStorage.task);
			textModalHead.text('Task_id : ' + task_id).css('color', '#CD2929');
			textModalContent.text(arr[num].msg);
			textModal.modal('show');
		}
	});

	originTable.click(function(e) {
		var _t = e.target,
			task_id = tableModalHead.text().slice(10);
		if (_t.tagName === 'TH') {
			for (var i = 0; i < result[task_id][0].length; i++) {
				if (result[task_id][0][i] == $(_t).text()) {
					break;
				}
			}
			var sort = $(_t).attr('sort'),
				thText = result[task_id][0][i];
			//0 means have sorted down
			if (sort === '1') {
				result[task_id].sort(function(x, y) {
					if(x[i]==thText){
						return -1;
					}
					else return sortFunction(x, y, i, true);
				});
			} else {
				result[task_id].sort(function(x, y) {
					if(x[i]==thText){
						return -1;
					}
					else return sortFunction(x, y, i, false);
				});
			}
			paintSortTable(task_id);
			(sort==='1') ? $(_t).attr('sort', '0') : $(_t).attr('sort', '1');
			e.stopPropagation();
		}
	});

	inputFile.change(function() {
		var _t = this;
		if (this.value !== '') {
			$('#fileName').html(_t.files[0].name + '<i class="icon close"></i>');
			$('a.btn_addPic > span').html("change file");
			$('#inputText').attr('disabled', true);
			inputForm.attr({
				'enctype': 'multipart/form-data',
				'action': '/query/upload'
			});
			$('#fileName > i').click(function() {
				inputFile.val('').change();
			});
		} else {
			$('#fileName').text('');
			$('#inputText').removeAttr('disabled');
			$('a.btn_addPic > span').html('<em>+</em>select file');
			inputForm.removeAttr("enctype").attr('action', '/query');
		}
	});

	$('#fileName').hover(function() {
		$(this).find('i').css('visibility', 'visible');
	}, function() {
		$(this).find('i').css('visibility', 'hidden');
	});


	setTimeout(function (){
		userGuideInit(11,userGuideModal.children('.content'),circleTab);
		userGuideModal.children('button').click(function (){
			var _t = $(this);
			if (_t.text()==='中文'){
				_t.text('English');
				imgs.each(function (){
					var src = $(this).attr('src');
					$(this).attr('src', src.slice(0,-7)+'c'+src.slice(-6));
				});
			} else {
				_t.text('中文');
				imgs.each(function (){
					var src = $(this).attr('src');
					$(this).attr('src', src.slice(0,-7)+'e'+src.slice(-6));
				});
			}
		});
			// userGuide's slider
	$('#btn-userGuide').click(function(){
		userGuideModal.modal('show');
	});
	userGuideModal.find('.content img').each(function(i){
		if (i===0){
			$(this).addClass("ui transition image visible");
		} else {
			$(this).addClass("ui transition image hidden")
		}

	});
	var userArrowClick = true,
		circles = circleTab.children(),
		imgs = userGuideModal.find('.content img');
	btnArrowLeft.hide();
	userGuideModal.children('.btn-arrow').click(function(e){
		if (userArrowClick){
			userArrowClick = false;

			btnArrowRight.show();
			btnArrowLeft.show();

			var _t = $(e.target);
				
			for (var i = 0; i < imgs.length; i++){
				if (imgs.eq(i).hasClass("visible")){
					break;
				}
			}
			if(_t.hasClass("left")){
				if (i===1){
					btnArrowLeft.hide();
				}
				if (i===0){
					return;
				}
				imgs.eq(i).transition('horizontal flip','300ms');
				imgs.eq(i-1).transition('horizontal flip','300ms');
				circles.eq(i).removeClass('actived');
				circles.eq(i-1).addClass('actived');

			} else {
				if (i===imgs.length-2){
					btnArrowRight.hide();
				}
				if (i===imgs.length-1){
					return;
				}
				imgs.eq(i).transition('horizontal flip','300ms');
				imgs.eq(i+1).transition('horizontal flip','300ms');
				circles.eq(i).removeClass('actived');
				circles.eq(i+1).addClass('actived');
			}
			setTimeout(function (){
				userArrowClick = true;
			},300);
		}
	});

	circles.each(function (i) {
		$(this).click(function (){
			var _t = $(this);
			if (!_t.hasClass('actived')){
				circleTab.find('.actived').removeClass('actived');
				_t.addClass('actived');
				imgs.eq(i).transition('horizontal flip','300ms');
				imgs.filter('.visible').transition('horizontal flip','300ms');
			}
			if (i===0){
				btnArrowLeft.hide();
				btnArrowRight.show();
			} else if (i===circles.length-1){
				btnArrowLeft.show();
				btnArrowRight.hide();

			} else {
				btnArrowLeft.show();
				btnArrowRight.show();
			}
		});
	});
	}, 2000);



}

function paintSortTable(task_id){
	if (result[task_id]){
		var trs = originTable.find('tr'),
			colLen = result[task_id][0].length,
			subject_id;
		for (var i = 0; i < result[task_id][0].length; i++) {
			if(result[task_id][0][i]=='subject_id'){
				subject_id = i;
			}
		}
		for (i = 1; i < result[task_id].length; i++){
			var tr = trs.eq(i);
			var tds = tr.find('td');
			for (var j = 0; j < colLen; j++){
				if(j===subject_id){
					tds.eq(j).html($('<a>').attr({
						'href':'http://parts.igem.org/Part:'+result[task_id][i][j],
						'target':'_blank'})
						.text(result[task_id][i][j]))
				} else {
					tds.eq(j).text(result[task_id][i][j]);
				}
			}
		}
	}
}

function paintTable(task_id) {
	if (result[task_id]) {
		// have comment lines
		originTable.html('');
		var subject_id;
		if (result[task_id][0][0] === 'query id') {
			var theadTr = $('<tr>').appendTo($('<thead>').appendTo(originTable));
			for (var i = 0; i < result[task_id][0].length; i++) {
				if(result[task_id][0][i]=='subject_id'){
					subject_id = i;
				}
				$('<th>').text(result[task_id][0][i]).appendTo(theadTr);
			}
			cloneTable.html(theadTr.parent().clone());
		}
		// add tbody
		var tbody = $('<tbody>').appendTo(originTable);
		for (i = 1; i < result[task_id].length; i++) {
			var tr = $('<tr>').appendTo(tbody);
			for (var j = 0; j < result[task_id][i].length; j++) {
				if(j===subject_id){
					td = $('<td>').append($('<a>').attr({
						'href':'http://parts.igem.org/Part:'+result[task_id][i][j],
						'target':'_blank'})
						.text(result[task_id][i][j]));
				} else {
					td = $('<td>').text(result[task_id][i][j]);
				}
				td.appendTo(tr)
			}
		}

		var originThs = originTable.find('th');
		cloneTable.find('th').each(function (i){
			$(this).click(function (){
				originThs.eq(i).click();
			});
		});
		tableModalHead.text('Task_id : ' + task_id).css('color', '#119000');
		tableModal.modal('show');
		tableFitWidth();
	}
	window.onresize = function() {
		if (tableModal.hasClass('active')) {
			tableFitWidth();
		}
	}

}

function toNumber(s){
	var x = parseFloat(s),
		i = 1;
	// while(isNaN(x) && i<s.length){
	// 	x = parseFloat(s.slice(i));
	// 	i++;
	// }
	return x;
}

function sortFunction(x, y, col, up){
	var a = toNumber(x[col]),
		b = toNumber(y[col]);
	if (isNaN(a) && isNaN(b)){
		if (up){
			return x[col].localeCompare(y[col]);
		} else {
			return y[col].localeCompare(x[col]);
		}
	} else if (up){
		return a-b;
	} else{
		return b-a;
	}
}

function tableFitWidth() {
	cloneTable.hide();
	setTimeout(function() {
		cloneTable.width(originTable.width());
		var originHead = originTable.find('th');
		cloneTable.find('th').each(function(i) {
			$(this).width(originHead.eq(i).width());
		});
		cloneTable.show();
	},1000);
}

function finished(arr, i) {
	var tr = $('<tr>').addClass('positive').append(
		$('<td>').text(arr[i].task_id),
		$('<td>').html('<i class="icon checkmark"></i>' + arr[i].status),
		$('<td>').append($('<button>').attr('task-id', arr[i].task_id)
			.addClass('ui green button').text("show")),
		$('<td>').append($('<a>').attr({
			'href': '/result/download/' + arr[i].task_id
		}).html('<i class="icon download"></i>Download')));
	return tr;
}

function failed(arr, i) {
	var tr = $('<tr>').addClass('negative').append(
		$('<td>').text(arr[i].task_id),
		$('<td>').html('<i class="icon close"></i>' + arr[i].status),
		$('<td>').append($('<button>').attr({
				'task-id': arr[i].task_id,
				'num': i
			})
			.addClass('ui red button').text("information")),
		$('<td>'));

	return tr;
}

function nonexistent(arr, i) {
	var tr = $('<tr>').addClass('warning').append(
		$('<td>').text(arr[i].task_id),
		$('<td>').html('<i class="icon question"></i>' + arr[i].status),
		$('<td>').text('Task_id is invalid'),
		$('<td>'));

	return tr;
}

function waiting(arr, i) {
	var tr = $('<tr>').append(
		$('<td>').text(arr[i].task_id),
		$('<td>').html('<i class="icon loading"></i>' + arr[i].status),
		$('<td>').html(arr[i].msg),
		$('<td>'));

	return tr;
}

//if a task is end status
function isEnd(arr, i) {
	if (arr[i].status !== 'finished' && arr[i].status !== 'failed' && arr[i].status !== 'nonexistent') {
		return false;
	}
	return true;
}

function longPoll(arr, i) {
	$.getJSON('/status/' + arr[i].task_id + '/poll')
		.done(function(data) {
			if (data.errno === 0) {
				if (arr[i].status !== data.status) {
					arr[i].status = data.status;
					arr[i].err_msg = data.err_msg;
					arr[i].msg = data.msg;
					window.localStorage.setItem('task', JSON.stringify(arr));
					change(arr, i);
				}
				if (!isEnd(arr, i)) {
					longPoll(arr, i);
				}
			} else {
				alert(arr[i].task_id, data.err_msg);
				longPoll(arr, i);
			}
		}).fail(ajaxError);
}

function change(arr, i) {
	var tr;
	switch (arr[i].status) {
		case 'finished':
			tr = finished(arr, i);
			break;
		case 'failed':
			tr = failed(arr, i);
			break;
		case 'nonexistent':
			tr = nonexistent(arr, i);
			break;
		default:
			tr = waiting(arr, i);
			break;
	}
	tbody.find('tr').eq(arr.length - i - 1).replaceWith(tr);
}

function ajaxError(a, b, c) {
	alert('Conection Error');
}

function submitInput() {
	$.ajax({
		url: inputForm.attr('action'),
		type: 'POST',
		data: new FormData(inputForm[0]),
		dataType: 'json',
		contentType: false,
		processData: false,
	})
	.done(addTask)
	.fail(function() {
		ajaxError();
			
	});
	
}

function addTask(data) {
	if (!data.errno) {
		var taskObj = {
			task_id: data.task_id || addTask_id,
			status: data.status || 'waiting',
			err_msg: '',
			msg: ''
		}
		if (!window.localStorage.getItem('task') || window.localStorage.getItem('task') === '') {
			var arr = [taskObj];
		} else {
			var arr = $.parseJSON(window.localStorage.getItem('task'));
			arr.push(taskObj);
		}
		window.localStorage.setItem('task', JSON.stringify(arr));
		paintTask(arr.length-1);
	} else {
		// query submit failed
		alert(data.err_msg);
	}
	querybtn[0].className = 'ui blue button';
}

function paintTask(i){
	var arr = $.parseJSON(window.localStorage.task);
	switch (arr[i].status) {
		case 'finished':
			tbody.prepend(finished(arr, i));
			break;
		case 'failed':
			tbody.prepend(failed(arr, i));
			break;
		case 'nonexistent':
			tbody.prepend(nonexistent(arr, i));
			break;
		default:
			tbody.prepend(waiting(arr, i));
			longPoll(arr, i);
			break;
	}
}

function userGuideInit(n, content, circleTab){
	for (var i=1; i<=n; i++){
		var str = i < 10 ? '0'+i : i; 
		$('<img>').attr('src','/static/images/user_guide/e'+str+'.jpg').appendTo(content);
		if (i===1){
			$('<i>').addClass('circle icon actived').appendTo(circleTab);
		} else {
			$('<i>').addClass('circle icon').appendTo(circleTab);
		}
	}
	circleTab.css('margin-left',(-28*n)/2+'px');
	for (var i = 1; i<=n; i++){
		var str = i < 10 ? '0'+i : i; 
		$.get('/static/images/user_guide/c'+str+'.jpg');
	}
	
}

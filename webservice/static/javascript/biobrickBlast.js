/**
 *
 * @authors Min Huang (huangm.ss.sysu@gmail.com)
 * @date    2014-05-04 23:38:22
 * @version $1.0$
 */

var tbody = $('#resultTbody'),
	inputForm = $('form#userInput'),
	querybtn = $('form#userInput > button'),
	tableModal = $('#tableModal'),
	tableModalHead = $('#tableModal .header'),
	tableModalContent = $('#tableModal .content table'),
	textModal = $('#textModal'),
	textModalHead = $('#textModal .header'),
	textModalContent = $('#textModal textarea'),
	addTask_id,
	result;
$(init);

function init() {
	if (window.localStorage.getItem('task') && window.localStorage.getItem('task') !== '') {

		var arr = $.parseJSON(window.localStorage.task);
		// no more than 15 task_id
		// while (arr.length>15){
		// 	arr.shift();
		// }
		for (var i = arr.length - 1; i >= 0; i--) {
			switch (arr[i].status) {
				case 'finished':
					tbody.append(finished(arr, i));
					break;
				case 'failed':
					tbody.append(failed(arr, i));
					break;
				case 'nonexistent':
					tbody.append(nonexistent(arr, i));
					break;
				default:
					tbody.append(waiting(arr, i));
					longPoll(arr, i);
					break;
			}
		}
	}



	tableModal.modal();
	textModal.modal();
	
	$(window).resize(scrollTable);

	$('.ui.selection.dropdown').dropdown();

	$('a[data-url]').click(function(e) {
		e.preventDefault();
		$.get($(this).attr('data-url'));
	})

	$('#taskQuery button').click(function(e) {
		e.preventDefault();
		addTask_id = $(this).prev().val();
		$.getJSON('/status/' + addTask_id)
			.done(addTask)
			.fail(ajaxError);
	});

	$('input:hidden').change(function() {
		window.localStorage.setItem([this.name], $(this).val());
	}).val(function() {
		var value = window.localStorage.getItem(this.name) || $(this).val(),
			defaultDiv = $(this).next();

		if (this.name === 'outfmt') {
			var text = defaultDiv.next().next()
				.find($('div[data-value=' + value + ']')).text();
			defaultDiv.text(text);
		} else {
			defaultDiv.text(value);
		}
		return value;
	});

	querybtn.click(function(e) {
		e.preventDefault();
		this.className = "ui loading button";
		submitInput();
		return false;
	});

	tbody.click(function(el) {
		_t = el.target;
		var task_id = $(_t).attr('task-id');
		if (_t.className === 'ui green button') {
			$(_t).html('<i class="icon loading"></i>');
			$.getJSON('/result/' + task_id)
				.done(function(data) {
					var dataArr;
					if (data.errno === 0) {
						dataArr = $.parseJSON(data.result);
						// be transfromed to table
						if (typeof dataArr === 'object') {
							var table = $('.ui.celled.table.segment.scrollTable');
							// have comment lines
							if (dataArr[0][0] === 'query id') {
								var theadTr = $('<tr>').appendTo($('thead').appendTo(table));
								for (var i = 0; i < dataArr[0].length; i++) {
									$('<th>').text(dataArr[0][i]).appendTo(theadTr);
								}
							}
							// add tbody
							var tbody = $('<tbody>').appendTo(table);
							for (i = 1; i < dataArr.length; i++) {
								var tr = $('<tr>').appendTo(tbody);
								for (var j = 0; j < dataArr[i].length; j++) {
									$('<td>').text(dataArr[i][j]).appendTo(tr);
								}
							}
							tableModalHead.text('Task_id : ' + task_id).css('color', '#119000');
							tableModal.modal('show');
							scrollTable();
						} else {
							// output directly
							textModalHead.text('Task_id : ' + task_id).css('color', '#119000');
							textModalContent.val(data.result)
							textModal.modal('show');
						}
					} else {
						textModalHead.text('Task_id : ' + task_id).css('color', '#119000');
						textModalContent.val(data.err_mag+data.msg)
						textModal.modal('show');
					}
					
					$(_t).text('show');
				}).fail(ajaxError);
		} else if (_t.className === 'ui red button') {
			var num = $(_t).attr('num');
			textModalHead.text('Task_id : ' + task_id).css('color', '#CD2929');
			console.log(textModalContent)
			textModalContent.text(arr[num].msg);
			textModal.modal('show');
		}
	});

	$('input.filePrew').change(function() {
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
				$('input.filePrew').val('').change();
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
}

function scrollTable() {
	$("table.scrollTable").children("thead").find("td,th").each(function() {
		var idx = $(this).index();
		var td = $(this).closest("#scroll").children("tbody")
			.children("tr:first").children("td,th").eq(idx);
		$(this).width(td.width());
	});
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
				console.log(data.msg)
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
			querybtn.className = 'ui blue button';
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
		if (typeof window.localStorage.getItem('task') === 'undefined') {
			var arr = [taskObj];
		} else {
			var arr = $.parseJSON(window.localStorage.getItem('task'));
			arr.push(taskObj);
		}
		window.localStorage.setItem('task', JSON.stringify(arr));
		window.location.reload();
	} else {
		// 查询提交失败
		alert(data.err_msg);
		querybtn.className = 'ui blue button';
	}
}

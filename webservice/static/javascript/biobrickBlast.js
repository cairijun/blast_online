/**
 * 
 * @authors Min Huang (huangm.ss.sysu@gmail.com)
 * @date    2014-05-04 23:38:22
 * @version $1.0$
 */
var tbody = $('#resultTbody'),
	inputForm = $('form#userInput');

$(init);

function init(){

	if(window.localStorage.task && window.localStorage.task!==''){
		var arr = $.parseJSON(localStorage.task);
		for (var i = arr.length-1; i >= 0; i--){
			switch(arr[i].status){
				case 'finished':
					tbody.append(finished(arr, i));
					break;
				case 'failed':
					tbody.append(failed(arr, i));
					break;
				case 'nonexistent':
					tbody.append(nonexistent(arr, i));
					break;
				default :
					tbody.append(waiting(arr,i));
					longPoll(arr,i);
					break;
			}
		}
	}

	$('.ui.selection.dropdown').dropdown();

	$('a[data-url]').click(function (e){
		e.preventDefault();
		$.get($(this).attr('data-url'));
	})

	$('#taskQuery button').click(function (e){
		e.preventDefault();
		var task_id = $(this).prev().val();
		$.getJSON('/result/'+task_id)
		.done(addTask)
		.fail(ajaxError);
	});


	$('form#userInput > button').click(function (e){
		e.preventDefault();
		this.className = "ui loading button";
		submitInput(this);
		return false;
	});


	$('input.filePrew').change(function (){
		var _t = this;
		if(this.value!==''){
			$('#fileName').html(_t.files[0].name+'<i class="icon close"></i>');
			$('a.btn_addPic > span').html("change file");
			$('#inputText').attr('disabled',true);
			inputForm.attr({
				'enctype':'multipart/form-data',
				'action': '/query/upload'
			});
			$('#fileName > i').click(function (){
				$('input.filePrew').val('').change();
			});
		} else {
			$('#fileName').text('');
			$('#inputText').removeAttr('disabled');
			$('a.btn_addPic > span').html('<em>+</em>select file');
			inputForm.removeAttr("enctype").attr('action','/query');
		}
	});

	$('#fileName').hover(function (){
		$(this).find('i').css('visibility','visible');
	}, function (){
		$(this).find('i').css('visibility','hidden');
	});
}

function finished(arr, i){
	var tr = $('<tr>').addClass('positive').append(
		$('<td>').text(arr[i].task_id),
		$('<td>').html('<i class="icon checkmark"></i>' + arr[i].status),
		$('<td>').append($('<button>').attr('task-id',arr[i].task_id)
			.addClass('ui green button').text("show")
			.click(function (){
				var _t = $(this);
				_t.html('<i class="icon loading"></i>');
				$.getJSON('/result/' + _t.attr('task-id'))
				.done(function (data){
					if(data.errno===0){
						$(this).replaceAll(data.result);
					} else {
						$(this).replaceAll(data.err_msg);
					}
					
				}).fail(ajaxError);
			})
		),
		$('<td>').append($('<a>').attr({
			'href':'/result/download/' + arr[i].task_id
		}).html('<i class="icon download"></i>Download')));
		return tr;
}

function failed(arr, i){
	var tr = $('<tr>').addClass('negative').append(
		$('<td>').text(arr[i].task_id),
		$('<td>').html('<i class="icon close"></i>' + arr[i].status),
		$('<td>').text(arr.err_msg),
		$('<td>'));

		return tr;
}

function nonexistent(arr, i){
	var tr = $('<tr>').addClass('warning').append(
		$('<td>').text(arr[i].task_id),
		$('<td>').html('<i class="icon question"></i>' + arr[i].status),
		$('<td>').text('Task_id is invalid'),
		$('<td>'));

		return tr;
}

function waiting(arr, i){
	var tr = $('<tr>').append(
		$('<td>').text(arr[i].task_id),
		$('<td>').html('<i class="icon loading"></i>' + arr[i].status),
		$('<td>').text(arr[i].err_msg),
		$('<td>')
	);
		return tr;
}
function isEnd(arr, i){
	if(arr[i].status!=='finished' && arr[i].status!=='failed' 
		&& arr[i].status!=='nonexistent'){
		return false;
	}
		return true;
}

function longPoll(arr, i){
	$.getJSON('/status/'+arr[i].task_id+'/poll')
		.done(function (data){
			if(data.errno===0){

				if(arr[i].status !== data.status){
					arr[i].status = data.status;
					change(arr, i);
				}
				if( !isEnd(arr,i) ){
					longPoll(arr, i);
				}
			} else {
				alert(arr[i].task_id, data.err_msg);
				longPoll(arr,i);
			}
		}).fail(ajaxError);
}

function change(arr, i){
	var tr;
	switch(arr[i].status){
		case 'finished':
			tr = finished(arr, i);
			break;
		case 'failed':
			tr = failed(arr, i);
			break;
		case 'nonexistent':
			tr = nonexistent(arr, i);
			break;
		default :
			tr = waiting(arr, i);
			break;
	}
	tbody.find('tr').eq(arr.length - i -1).replaceWith(tr);
}
function ajaxError(a,b,c){
	alert('Conection Error');
}

function submitInput(btn){
	$.ajax({
		url: inputForm.attr('action'),
		type: 'POST',
		data: new FormData(inputForm[0]),
		dataType: 'json',
		contentType: false,
		processData: false,
	})
	.done(addTask)
	.fail(function(){
			ajaxError();
			btn.className = 'ui blue button';
		});
}

function addTask(data){
		if (!data.errno){
			var taskObj = {
				task_id: data.task_id,
				status: data.status || 'waiting',
				err_msg: ''
			}
			if(typeof localStorage.task === 'undefined'){
				var arr = [taskObj];
			} else {
				var arr = $.parseJSON(localStorage.task);
				arr.push(taskObj);
			}
			window.localStorage.task = JSON.stringify(arr);
			window.location.reload();
		} else {
			// 查询提交失败
			alert(data.err_msg);
			btn.className = 'ui blue button';
		}
}








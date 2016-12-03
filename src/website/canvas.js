var stage;
var benches = {};
var oldwidth, oldheight;

function onCanvasInit() {
    stage = new createjs.Stage("map-canvas");
    stage.enableMouseOver(10);

    createjs.Ticker.addEventListener("tick", onCanvasTick);

    var white = new createjs.Shape();
    white.graphics.beginFill("#1e1e1e").drawRect(0, 0, stage.canvas.width, stage.canvas.height);
    stage.addChild(white);

    onBuildScene();

    window.addEventListener('resize', resize, false);
    oldwidth = 1920;
    oldheight = 974;
    resize();
}

function onCanvasTick() {
  stage.update();
}


function onSysLogin(session)
{
    populateReserveSelector();
    updateReservations();
}

function updateReservations(){
  var url = baseUrl + "getMapData?";
  url += encodeQueryData({"username": session.userData.username, "token": session.userData.token});

  makeRequest(url, function(err, data) {
    if (err) {
      console.error(err);
    } else {
      if(data.success) {
        parseReservations(data.mapData);
      } else {
        console.error(data);
      }
    }
  });
}

function parseReservations(data) {
  for(var idx in benches)
    benches[idx].Reset();

  for(var idx in data) {
    benches[data[idx].id].SetData(data[idx]);
  }
}

function onBuildScene() {
  $.ajax({
    type: "GET",
    url: "config/room.xml",
    dataType: "xml",
    success: function(data)
    {
       $(data).find("Room").children().each(function () {
          var bench = new Interactable("res/Bench_normal.png", "res/Bench_blocked.png", "res/Bench_hover.png");
          bench.x = parseInt($(this).attr('x'));
          bench.y = parseInt($(this).attr('y'));
          bench.scaleX = parseFloat($(this).attr('scale'));
          bench.scaleY = parseFloat($(this).attr('scale'));
          bench.rotation = parseFloat($(this).attr('rot'));
          bench.regX = 62.5;
          bench.regY = 37.5;

          benches[$(this).attr('index')] = bench;
     });

       for(var idx in benches)
       {
         stage.addChild(benches[idx]);
         addEventListeners();
       }

    }
   });
}

function addEventListeners()
{
  for(var idx in benches)
    benches[idx].addEventListener('click', onBechClick, false);
}

function removeEventListners()
{
  for(var idx in benches)
    benches[idx].removeEventListener('click', onBechClick, false);
}

function resize()
{
    stage.canvas.width =  stage.canvas.width * (window.innerWidth / oldwidth);
    stage.canvas.height = stage.canvas.height  * (window.innerWidth / oldwidth);

    stage.scaleX = stage.scaleX * (window.innerWidth / oldwidth);
    stage.scaleY = stage.scaleY  * (window.innerWidth / oldwidth);

    oldwidth = window.innerWidth;
    oldheight = window.innerHeight;
}


var idx = '-1';

function getTime() {
  var d = new Date();
  var hours = d.getHours();
  var minutes = d.getMinutes();

  if (hours < 10)
    hours = '0' + hours;

  if (minutes < 10)
      minutes = '0' + minutes;

  return hours + ':' + minutes;
}

function onBechClick(e) {
  for(var i in benches) {
    if(benches[i] === e.target)
      idx = i;
  }

  removeEventListners();

  if(!e.target.toggle) {
    $('#reserve-form').css('display','inline-block');
    $('#reserve-form').hide();
    $('#reserve-form').slideToggle('slow');
    $('#reserve-endtime').val(getTime());
    $('#reserve-error').hide();
  } else {
    $('#report-username').html(e.target.data.username);
    $('#report-form').css('display','inline-block');
    $('#report-form').hide();
    $('#report-form').slideToggle('slow');
    $('#reserve-error').hide();
    $('#report-message').val('');
    $('#report-error').hide();
  }
}

function ShowMessage(msg) {
  $('#info-form').css('display','inline-block');
  $('#info-form').hide();
  $('#info-form').slideToggle('slow');
  $('#info-message').text(msg);
}

function CloseMessageBox() {
  $('#info-form').slideToggle('slow');
}

function CloseReserve() {
  idx = '-1';
  $('#reserve-form').slideToggle('slow');
  addEventListeners();
}

function CloseReport() {
  idx = '-1';
  $('#report-form').slideToggle('slow');
  addEventListeners();
}

function buildDate(val) {
  var splits = val.split(':');
  var hours = splits[0];
  var minutes = splits[1];

  var d = new Date();
  d.setHours(hours);
  d.setMinutes(minutes);

  //return d.toISOString();
  return d;
}

function getCompleteCategoryName(val) {
  if (val === 'Class')
    return 'Class chat room'
  else if(val === 'Homework' || val == 'Project')
    return val + 'discussion';
  else
    return val;
}

function SubmitReserve() {
  var endTime = buildDate($('#reserve-endtime').val());
  var startTime = new Date();
  var projectName = $('#reserve-project option:selected').text();
  var category = getCompleteCategoryName($('#reserve-category').val());

  if(endTime <= startTime) {
    $('#reserve-error').text('You cannot time travel!');
    $('#reserve-error').show();
    $('#reserve-error').css('color', 'white');
    $('#reserve-error').animate({color: 'red'}, 1000);
    return;
  }

  if(projectName === null) {
    $('#reserve-error').text('Invalid project!');
    $('#reserve-error').show();
    $('#reserve-error').css('color', 'white');
    $('#reserve-error').animate({color: 'red'}, 1000);
    return;
  }

  var url = baseUrl + "addReservation?";
  url += encodeQueryData(
    {
      'username': session.userData.username,
      'group': session.userData.group,
      'token': session.userData.token,
      'id': idx,
      'projectName': projectName,
      'category': category,
      'startTime': startTime.toISOString(),
      'endTime': endTime.toISOString()
    });

  makeRequest(url, function(err, data) {
    if (err) {
      console.error(err);
    } else {
      if (data.success === false) {
        $('#reserve-error').text(data.msg);
        $('#reserve-error').show();
        $('#reserve-error').css('color', 'white');
        $('#reserve-error').animate({color: 'red'}, 1000);
      } else {
        setTimeout( updateReservations, 1000 );
        ShowMessage('Reservation was saved!');
        CloseReserve();
      }
    }
  });

}

function SubmitReport() {
  var msg = $('#report-message').val();
  if(msg === '') {
    $('#report-error').text('Message cannot be left blank!');
    $('#report-error').show();
    $('#report-error').css('color', 'white');
    $('#report-error').animate({color: 'red'}, 1000);
    return;
  }

  var url = baseUrl + "report?";
  url += encodeQueryData(
    {
      'username': session.userData.username,
      'token': session.userData.token,
      'acused': $('#report-username').text(),
      'message': msg
    });

  makeRequest(url, function(err, data) {
    if (err) {
      console.error(err);
    } else {
      if (data.success === false) {
        $('#report-error').text(data.msg);
        $('#report-error').show();
        $('#report-error').css('color', 'white');
        $('#report-error').animate({color: 'red'}, 1000);
        return;
      } else {
        CloseReport();
        ShowMessage('User was reported!');
      }
    }
  });


}

function populateReserveSelector() {
  var category = getCompleteCategoryName($('#reserve-category').val());
  makeSearchRequest('*', category, function (err, data) {
    var elements = [];

    $.each(data, function(key, value)
    {
      if(value !== '' && value != ' ')
        elements.push('<option value="' + key + '" >'+ value +'</option>');
    });

    $('#reserve-project').html(elements.join(''));
  });
}

function ActivateMap() {
  $('#canvas-container').show();
  $('#sketchbook-container').hide();

  $('#tab-map').attr('class', 'active-tab');
  $('#tab-map a').attr('class', 'active-ref');

  $('#tab-sketchbook').attr('class', 'background-tab');
  $('#tab-sketchbook a').attr('class', 'background-ref');
}

function ActivateScrapbook() {

  $('#canvas-container').hide();
  $('#sketchbook-container').show();

  $('#tab-sketchbook').attr('class', 'active-tab');
  $('#tab-sketchbook a').attr('class', 'active-ref');

  $('#tab-map').attr('class', 'background-tab');
  $('#tab-map a').attr('class', 'background-ref');

}

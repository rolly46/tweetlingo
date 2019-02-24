
$(function () {
    // very important, what it does is it uses the code in the socket.io library and inits a connection with the sever
    var socket = io.connect();
    var currentSearch = "";
    // get the total number of wordclouds
    var switchState = true;
    socket.emit('getcloudcount', "sent");
    // zingchar stuff
    zingchart.MODULESDIR = "https://cdn.zingchart.com/modules/";
    ZC.LICENSE = ["569d52cefae586f634c54f86dc99e6a9", "ee6b7db5b51705a13dc2339db3edaf6d"];



    // check filepath
    var path = window.location.pathname;
    path = path[0] == '/' ? path.substr(1) : path;
    if (path == "ads.txt") {
        console.log("ads.txt xd");
    } else if (path.length != 0) {
        console.log(path);
        askServerSearchPredetermined();
    }

    // search button
    $("#buttonid").click(function (e) {
        askServerSearch(e);
        // disable the button while the wordcloud is being made
        $("#buttonid").prop("disabled", true);
        console.log("clicked");
    });

    $('#handleid').keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {
            askServerSearch(event);
            // disable the button while the wordcloud is being made
            $("#buttonid").prop("disabled", true);
            console.log("clicked");
        }
    });



    // back button (after the other wordclouud has been genned)
    // this is really bad but its the html form and button to reinstate it. and then reativate the button querys? i dont know why. this is so bad 
    $("#back").click(function (e) {
        var searchElement = '<div class="col-md-12" id="betaresult"><div class="row"><div class="col-md-1"></div><div class="col-md-10"><form role="form"><div class="form-group"><label for="exampleInputEmail1"><span class="badge badge-info text-sec" >Enter another Twitter Handle </span></label><input type="text" class="form-control" id="handleid" placeholder="e.g. nytimes"></div></form></div><div class="col-md-1"></div></div><div class="row"><div class="col-md-1"></div><div class="col-md-10"><button type="button" class="btn btn-block btn-lg btn-info" id="buttonid">Search</button></div><div class="col-md-1"></div></div></div>';
        document.getElementById("betaresult").innerHTML = searchElement;
        document.getElementById('back').innerHTML = "";
        document.getElementById('share').innerHTML = "";

        $("#buttonid").click(function (e) {
            askServerSearch(e);
            // disable the button while the wordcloud is being made
            $("#buttonid").prop("disabled", true);
            console.log("clicked");
        });

        $('#handleid').keypress(function (event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            // enter
            if (keycode == '13') {
                askServerSearch(event);
                // disable the button while the wordcloud is being made
                $("#buttonid").prop("disabled", true);
                console.log("clicked"); 
            }
        });

    });

        // share button 
    $("#share").click(function (e) {
        var sharebutton = '<button type="button" class="btn btn-block btn-lg btn-warning" id="share"><span ></span></button>';
        document.getElementById('share').innerHTML = sharebutton;
        const el = document.createElement('textarea');
        el.value = "tweetlingo.com/"+currentSearch;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    
    $("#share span").text("Link Copied! Please go share it ☺️");
    

    });



    // waiting thingo
    function askServerSearch(e) {
        e.preventDefault();
        socket.emit('coderequest', document.getElementById("handleid").value);
        currentSearch = document.getElementById("handleid").value;
    }

    // waiting thingo
    function askServerSearchPredetermined() {
        socket.emit('coderequest', path);
        currentSearch = path;
    }

    function makewordCloud(wrds) {
        // reenable the button
        // show back share buttons
        var backbutton = '<button type="button" class="btn btn-block btn-lg btn-info" id="back">Back</button> <br>';
        var sharebutton = '<button type="button" class="btn btn-block btn-lg btn-outline-warning" id="share"><span >My Text</span></button>';
        document.getElementById('back').innerHTML = backbutton;
        document.getElementById('share').innerHTML = sharebutton;
        // change share button txt
        $("#share span").text("Copy Link (tweetlingo.com/"+currentSearch+")");
    
        $("#buttonid").prop("disabled", false);

        // $chat.append('<div class="well">' +data.msg+ '</div>')

        var wordcloudElement = '<div class="col-md-12" id="chart"><div class="row"><div class="col-md-1"></div><div class="col-md-10"><div id="myChart"></div></div><div class="col-md-1"></div></div></div>';
        document.getElementById('betaresult').innerHTML = wordcloudElement;


        var myConfig = {
            type: 'wordcloud',
            options: {
                text: wrds,
                minLength: 5,
                ignore: ["Because", "because", "could", "don’t", "people", "That’s", "that’s", "Their", "their", "there", "these", "thing", "those", "through", "We’re", "we’re", "where", "would"],
                maxItems: 40,
                aspect: 'spiral',
                rotate: false,
                colorType: 'palette',
                palette: ['#D32F2F', '#5D4037', '#1976D2', '#E53935', '#6D4C41', '#1E88E5', '#F44336', '#795548', '#2196F3', '#EF5350', '#8D6E63', '#42A5F5'],

                style: {
                    fontFamily: 'Crete Round',

                    hoverState: {
                        backgroundColor: ' #1da1f2',
                        borderRadius: 2,
                        fontColor: 'white'
                    },
                    tooltip: {
                        text: '%text: %hits',
                        visible: true,
                        alpha: 0.9,
                        backgroundColor: '#1976D2',
                        borderRadius: 2,
                        borderColor: 'none',
                        fontColor: 'white',
                        fontFamily: 'Georgia',
                        textAlpha: 1
                    }
                }
            },

            source: {
                text: "Twitter Profile: " + currentSearch,
                fontColor: '#000000',
                fontSize: 10,
                fontFamily: 'Georgia',
                fontWeight: 'normal',
                marginBottom: '10%'
            }
        };

        zingchart.render({
            id: 'myChart',
            data: myConfig,
            height: 400,
            width: '100%'
        });
    }

    // catch the servers response. Loading..
    socket.on('wait', function (data) {
        // $chat.append('<div class="well">' +data.msg+ '</div>')
        console.log("WAITING")
        var newElement = "<h6 class='text-center' style='padding-top: 40px;'> Loading... 🤪 <br> (this can take up to 10 seconds)</h6>";
        document.getElementById('betaresult').innerHTML = newElement;
    });

    // catch the servers response. The words are received and then a wordcloud is built from that
    socket.on('wordsReceived', function (data) {
        makewordCloud(data);
    });

    // catch the servers response. if it returns an error
    socket.on('errorMessage', function (data) {
        // reenable the button
        $("#buttonid").prop("disabled", false);
        var newElement = "<div class='container-fluid'><div class='row'><div class='col-md-10'><h6 class='text-center' style='padding-top: 40px;'>Couldn't find Twitter User. Sorry 😢 Remember to enter the Twitter handle and not the username.</h6></div><div class='col-md-2'><center><img alt='Twitter Handle Example' src='https://i.imgur.com/UNcsrB0.png?' width='150' height='141.5' class='rounded' /></center></div></div></div>";
        var backbutton = '<button type="button" class="btn btn-block btn-lg btn-info" id="back">Back</button>';
        document.getElementById('back').innerHTML = backbutton;
        document.getElementById('betaresult').innerHTML = newElement;
    });

    // catch the servers response. The total number of wordclouds
    socket.on('initialcount', function (data) {
        console.log(data);
        document.getElementById("cloudcount").textContent = data + " lingos have been created so far 😍"
    });

    // catch the servers response. The textbook para if sucessful 
    socket.on('error', function (data) {
        alert(data);
    });


})





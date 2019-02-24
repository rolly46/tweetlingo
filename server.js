#!/usr/bin/env nodejs
// Imports
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var client = require('socket.io').listen(server);
var mongo = require('mongodb').MongoClient;
var spawn = require('child_process').spawn;
server.listen(process.env.PORT || 8080);

// Get server ready for serving?..
console.log('sevrer chugging.....');
// make sure this file is available to the client use the express static method
app.use(express.static('js'))
app.use(express.static('css'))
app.use(express.static('resources'));

app.get('*', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


var allClients = [];

// locking mech to stop with the silly conflicts
class Mutex {
    constructor() {
        this._queue = [];
    }

    lock() {
        return new Promise((resolve, reject) => {
            const allow = () => {
                resolve(this._unlock.bind(this));
            };
            this._queue.push(allow);
            if (this._queue.length === 1) {
                allow();
            }
        });
    }

    _unlock() {
        this._queue.shift();
        const next = this._queue[0];
        if (typeof next === 'function') {
            next();
        }
    }
}
const mutex = new Mutex();


// connect to socket.io
client.on('connection', function (socket) {




    // push the new client onto the list 
    allClients.push(socket);

    socket.on('disconnect', function () {
        console.log('Got disconnect!');

        var i = allClients.indexOf(socket);
        allClients.splice(i, 1);

    });

    // catch the request
    socket.on('coderequest', async function (data) {
        console.log("pull started...");

        // tell user to wait
        socket.emit('wait', "notmuchinfo");

        // todo create a cache the mongo that first checks to see if this handle has been searched before.
        // if it has, pull from mono then return, easy,
        // otherwise go through the full api :/

        // init mongo and connect to the mlab mongo server
        mongo.connect('mongodb://tweetlingo:tweetlingo123@ds054298.mlab.com:54298/tweetlingo', function (err, db) {
            if (err) {
                throw err;
            }
            console.log('remote mongo is connected..');
            var thebase = db.db("tweetlingo");


            // wordcloud count update
            var ObjectID = require('mongodb').ObjectID;
            var query = {"_id": ObjectID("5c36290e217f7f8f0d0daae5")};
            // ok so it looks for the result in mongo, if it finds it great, returned. Otherwise itll find it using twiiter api and blocking then return it and save it in mongo
            thebase.collection("tweetwords").findOne(query).then(function (result) {
                var prevcount = result.count;
                nowcount = prevcount + 1;
                var ObjectID = require('mongodb').ObjectID;
                thebase.collection('tweetwords').updateOne({_id: ObjectID("5c36290e217f7f8f0d0daae5")}, {$set: {count : nowcount}}, {w:1}, function(err, result){
                    console.log("updated count to " + nowcount);
                });
            });




            //wordcloud retreaval
            var query = { handle: data };
            // ok so it looks for the result in mongo, if it finds it great, returned. Otherwise itll find it using twiiter api and blocking then return it and save it in mongo
            thebase.collection("tweetwords").findOne(query).then(async function (result) {

                if (result == null) {
                    console.log("dont have words");
                    // preceed onto twitter api
                    twitterapicall(data);

                } else {
                    console.log('got words');
                    //  but lets check if its expired   // if the current time is greater than the expiry, then do a reset
                    var currenttime = new Date();
                    var expired = currenttime.getDate > result.expiry;
                    if (expired) {
                        console.log("entry expired, fetch again");
                        thebase.collection("tweetwords").deleteOne(query);
                        twitterapicall(data);
                    }
                    // ok all good, use the db result for speed
                    // send the words from the db
                    words = result.word;
                    socket.emit('wordsReceived', words);
                }

            });



            async function twitterapicall(data) {
                // critical section so that you dont get conflicts, makes it a bit slow though 
                const unlock = await mutex.lock();
                py = spawn('python', ['compute_input.py']);
                dataString = "";

                // everytime python prints data this is wherre at caught 
                py.stdout.on('data', async function (data) {
                    dataString += data;
                });

                // when the process is acutally finished, this is whats printed.
                py.stdout.on('end', async function () {
                    // unlock critical section
                    unlock();
                    // console.log('WORDS: ', dataString);
                    console.log("twitter returned "+dataString.length);
                    // such a crappy way but this is the length of the error message or a message that has no return
                    if (dataString.length == 100 || dataString.length == 1) {
                        console.log("error from twitter")
                        socket.emit('errorMessage', dataString);

                    } else { // send words 
                        console.log("sent")
                        socket.emit('wordsReceived', dataString);
                        var tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        // save in db

                        var mynewaccountsave = { handle: data, word: dataString, expiry: tomorrow };
                        thebase.collection("tweetwords").insertOne(mynewaccountsave, async function (err, res) {
                            if (err) throw err;
                            console.log("1 document inserted");
                            db.close();
                        });
                    }
                });
                // ok now send the data to the python program
                py.stdin.write(data);
                py.stdin.end();
            }

        });

    })




    // catch the request
    socket.on('getcloudcount', function (data) {

        // init mongo and connect to the mongo server
        mongo.connect('mongodb://tweetlingo:tweetlingo123@ds054298.mlab.com:54298/tweetlingo', function (err, db) {
            if (err) {
                throw err;
            }
            console.log('remote mongo is connected..');
            var thebase = db.db("tweetlingo");
            var ObjectID = require('mongodb').ObjectID;
            var query = {"_id": ObjectID("5c36290e217f7f8f0d0daae5")};
            // ok so it looks for the result in mongo, if it finds it great, returned. Otherwise itll find it using twiiter api and blocking then return it and save it in mongo
            thebase.collection("tweetwords").findOne(query).then(async function (result) {
                socket.emit('initialcount', result.count);
            });

        })

    })






})
var http = require('http');
var path = require('path');
var express = require('express');
var cardProvider = require('./cardProvider');
var dbProvider = require('./dbProvider');
var mongoose = require('mongoose');

var db_server = 'test_db';
mongoose.connection.on("connected", function(ref) {
    console.log("Connected to " + db_server + " DB!");
});

try {
    mongoose.connect('mongodb://jhaywood:test_db@kahana.mongohq.com:10037/test_db');
    console.log("Trying to connect to DB " + db_server);
} catch (err) {
    console.log("Sever initialization failed " , err.message);
}

var app = express();
var server = http.createServer(app);

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded());

app.get('/api/newmatchup/', function(req, res) {
    var data = cardProvider.getTwoRandomNeutralCards();
    res.send(data);
});

app.post('/api/sendmatchup/', function(req, res) {
    var matchupData = req.body;
    var promise1 = dbProvider.getRank(matchupData.cardOneId);
    promise1.onFulfill(function(rankOne) {
        var promise2 = dbProvider.getRank(matchupData.cardTwoId);
        promise2.onFulfill(function(rankTwo) {
            var pickedCardId;
            var pickedNewRank;
            var unpickedCardId;
            var unpickedNewRank;
            if (matchupData.picked == 1) {
                pickedCardId = matchupData.cardOneId;
                pickedNewRank = ((100 - rankOne) / 2) + rankOne;
                unpickedCardId = matchupData.cardTwoId;
                unpickedNewRank = rankTwo - (rankTwo / 2);
            } else {
                pickedCardId = matchupData.cardTwoId;
                pickedNewRank = ((100 - rankTwo) / 2) + rankTwo;
                unpickedCardId = matchupData.cardOneId;
                unpickedNewRank = rankOne - (rankOne / 2);
            }
            dbProvider.setNeutralRank(pickedCardId, pickedNewRank);
            dbProvider.setNeutralRank(unpickedCardId, unpickedNewRank);
            dbProvider.saveMatchup(matchupData.cardOneId, matchupData.cardTwoId, pickedCardId, matchupData.time);
            
            var best = rankOne >= rankTwo ? 1 : 2;
            var pickedBest = matchupData.picked == best;
            
            res.send({ 
                pickedBest: pickedBest
            });
        });
    });
});
 
cardProvider.initialize();
dbProvider.initialize();

var server_port = process.env.PORT || 8080;
var server_ip_address = process.env.IP || '127.0.0.1';

server.listen(server_port, server_ip_address, function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
    
// If the connection throws an error
mongoose.connection.on("error", function(err) {
  console.error('Failed to connect to DB ' + db_server + ' on startup ', err);
});
 
// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection to DB :' + db_server + ' disconnected');
});
 
var gracefulExit = function() { 
  mongoose.connection.close(function () {
    console.log('Mongoose default connection with DB :' + db_server + ' is disconnected through app termination');
    process.exit(0);
  });
}
 
// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
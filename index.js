var express = require('express');
var app = express();
var twitter = require('./lib/twitter-control.js')(app);

app.set('port', (process.env.PORT || 5000));
app.use(express.static('static'));
app.set('view engine', 'pug');

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/tweet', function(req, res) {
	if(!authenticate()) {
		res.status(500);
		res.render('error', {error: "Authentication problem! Please sign-in again."});
	}
	else {
		username = req.query.name;
		screenName = req.query.screen_name;
		res.render('tweet', {user: username, screenName: screenName});
	}
});

app.get('/success', function(req, res) {
	if(!authenticate()) {
		res.status(500);
		res.render('error', {error: "Authentication problem! Please sign-in again."});
	}
	else {
		res.render('success');
	}
});

app.use(function (err, req, res, next) {
	res.status(500);
	res.render('error');
	console.log(err);
});

app.listen(app.get('port'), function() {
	console.log("Listening on port " + app.get('port'));
});
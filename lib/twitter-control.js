var bodyParser = require('body-parser');
var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
	consumerKey: process.env.CONSUMER_KEY,
  	consumerSecret: process.env.CONSUMER_SECRET,
  	callback: process.env.CALLBACK_URL
});

var _requestTokenSecret;
var _accessToken;
var _accessTokenSecret;

module.exports = function(app) {
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
	  extended: true
	}));
	
	app.get('/sign-in', function(req, res) {
		twitter.getRequestToken(function(err, requestToken, requestTokenSecret) {
			if(err) {
				res.status(500);
				res.render('error');
				console.log(err);
			}
			else {
				_requestTokenSecret = requestTokenSecret;
				res.redirect("https://twitter.com/oauth/authenticate?oauth_token=" + requestToken);
			}
		});
	});

	app.get('/callback', function(req, res) {
		requestToken = req.query.oauth_token;
		verifier = req.query.oauth_verifier;
		twitter.getAccessToken(requestToken, _requestTokenSecret, verifier, function(err, accessToken, accessTokenSecret) {
			if(err) {
				res.status(500);
				res.render('error');
				console.log(err);
			}
			else {
				twitter.verifyCredentials(accessToken, accessTokenSecret, function(err, data, response) {
					if (err) {
						res.status(500);
						res.render('error');
						console.log(err);
					}
					else {
						_accessToken = accessToken;
						_accessTokenSecret = accessTokenSecret;
						res.redirect("/tweet?name="+data.name+"&screen_name="+data.screen_name);
					}
				});
			}
		});
	});

	app.post('/postTweet', function(req, res) {
		myStatuses = processMsg(req.body.msg);
		l = myStatuses.length;
		if(l==1) {
			twitter.statuses("update", {status: myStatuses[0]}, _accessToken, _accessTokenSecret, function(err, data, response) {
				if (err) {
					if(err.statusCode === 403) {
						dat = JSON.parse(err.data);
						if(dat.errors[0].code === 220) {
							res.status(500);
							res.render('error', {error: "Authentication problem! Please sign-in again."});
							console.log(err);
						}
					}
					else {
						res.render('error');
						console.log(err);
					}
				}
				else {
					res.redirect('/success');
				}
			});
		}
		else {
			myTweet(0, myStatuses, res);
		}
	});

	this.authenticate = function() {
		return !(_accessToken===undefined || _accessTokenSecret===undefined);
	};
}

function myTweet(i, statuses, res) {
	if(i>=statuses.length) {
		res.redirect('/success');
		return;
	}
	var myStatus = "(" + (i+1) + "/" + statuses.length + ") " + statuses[i];
	twitter.statuses("update", {status: myStatus}, _accessToken, _accessTokenSecret, function(err, data, response) {
		if (err) {
			res.status(500).send("Error Occured!");
			console.log(err);
		}
		else {
			myTweet(i+1, statuses, res);
		}
	});
};

function processMsg(x) {
	r = [];
	while (x.length>130) {
		r.push(x.substring(0,130));
		x = x.substring(130);
	}
	r.push(x);
	return r;
};
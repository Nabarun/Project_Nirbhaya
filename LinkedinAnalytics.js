var express = require('express'),
	 OAuth = require('oauth').OAuth,
	 querystring = require('querystring');

// Setup the Express.js server
var app = express();
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());

app.use(express.session({
	secret: "skjghskdjfhbqigohqdiouk"
}));

// Home Page
app.get('/', function(req, res){
	if(!req.session.oauth_access_token) {
		res.redirect("/linkedin_login");
	}
	else {
		res.redirect("/linkedin_contacts");
	}
});

// Request an OAuth Request Token, and redirects the user to authorize it
app.get('/linkedin_login', function(req, res) {
	
	var getRequestTokenUrl = "https://api.linkedin.com/uas/oauth/requestToken?scope=r_network";

	
	var oa = new OAuth(getRequestTokenUrl,
	                  "https://api.linkedin.com/uas/oauth/accessToken",
	                  "e5342gtz2psb",
	                  "REKrJJip4PD4UoZR",
	                  "1.0",
	                  "http://localhost:3000/linkedin_cb"+( req.param('action') && req.param('action') != "" ? "?action="+querystring.escape

(req.param('action')) : "" ),
	                  "HMAC-SHA1");

	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
	  if(error) {
			console.log('error');
	 		console.log(error);
		}
	  else { 
			// store the tokens in the session
			req.session.oa = oa;
			req.session.oauth_token = oauth_token;
			req.session.oauth_token_secret = oauth_token_secret;
		
			// redirect the user to authorize the token
	   		res.redirect("https://www.linkedin.com/uas/oauth/authorize?oauth_token="+oauth_token);
	  }
	})

});

// Callback for the authorization page
app.get('/linkedin_cb', function(req, res) {
		
	// get the OAuth access token with the 'oauth_verifier' that we received
	
	req.session.oauth_token.verifier = req.query.oauth_verifier;
	//var oauth = req.session.oauth;

	var oa = new OAuth(req.session.oa._requestUrl,
	                  req.session.oa._accessUrl,
	                  req.session.oa._consumerKey,
	                  req.session.oa._consumerSecret,
	                  req.session.oa._version,
	                  req.session.oa._authorize_callback,
	                  req.session.oa._signatureMethod);
	
    console.log(oa);
	
	oa.getOAuthAccessToken(
		req.session.oauth_token, 
		//oauth.token,
		req.session.oauth_token_secret, 
		//oauth.token_secret,
		req.param('oauth_verifier'), 
		//oauth.verifier,
		function(error, oauth_access_token, oauth_access_token_secret, results2) {
			
			if(error) {
				console.log('error');
				console.log(error);
				
	 		}
	 		else {
				//req.session.linkedin_redirect_url = req.url;
				// store the access token in the session
				req.session.oauth_access_token = oauth_access_token;
				req.session.oauth_access_token_secret = oauth_access_token_secret;
				
				//res.redirect("https://www.linkedin.com/uas/oauth/authenticate?oauth_token=" + oauth_access_token);
				res.redirect((req.param('action') && req.param('action') != "") ? req.param('action') : "/linkedin_track");

	 		}

	});
	
});



app.get('/linkedin_track', function(req, res) {
	var oa = new OAuth(req.session.oa._requestUrl,
	                  req.session.oa._accessUrl,
	                  req.session.oa._consumerKey,
	                  req.session.oa._consumerSecret,
	                  req.session.oa._version,
	                  req.session.oa._authorize_callback,
	                  req.session.oa._signatureMethod);
	
    console.log(oa);


	
	oa.getProtectedResource(
		"http://api.linkedin.com/v1/people/~/network/updates", 
		"GET", 
		req.session.oauth_access_token, 
		req.session.oauth_access_token_secret,
		function (error, data, response) {
			//var feed = JSON.parse(data);
			res.send(data);
			});
});
	
app.listen(3000);
console.log("listening on http://localhost:3000");

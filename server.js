// USAGE:
//
// 1. node server.js
// 2. http://localhost:3000
//
var express = require('express'); //npm install express
var app = express();

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.get('/api/foo', foo);

function foo(req, res) {
	const crypto = require('crypto'); // npm install crypto
	const uuid = require('uuid'); // npm install uuid
	const EMBED_PATH = "https://app.sigmacomputing.com/embed/YOUR_DASHBOARD_ID_HERE"; // ** CHANGE
	const EMBED_SECRET = "YOUR_SECRET_KEY_HERE"; // *** CHANGE
	const user_id = "testUser";  //*** used to pass unique user ID looking at dashboard

	// :nonce - Any random string you like but cannot be repeated within the hour.
	let searchParams = `?:nonce=${uuid.v4()}`;

	// :allow_export - true to allow export/download on visualizations
	searchParams += '&:allow_export=true';

	// :session_length - The number of seconds the user should be allowed to view the embed
	searchParams += '&:session_length=3600';

	// :time - Current Time as UNIX Timestamp
	searchParams += `&:time=${Math.floor(new Date().getTime() / 1000)}`;

	// :external_user_id - a unique JSON string identifying the viewer
	searchParams += `&:external_user_id=${user_id}`;

	// `Control Id` is the Control Id from your dashboard and `controlValue` is the value you wish to pass
	// searchParams += `&${encodeURIComponent('Region Region')}=${encodeURIComponent('West')}`;

	// EMBED_PATH - Generated on your dashboard
	const URL_WITH_SEARCH_PARAMS = EMBED_PATH + searchParams;

	// EMBED_SECRET - Sigma Embed Secret generated in your admin portal
	const SIGNATURE = crypto
		.createHmac('sha256', Buffer.from(EMBED_SECRET, 'utf8'))
		.update(Buffer.from(URL_WITH_SEARCH_PARAMS, 'utf8'))
		.digest('hex');

	const URL_TO_SEND = `${URL_WITH_SEARCH_PARAMS}&:signature=${SIGNATURE}`;

	res.status(200).send({url:URL_TO_SEND});
}

app.listen(3000);

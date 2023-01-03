// Example of Sigma Workbook Embedding
//
// This program shows an example of how to generate secure embedded URLs for
// use in external applications. Additional documentation can be found at:
// https://help.sigmacomputing.com/hc/en-us/articles/1500011574541

// USAGE:
//
// 1. Change EMBED_SECRET, EMBED_CLIENT_ID, and EMBED_PATH (documentation below)
// 2. You can also change EMBED_MODE, EMBED_USER_EMAIL, EMBED_USER_TEAM, and
//    EMBED_USER_ACCOUNT_TYPE
// 2. node server.js
// 3. open http://localhost:3000

const crypto = require('crypto');
const http = require('http');

const PORT = 3000;

// EMBED_SECRET - Sigma Embed Secret generated in your admin portal
// EMBED_CLIENT_ID - Unique ID associated with your Sigma Embed Secret
// Embed secrets are used to securely sign your embed URLs, ensuring your
// application embed URLs and parameters are valid.
//
// To create a secret:
// 1. Open the Admin page in your Sigma instance.
// 2. Go to the APIs & Embed Secrets tab.
// 3. Click "Create New".
// 4. Under "API Token or Embed Secret?", select "Embed Secret".
// 5. Enter a name and select an owner.
// 6. Click "Create".
// 7. Click "Copy" to copy the Embed Secret from the modal, and paste it below.
//    Note: You will be able to view this key only once.
// 8. Click "Close".
// 9. In the APIs & Embed Secrets table, find the secret you just created.
//    Click the clipboard icon next to the client ID to copy the Embed Client ID,
//    and paste it below.
const EMBED_SECRET = "YOUR_SECRET_KEY_HERE"; // *** CHANGE
const EMBED_CLIENT_ID = "YOUR_CLIENT_ID_HERE"; // *** CHANGE

// EMBED_PATH - Generated on your dashboard
// An embed path is a URL that points to the workbook, workbook page, or element
// that you are embedding. This path can be created from your workbook's Embed
// Workbook modal.
//
// To create an embed path:
// 1. Open a Sigma Workbook
// 2. If the workbook is in a draft state, click the Publish button. A workbook
//    must be published to create or manage embeds.
// 3. Click the caret (▼) button to the right of the workbook title in the header.
// 4. Select Embedding from the menu. This will open the Embedding modal.
// 5. Under Generate Application Embed Path for, select your embed target.
//    Options will include the entire workbook, all individual workbook pages, and
//    all individual data elements.
// 6. The embed path will automatically be generated. Copy-paste the path below.
const EMBED_PATH = "https://app.sigmacomputing.com/embed/YOUR_DASHBOARD_ID_HERE"; // ** CHANGE

// EMBED_MODE - Capabilities of the embed
// The embed mode can be one of "view", "explore", or "userbacked".
// - In "view" mode, users can view the embedded dashboard.
// - In "explore" mode, users can see drill down into visualizations, examine
//   underlying row-level data, and modify formulas.
// - In "userbacked" mode, users can save their copies of workbooks, make changes,
//   and share them with other users on the same team. You must also set
//   EMBED_USER_EMAIL, EMBED_USER_TEAM, and EMBED_USER_ACCOUNT_TYPE.
const EMBED_MODE = "explore"

// EMBED_USER_EMAIL - Unique ID associated with the user looking at the dashboard
// EMBED_USER_TEAM (only in "userbacked" mode) - Sigma Team associated with the
// embed user
// EMBED_USER_ACCOUNT_TYPE (only in "userbacked" mode) - Account type and grants
// for the embed. This can be a standard Sigma account type like "explorer" or
// "viewer", or any custom account type created via the Sigma admin interface.
const EMBED_USER_EMAIL = "testuser@example.com"
const EMBED_USER_TEAM = 'My Team'
const EMBED_USER_ACCOUNT_TYPE = 'explorer'

// Create a local HTTP server to generate secure URLs and return a page containing
// an embed in an iframe.
const server = http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/html' });

	// When generating your embed URL, you must specify parameters that define what
	// users will see and how they can interact with your embed.
	let urlParams = [
		// :client_id - unique ID associated with your embed secret
		`:client_id=${EMBED_CLIENT_ID}`,

		// :mode - set to allow exploring the embed in a more interactive manner,
		// or even modifying and saving dashboards
		`:mode=${EMBED_MODE}`,

		// :external_user_id - a unique string identifying the user.
		`:external_user_id=${EMBED_USER_EMAIL}`,

		// :session_length - The number of seconds the user should be allowed to view
		// the embed.
		':session_length=3600',

		// :time - Current Time as UNIX Timestamp. Used in combination with :session_length
		// to determine if an embed has expired.
		`:time=${Math.floor(Date.now() / 1000)}`,

		// :nonce - Any random string you like but cannot be repeated in any embed url
		// within the hour. Sigma uses this to prevent application embed URLs from
		// being shared and reused.
		// *** CHANGE - in production, you would likely replace this with something
		// like a UUID
		`:nonce=${crypto.randomBytes(16).toString('hex')}`,
	];

	if (EMBED_MODE === 'userbacked') {
		urlParams.push(
			// :email - an email identifying the user (only in "userbacked" mode)
			`:email=${EMBED_USER_EMAIL}`,

			// :external_user_team - team the embed user should be a part of (only in
			// "userbacked" mode)
			`:external_user_team=${EMBED_USER_TEAM}`,

			// :account_type - account type and feature permissions the user should
			// have (only in "userbacked" mode)
			`:account_type=${EMBED_USER_ACCOUNT_TYPE}`,
		);
	} else {
		urlParams.push(
			// :allow_export - true to allow export/download on visualizations. (only in
			// "view" or "explore" mode)
			':allow_export=true',

			// // Additional parameters will be passed directly to your Sigma Workbook,
			// // where they are used to set the values of page controls and filters. This
			// // is used to enforce security policy and ensure users only see data they
			// // are authorized to. (only in "view" or "explore" mode)
			// // `Control Id` is the Control Id from your dashboard and `controlValue` is
			// // the value you wish to pass.
			// // `${encodeURIComponent('Control Id')}=${encodeURIComponent('controlValue')}`,
			// // Example - setting a `Region` filter to only show data matching `West`
			// `${encodeURIComponent('Region')}=${encodeURIComponent('West')}`,
		);
	}

	// Concat the parameters onto the EMBED_PATH, which was generated on your dashboard
	const urlWithParams = EMBED_PATH + '?' + urlParams.join('&');
	// Generate a secure signature for the URL and parameters, signed using the
	// EMBED_SECRET generated in your admin portal.
	// Sigma uses industry standard HMAC-SHA256 to secure the URL. Users can see the
	// parameters in the URL, but since they don't know the EMBED_SECRET they cannot
	// change the parameters and forge a valid signature.
	const signature = crypto
		.createHmac('sha256', EMBED_SECRET, {encoding: 'utf8'})
		.update(urlWithParams, 'utf8')
		.digest('hex');
	// Append the signature to the URL as the final parameter
	const urlToSend = `${urlWithParams}&:signature=${signature}`;

	// Finally, return an html document with an iframe pointing to the generated URL
	const content = `
		<html>
		<head>
			<title>Sigma iframe embed</title>
			<style type="text/css">
				body {
					display: flex;
					flex-direction: column;
					min-height: 100%;
					box-sizing: border-box;
					margin: 0;
					padding: 10px;
				}
				iframe {
					flex: 1;
					border: 2px solid #ccc;
				}
			</style>
		</head>
		<body>
			<h2>Sigma Application Embedding</h2>
			<h3>Secure iframe URL below generated in server.js</h3>
			<iframe id="sigmaDashboard" src="${urlToSend}"></iframe>
		</body>
		</html>
	`;

	res.end(content);
});

console.log(`Listening on http://localhost:${PORT}/`)
server.listen(PORT);

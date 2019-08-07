/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";

var xsenv = require("@sap/xsenv");
var xssec = require("@sap/xssec");
var express = require("express");
var passport = require("passport");
var bodyParser = require("body-parser");

var app = express();

passport.use("JWT", new xssec.JWTStrategy(xsenv.getServices({
	uaa: {
		tag: "xsuaa"
	}
}).uaa));
app.use(passport.initialize());
app.use(passport.authenticate("JWT", {
	session: false
}));
app.use(bodyParser.json());

/**
 * This is the default end-point when someone attempts to access the SaaS application.
 * We show a message to the logged in user.
 * Format of the message: Hello <logon name>; your tenant sub-domain is <consumer sub-domain>; your tenant zone id is <consumer tenant id>
 * The logon name will be specific to each user.
 * The tenant zone and sub domain will be the same for all users of one consumer(tenant).
 */
app.get("/", function (req, res) {
	if (req.authInfo.checkScope("$XSAPPNAME.User")) {
		var responseStr = "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp</h1><h2>Welcome User " + req.authInfo.userInfo.givenName +
			" " + req.authInfo.userInfo.familyName + "!</h2><p><b>Subdomain:</b> " + req.authInfo.subdomain + "</p><p><b>Identity Zone:</b> " +
			req.authInfo
			.identityZone + "</p></body></html>";
		res.status(200).send(responseStr);
	} else {
		res.status(403).send("Forbidden");
	}

});

app.get("/admin", function (req, res) {
	if (req.authInfo.checkScope("$XSAPPNAME.Administrator")) {
		var responseStr = "<!DOCTYPE HTML><html><head><title>MTApp</title></head><body><h1>MTApp</h1><h2>Welcome Admin " + req.authInfo.userInfo.givenName +
			" " + req.authInfo.userInfo.familyName + "!</h2><p><b>Subdomain:</b> " + req.authInfo.subdomain + "</p><p><b>Identity Zone:</b> " +
			req.authInfo
			.identityZone + "</p></body></html>";
		res.status(200).send(responseStr);
	} else {
		res.status(403).send("Forbidden");
	}

});

/**
 * subscribe/onboard a subscriber tenant
 * Request Method Type - PUT
 * When a consumer subscribes to this application, SaaS Provisioning invokes this API.
 * We return the SaaS application url for the subscribing tenant.
 * This URL is unique per tenant and each tenant can access the application only through it's URL.
 */
app.put("/callback/v1.0/tenants/*", function (req, res) {
	var tenantAppURL = "https:\/\/" + req.body.subscribedSubdomain + "-dev-mtapprouter" + ".cfapps.eu10.hana.ondemand.com";
	res.status(200).send(tenantAppURL);
});


/**
 * unsubscribe/offboard a subscriber tenant
 * Request Method Type - DELETE
 * When a consumer unsubscribes this application, SaaS Provisioning invokes this API.
 * We delete the consumer entry in the SaaS Provisioning service.
 */
app.delete("/callback/v1.0/tenants/*", function (req, res) {
	res.status(200).send("");
});

var server = require("http").createServer();
var port = process.env.PORT || 3000;

server.on("request", app);

server.listen(port, function () {
	console.info("Backend: " + server.address().port);
});
var bodyParser = require('body-parser')
var express = require('express');
var app = express();
app.use(bodyParser.json())

app.use(function (req, res) {
	 //console.log("Type: " + req.body.request.type);
	 //console.log("Intent: " + req.body.request.intent.name);
	 //console.log("asset: " + req.body.request.intent.slots.Asset.name);
	 //console.log("Asset Value: " + req.body.request.intent.slots.Asset.value);
	 //console.log("Asset Number: " + req.body.request.intent.slots.AssetNumber.value);

    routeIntent(req.body.request);

	var response = {
			"version": "1.0",
				"response": {
					"outputSpeech": {
						"type": "PlainText",
						"text": "Welcome to VersionOne vEcho"
					},
					"card": {
						"type": "Simple",
						"content": "Welcome to VersionOne vEcho",
						"title": "VersionOne vEcho"
					},
					"reprompt": {
						"outputSpeech": {
							"type": "PlainText",
							"text": "Welcome to VersionOne vEcho"
						}
					},
					"shouldEndSession": false
				},
				"sessionAttributes": null
			};
		res.send(response);
	});

var port = process.env.PORT || 3000;

app.listen(port, function () {
	console.log('Example app listening on port 3000!');
});

function routeIntent(request){
	var intent = request.intent.name == undefined ? "" : request.intent.name;
	var assetType = request.intent.slots.Asset.name == undefined ? "" : request.intent.slots.Asset.value;
	var assetId = request.intent.slots.AssetNumber;

	switch(intent) {
		case "Tell":{
			console.log("Tell");
			console.log("intent: " + intent);
			console.log("assetType: " + assetType);
			console.log("assetID: " + assetId);

		}
		break;
		case "Create":{

		}
		break;
		default: {

		}
	}
}

function getAssetDetails(){

}
var bodyParser = require('body-parser')
var express = require('express');
var request = require('superagent');
var Promise = require('promise');
var agent = require('superagent-promise')(require('superagent'), Promise);


var app = express();
app.use(bodyParser.json())

app.use(function (req, res) {
	var response = routeIntent(req.body.request);
	response.then (function(result, err){
		console.log (result);
		return res.send(result);
	});
});

var port = process.env.PORT || 3000;

app.listen(port, function () {
	console.log('Example app listening on port 3000!');
});

function routeIntent(request){
	var intent = request.intent.name == undefined ? "" : request.intent.name;
	var assetType = request.intent.slots.Asset.name == undefined ? "" : request.intent.slots.Asset.value;
	var assetId = request.intent.slots.AssetNumber.value == undefined ? "" :request.intent.slots.AssetNumber.value;
	var sentence, title, shouldEndSession;


	switch(intent) {
		case "Tell":{
			title = "Version One Asset Details";
			shouldEndSession = true;
			return getAssetDetails(assetType, assetId)
					.then(function(res,err){
						console.log('res', res);
						sentence = createAssetDetailsResponse(JSON.parse(res.text),assetType);
						return createResponse(title, sentence, shouldEndSession)
				})
		}
		break;
		case "Create":{

		}
		break;
		default: {

		}
	}
}

function getAssetDetails(assetType, assetId){
	var prefix = 'http://walker.eastus.cloudapp.azure.com/VersionOne'; //  'http://builds.versionone.net/PR_16.0.2.11614'
	var url  = prefix + "/rest-1.v1/Data/" + assetType + '/' + assetId
	console.log("url", url)

	return agent('GET', url)
		.set('Accept', 'application/json')
		.query({sel: 'Name,Number,Scope.Name,Description,Status.Name,Priority.Name,Owners.Name,Estimate'})
		.end();

}

function createAssetDetailsResponse(assetDetails, assetType){
	console.log('assetDetails', assetDetails)
	var attr = assetDetails.Attributes;

	var details = {
		'number': attr.Number.value,
		'name': attr.Name.value,
		'description': attr.Description.value,
		'owner': attr["Owners.Name"].value[0],
		'estimate': attr.Estimate.value,
		'priority': attr["Priority.Name"].value,
		'project': attr["Scope.Name"].value,
		'status': attr["Status.Name"].value
	}

	var sentence = assetType + " " + details.number + " is named " + details.name + " and has a description of " + details.description + ".";
	sentence += " It is owned by " + details.owner;
	sentence += " and has an estimate of " + details.estimate;
	sentence += " This " + assetType + "is of " + details.priority + " and has a status of " + details.status;
	sentence += " It is being worked in the " + details.project + " project.";
 	console.log(sentence);
	return sentence;
}

function createResponse(title, sentence, shouldEndsession){
	return response = {
		"version": "1.0",
		"response": {
			"outputSpeech": {
				"type": "PlainText",
				"text": sentence
			},
			"card": {
				"type": "Simple",
				"content": sentence,
				"title": title
			},
			"reprompt": {
				"outputSpeech": {
					"type": "PlainText",
					"text": sentence
				}
			},
			"shouldEndSession": false
		},
		"sessionAttributes": null
	}
}



























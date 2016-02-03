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
		return res.send(result);
	});
});

var port = process.env.PORT || 3000;

app.listen(port, function () {
});

function routeIntent(request){
	console.log('REQUEST:::', request)
	var intent = request.intent == undefined ? "" : request.intent.name;
	var assetType = request.intent.slots.Asset == undefined ? "" : request.intent.slots.Asset.value;
	var assetId = request.intent.slots.AssetNumber.value == undefined ? "" :request.intent.slots.AssetNumber.value;
	var sentence, title, shouldEndSession;


	switch(intent) {
		case "Tell":{
			title = "Version One Asset Details";
			shouldEndSession = false;
			return getAssetDetails(assetType, assetId)
					.then(function(res,err){
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

	return agent('GET', url)
		.set('Accept', 'application/json')
		.query({sel: 'Name,Number,Scope.Name,Description,Status.Name,Priority.Name,Owners.Name,Estimate'})
		.end();

}

function createAssetDetailsResponse(assetDetails, assetType){
	console.log('assetDetails', assetDetails)
	var attr = assetDetails.Attributes;

	var details = {
		'number': 'none', // attr.Number.value,
		'name': 'none',//attr.Name.value,
		'description': 'none',//attr.Description.value,
		'owner': 'none',//attr["Owners.Name"].value[0],
		'estimate': 'none',//attr.Estimate.value,
		'priority': 'none',//attr["Priority.Name"].value,
		'project': 'none',//attr["Scope.Name"].value,
		'status': 'none',//attr["Status.Name"].value
	}

	var sentence = assetType + " " + details.number + " is named " + details.name + " and has a description of " + details.description + ".";
	sentence += " It is owned by " + details.owner;
	sentence += " and has an estimate of " + details.estimate;
	sentence += " This " + assetType + "is of " + details.priority + " and has a status of " + details.status;
	sentence += " It is being worked in the " + details.project + " project.";
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



























var bodyParser = require('body-parser')
var express = require('express');
var request = require('superagent');
var Promise = require('promise');
var agent = require('superagent-promise')(require('superagent'), Promise);


var app = express();
app.use(bodyParser.json())

app.use(function (req, res) {
	if (req.body.request.type !== 'IntentRequest')
		return res.send();

	console.log('BODY!!!!', req.body);

	var response = routeIntent(req.body.request);
	response.then (function(result, err){
		return res.send(result);
	});
});

var port = process.env.PORT || 3000;

app.listen(port, function () {
});

function routeIntent(request){
	var intent = request.intent == undefined ? "" : request.intent.name;
	var assetType = request.intent.slots.Asset == undefined ? "" : request.intent.slots.Asset.value;
	var sentence, title, shouldEndSession;
	assetType = assetTypeMapper(assetType);

	switch(intent) {
		case "TellIntent":{
			var assetId = request.intent.slots.AssetNumber.value == undefined ? "" :request.intent.slots.AssetNumber.value;

			title = 'Version One ' + assetType + '  details';
			shouldEndSession = true;
			return getAssetDetails(assetType, assetId)
					.then(function(res){
						sentence = assetDetailsResponse(JSON.parse(res.text),assetType);
						return createEchoResponse(title, sentence, shouldEndSession)
				}).catch(function(err){
					console.log(err);
				});
		}
		break;
		case "CreateIntent":{
			title = "Version One Create a new " + assetType;

			var title = request.intent.slots.Title.value == undefined ? "" : request.intent.slots.Title.value;
			var descrition = request.intent.slots.Description.value == undefined ? "" : request.intent.slots.Description.value;
			var estimate = request.intent.slots.Estimate.value == undefined ? "" : request.intent.slots.Estimate.value;

			return createAsset(assetType,title, descrition,estimate)
				.then(function(res){
					sentence = createAssetResponse(res.statusCode, assetType, title);
					return createEchoResponse(title, sentence, shouldEndSession);
				}).catch(function(err){
					console.log(err);

				});
		}
		break;
		case "CloseIntent": {
			title = "Version One Close " + assetType;

			var assetId = request.intent.slots.AssetNumber.value == undefined ? "" :request.intent.slots.AssetNumber.value;
			return closeAsset(assetType, assetId)
				.then(function(res){
					sentence = closeAssetResponse(res.statusCode, assetType, assetId);
					return createEchoResponse(title, sentence, shouldEndSession);
				});
		}
		break;
		default: {

		}
	}
}

function getAssetDetails(assetType, assetId){
	var attributeSelector = {
		Story : 'Name,Number,Scope.Name,Description,Status.Name,Priority.Name,Owners.Name,Estimate',
		Test : 'Name,Scope.Name,Description,Status.Name,Owners.Name,Estimate'
	}

	//Story?sel=Name,Scope.Name,Description,Status.Name,Owners.Name,Estimate,Number&where=Number=%27S-01027%27

	var prefix = 'http://walker.eastus.cloudapp.azure.com/VersionOne';
	var url  = prefix + "/rest-1.v1/Data/" + assetType + '/' + assetId + '?sel=' + attributeSelector[assetType]

	return agent('GET', url)
		.set('Accept', 'application/json')
		.query({sel: attributeSelector[assetType]})
		.end();

}

function createAsset(assetType, title, description, estimate){
	var body = createV1BodyForCreateAsset (assetType, title, description, estimate)
	var prefix = 'http://walker.eastus.cloudapp.azure.com/VersionOne';
	var url  = prefix + '/rest-1.v1/Data/' + assetType

	return agent('Post', url)
		.set('Content-Type', 'application/xml')
		.send(body)
		.end();
}

function createV1BodyForCreateAsset(assetType, title, description, estimate){
		return '<?xml version="1.0" encoding="UTF-8"?>' +
				'<Asset href="/VersionOne/rest-1.v1/New/' + assetType + '">' +
					'<Attribute name="Name" act="set">' + title + '</Attribute>' +
					'<Attribute name="Description" act="set">' + description + '</Attribute>' +
					'<Attribute name="Estimate" act="set">' + estimate + '</Attribute>' +
					'<Relation name="Team" act="set">' +
						'<Asset href="/VersionOne/rest-1.v1/Data/Team/1116" idref="Team:1116" />' +
					'</Relation>' +
					'<Relation name="Scope" act="set">' +
						'<Asset href="/VersionOne/rest-1.v1/Data/Scope/1100" idref="Scope:1100" />' +
					'</Relation>' +
				'</Asset>'
}

function closeAsset(assetType, assetId){
	var prefix = 'http://walker.eastus.cloudapp.azure.com/VersionOne';
	var url  = prefix + '/rest-1.v1/Data/' + assetType + '/' + assetId + '?op=QuickClose'

	return agent('Post', url)
		.set('Content-Type', 'application/xml')
		.end();
}

function assetDetailsResponse(assetDetails, assetType){
	console.log('assetDetails', assetDetails)
	var attr = assetDetails.Attributes;

	var details = {
		'number': attr.Number == undefined ? "" : attr.Number.value,
		'name': attr.Name == undefined ? "" : attr.Name.value,
		'description': attr.Description == undefined ? "" : attr.Description.value,
		'owner': attr["Owners.Name"] == undefined ? "" : attr["Owners.Name"].value[0],
		'estimate': attr.Estimate == undefined ? "" : attr.Estimate.value,
		'priority': attr["Priority.Name"] == undefined ? "" : attr["Priority.Name"].value,
		'project': attr["Scope.Name"] == undefined ? "" : attr["Scope.Name"].value,
		'status': attr["Status.Name"] == undefined ? "" : attr["Status.Name"].value
	}

	var sentence = 'This is a ' + assetType + " and is named " + details.name + "   .   ";
	sentence += " It is owned by " + details.owner + "    .   ";
	sentence += " and has an estimate of " + details.estimate + "   .  ";
	sentence += " This " + assetType + "has a priority " + details.priority + " and has a status of " + details.status + "   .  ";
	sentence += " It is being worked in the " + details.project + " project.  ";
	return sentence;
}

function createAssetResponse(statusCode, assetType, title){
	if (statusCode == 200){
		var success =  'Success!!  Your new ' + assetType + '  with a title of  ' + title;
			success += '  has been created   .  '

		return success;
	}

	return 'We are sorry, creating ' + assetType + '  was not successful  .   Please try again.'
}

function closeAssetResponse(statusCode, assetType, assetId){
	if (statusCode == 200){
		return  success =  'Success!!  Your have closed the ' + assetType + '    ' + assetId;
	}

	return 'We are sorry, closing the ' + assetType + '  was not successful  .   Please try again.'
}

function createEchoResponse(title, sentence, shouldEndsession){
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
			"shouldEndSession": shouldEndsession
		},
		"sessionAttributes": null
	}
}

function assetTypeMapper(assetType){
	assetType = assetType.toLowerCase();

	var assetTypeMapper = {
		story : "Story",
		test : "Test",
		defect : "Defect",
		teamroom : "Teamroom"
	}

	return assetTypeMapper[assetType]
}
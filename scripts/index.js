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
	var assetType, sentence, title, shouldEndSession;

	var intent = request.intent == undefined ? "" : request.intent.name;

	if(request.intent.slots) {
		assetType = request.intent.slots.Asset == undefined ? "" : request.intent.slots.Asset.value;
	}


	switch(intent) {
		case "TellIntent":{
			assetType = assetTypeMapper(assetType);
			var assetId = request.intent.slots.AssetNumber.value == undefined ? "" :request.intent.slots.AssetNumber.value;
			var assetNumber = createAssetNumber(assetType, assetId);

			title = 'Version One ' + assetType + '  details';
			shouldEndSession = true;
			return getAssetDetails(assetType, assetNumber)
					.then(function(res){
						sentence = assetDetailsResponse(JSON.parse(res.text),assetType,assetNumber);
						return createEchoResponse(title, sentence, shouldEndSession)
				}).catch(function(err){
					console.log(err);
				});
		}
		break;
		case "CreateIntent":{
			assetType = assetTypeMapper(assetType);
			title = "Version One Create a new " + assetType;
			var assetTitle = request.intent.slots.Title.value == undefined ? "" : request.intent.slots.Title.value;
			var description = request.intent.slots.Description.value == undefined ? "" : request.intent.slots.Description.value;
			var estimate = request.intent.slots.Estimate.value == undefined ? "" : request.intent.slots.Estimate.value;

			return createAsset(assetType,assetTitle, description,estimate)
				.then(function(res){
					sentence = createAssetResponse(res.statusCode, assetType, title);
					return createEchoResponse(title, sentence, shouldEndSession);
				}).catch(function(err){
					console.log(err);

				});
		}
		break;
		case "CloseIntent": {
			assetType = assetTypeMapper(assetType);
			title = "Version One Close " + assetType;
			var assetId = request.intent.slots.AssetNumber.value == undefined ? "" :request.intent.slots.AssetNumber.value;

			return closeAsset(assetType, assetId)
				.then(function(res){
					sentence = closeAssetResponse(res.statusCode, assetType, assetId);
					return createEchoResponse(title, sentence, shouldEndSession);
				});
		}
		break;
		case "UpdateIntent": {
			assetType = assetTypeMapper(assetType);
			title = "Version One Updated a " + assetType;
			var assetId = request.intent.slots.AssetNumber.value == undefined ? "" :request.intent.slots.AssetNumber.value;
			var assetNumber = createAssetNumber(assetType, assetId);

			return updateAsset(assetType, assetId)
				.then(function(res){
					sentence = updateAssetResponse(res.statusCode, assetType, assetNumber);
					return createEchoResponse(title, sentence, shouldEndSession);
				});
		}
		break;
		case "TeamroomIntent":{
			title = "Version One teamroom details ";
			sentence = createTeamroomResponse();
			return new Promise(function (resolve, reject) {
				resolve(createEchoResponse(title, sentence, shouldEndSession))
			});
		}
		break;
		case "CompanyIntent":{
			title = "Version One Company details ";
			sentence = createCompanyResponse();
			return new Promise(function (resolve, reject) {
				resolve(createEchoResponse(title, sentence, shouldEndSession))
			});
		}
		break;
		default: {

		}
	}
}

function getAssetDetails(assetType, assetNumber){
	var attributeSelector = {
		Story : 'Name,Number,Scope.Name,Description,Status.Name,Priority.Name,Owners.Name,Estimate',
		Test : 'Name,Scope.Name,Description,Status.Name,Owners.Name,Estimate',
		Defect : 'Name,Scope.Name,Description,Status.Name,Owners.Name,Estimate'
	}

	var prefix = 'http://walker.eastus.cloudapp.azure.com/VersionOne';
	var url  = prefix + "/rest-1.v1/Data/" + assetType + '?sel=' + attributeSelector[assetType] + '&where=Number=%27' +  assetNumber + '%27'

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

function updateAsset (assetType, assetId){
	var body = createBodyForUpdate ()
	var prefix = 'http://walker.eastus.cloudapp.azure.com/VersionOne';
	var url  = prefix + '/rest-1.v1/Data/' + assetType + '/' + assetId

	return agent('Post', url)
		.set('Content-Type', 'application/xml')
		.send(body)
		.end();
}

function createBodyForUpdate(){
	return '<Asset>' +
		'<Relation name="Status" act="set">' +
		'<Asset idref="StoryStatus:134" />' +
		'</Relation>' +
		'</Asset>'
}

function assetDetailsResponse(assetDetails, assetType, assetNumber){
	console.log('assetDetails', assetDetails)
	var attr = assetDetails.Assets[0].Attributes;

	var details = {
		'number': assetNumber,
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
	sentence += " This " + assetType + "has a priority " + details.priority + " and has a status of  " + details.status + "   .  ";
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

function updateAssetResponse(statusCode, assetType, assetNumber){
	if (statusCode == 200){
		return  success =  'Success!!  Your have updated the ' + assetType + '    ' + assetNumber + '  with a status of  in progress. ';
	}

	return 'We are sorry, closing the ' + assetType + '  was not successful  .   Please try again.'
}

function createTeamroomResponse(){
	return "Team Imperial Force has been very busy  . The next item in the backlog is CRM integration.  It has an average velocity of 9 and has planned 67 points for the next iteration.  Andre and Willy have been kicking ass.  "
}

function createCompanyResponse(){
	return "Version One is a super awesome company that develops End-to-end enterprise agile software solutions for helping organizations scale agile faster, easier, and smarter."
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

function createAssetNumber(assetType, assetNumber){
	var assetPrefixMapper = {
		Story : "S-",
		Test : "T-",
		Defect : "D-",
		Teamroom : "T-"
	}

	return assetPrefixMapper[assetType] + assetNumber
}
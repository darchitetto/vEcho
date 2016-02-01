var express = require('express');
var app = express();

app.use('/*', function (req, res) {
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

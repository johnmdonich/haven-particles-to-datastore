var colors = require('colors');
var util = require('util');

/* CONFIGURATION */
var config = {
	gcpProjectId: 'ethereal-brace-122116',
	gcpPubSubSubscriptionName: 'particles',
	gcpServiceAccountKeyFilePath: './gcp_private_key.json'
};
_checkConfig();
/* END CONFIGURATION */
console.log(colors.magenta('Authenticating with Google Cloud...'));
var gconfig = {
    projectId: config.gcpProjectId,
	keyFilename: config.gcpServiceAccountKeyFilePath
};
console.log(colors.magenta('Authentication successful!'));


var datastore = require('@google-cloud/datastore')(gconfig);
var pubsub = require('@google-cloud/pubsub')(gconfig);


var subscription = pubsub.subscription(config.gcpPubSubSubscriptionName);


function storeEvent(message) {
    var key = datastore.key('HavenEventsDevB');

    datastore.insert({
        key: key,
        data: _createEventObjectForStorage(message)
    }, function(err) {
		if(err) {
			console.log(colors.red('There was an error storing the event'), err);
		}
		console.log(colors.green('Particle event stored in Datastore!\r\n'), _createEventObjectForStorage(message, true))
    });

}

subscription.on('message', function(message) {
	console.log(colors.cyan('Particle event received from Pub/Sub!\r\n'), _createEventObjectForStorage(message, true));
	storeEvent(message);
	message.ack();
});

function _checkConfig() {
	if(config.gcpProjectId === ''  || !config.gcpProjectId) {
		console.log(colors.red('You must set your Google Cloud Platform project ID in app.js'));
		process.exit(1);
	}
	if(config.gcpPubSubSubscriptionName === '' || !config.gcpPubSubSubscriptionName) {
		console.log(colors.red('You must set your Google Cloud Pub/Sub subscription name in app.js'));
		process.exit(1);
	}
}

function _createEventObjectForStorage(message, log) {
	var obj = {
		gc_pub_sub_id: message.id,
		device_id: message.attributes.device_id,
		event: message.attributes.event,
		published_at: new Date(message.attributes.published_at)
	};
    var dataMap = {iT: "TempInt", eT: "TempExt", iP: "PressureInt", eP: "PressureExt", iA: "AltitudeInt", eA: "AltitudeExt", iH: "HumidityInt", eH: "HumidityExt"};
    var data = message.data;
    Object.keys(data).map(function (dkey, dindex, darr) {
        if (Object.keys(dataMap).indexOf(dkey) !== -1) {
            obj[dataMap[dkey]] = data[dkey]
        }
        else {
            obj[dkey] = data[dkey]
        }
    });
	if(log) {
		return colors.grey(util.inspect(obj));
	} else {
		return obj;
	}
}



var AWS = require('aws-sdk');
var sns = new AWS.SNS({apiVersion: '2010-03-31'});
var Elasticsearch = require('aws-es');
var elasticsearch = new Elasticsearch({
	accessKeyId: '<accesskey>',
	secretAccessKey: '<secretkey>',
	service: 'es',
	region: 'us-east-1',
	host: '<es link>'
});
// var message = {
// 	"sentiment" : "positive"
// };

// function sendSNS(message, sendSNSCB){
//   var snsParams = {
//     Message: message, /* required */
//     TopicArn: '<snsARN>'
//   };
//   sns.publish(snsParams, function(snsErr, snsData) {
//     if(snsErr){
//       //console.log("An error occurred: "+snsErr); // an error occurred
//       sendSNSCB(snsErr);
//     }
//     else{
//       //console.log("SNS successfully sent!!: "+snsData); // successful response
//       sendSNSCB(null, "SNS successfully sent!!");
//     }
//   });
// }

exports.handler = (event, context, callback) => {
    // TODO implement
    console.log("---------------------------------->>>>>>>>>>>");
    console.log(JSON.stringify(event));
    var eventMessage = JSON.parse(event.Records[0].Sns.Message);

    var indexKeyword = eventMessage.keyword;
    console.log("indexKeyword: "+ indexKeyword);
    elasticsearch.index({
		index: indexKeyword,
		type: 'posts',
		body: {
			title: eventMessage,
			shares: 10
		}
	}, function(err, data) {
		if(err){
			console.log(err);
			callback(err);
		}
		else{
			console.log(JSON.stringify(data));
			var snsDisplayMsg = "Tweet: " + JSON.stringify(eventMessage);
			console.log("snsDisplayMsg: "+snsDisplayMsg);

			// sendSNS(snsDisplayMsg, function(snsErr, snsData){
   //            if(snsErr){
   //              console.log("An error occurred: "+snsErr); // an error occurred
   //              callback(snsErr);
   //            }
   //            else{
   //              console.log("SNS successfully sent!!: "+snsData); // successful response
   //              //console.log("finalSNSTweetMessage: "+JSON.stringify(finalSNSTweetMessage));
   //              callback(null, "Final SNS sent to the display successfully");
   //            }
   //          });
			//callback(null, "success!");
		}
		//console.log('json reply received');
		
	});

    //callback(null, 'Hello from Lambda');
};


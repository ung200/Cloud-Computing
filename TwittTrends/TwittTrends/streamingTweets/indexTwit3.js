const AWS = require('aws-sdk');
AWS.config.update({
    "region": "us-east-1"
});
var sns = new AWS.SNS({apiVersion: '2010-03-31'});
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

var Twit = require('twit')
 
var T = new Twit({
  consumer_key:         '<conKey>',
  consumer_secret:      '<consecretkey>',
  access_token:         '<accesstoken>',
  access_token_secret:  '<secrtetoken>',
  //timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests. 
})

//var timedout = false;

function sendSNS(callback){
  var snsParams = {
    Message: "Message available in SQS!", /* required */
    TopicArn: '<snsARN>'
  };
  sns.publish(snsParams, function(snsErr, snsData) {
    if(snsErr){
      //console.log("An error occurred: "+snsErr); // an error occurred
      callback(snsErr);
    }
    else{
      //console.log("SNS successfully sent!!: "+snsData); // successful response
      callback(null, "SNS successfully sent!!");
    }
  });
}

function sendMessageToSQS(message, callback){
  var sqsParams = {
    MessageBody: message, /* required */
    QueueUrl: '<sqsurl>' /* required */
  };
  sqs.sendMessage(sqsParams, function(sqsErr, sqsData) {
    if(sqsErr){
      //console.log("An error occurred with sqs sendMessage: "+sqsErr); // an error occurred
      callback(sqsErr);
    }
    else{
      //console.log("Message successfully sent to SQS!!: "+sqsData); // successful response
      callback(null, "Message successfully sent to SQS!!");
    }           
  });
}

function callTwitterStreamAPI(keyword, callTwitterCB){
  var stream = T.stream('statuses/filter', {track: keyword, language: 'en'});
  var timedout = false;

  stream.on('tweet', function (event) {
    var sqsMessage = {};
    var lon1, lon2, lon3, lon4, lat1, lat2, lat3, lat4 = 0;
    sqsMessage['keyword'] = keyword;
    if(timedout === true){
        console.log("Timeout ended: "+ Date.now());
        stream.stop();
        return callTwitterCB(null, "stream end");
      }
      
      if(event.hasOwnProperty("user")){
        if(event.user.hasOwnProperty("screen_name")){
          sqsMessage['author'] = event.user.screen_name;
        }
      }
      //sqsMessage['author'] = event.user.screen_name;
      sqsMessage['date'] = event.created_at;
      sqsMessage['text'] = event.text;
      sqsMessage['coordinates'] = {};
      if((event.geo) || (event.place)){
        if(event.geo != null){
          var geoKey = event.geo;
          if(geoKey.coordinates){
            sqsMessage['coordinates']['latitude'] = event.geo.coordinates[0];
            sqsMessage['coordinates']['longitude'] = event.geo.coordinates[1];
            console.log(sqsMessage);
            sendMessageToSQS(JSON.stringify(sqsMessage), function(sqsErr, sqsData){
              if(sqsErr){
                console.log("An error occurred with sqs sendMessage: "+sqsErr); // an error occurred
                callTwitterCB(sqsErr);
              }
              else{
                console.log("Message successfully sent to SQS!!: "+sqsData); // successful response
                sendSNS(function(snsErr, snsData){
                  if(snsErr){
                    console.log("An error occurred: "+snsErr); // an error occurred
                    callTwitterCB(snsErr);
                  }
                  else{
                    console.log("SNS successfully sent!!: "+snsData); // successful response
                  }
                });
              }
            });
          }
        }
        else if(event.place != null){
          console.log(event);
          sqsMessage['coordinates'] = {}; 
          lon1 = event.place.bounding_box.coordinates[0][0][0];
          lat1 = event.place.bounding_box.coordinates[0][0][1];
          lon2 = event.place.bounding_box.coordinates[0][1][0];
          lat2 = event.place.bounding_box.coordinates[0][1][1];
          lon3 = event.place.bounding_box.coordinates[0][2][0];
          lat3 = event.place.bounding_box.coordinates[0][2][1];
          lon4 = event.place.bounding_box.coordinates[0][3][0];
          lat4 = event.place.bounding_box.coordinates[0][3][1];

          sqsMessage.coordinates['latitude'] = ((lat1+lat2+lat3+lat4)/4);
          sqsMessage.coordinates['longitude'] = ((lon1+lon2+lon3+lon4)/4); 
          //console.log(JSON.stringify(event.place, null, 4));
          console.log(sqsMessage);
          sendMessageToSQS(JSON.stringify(sqsMessage), function(sqsErr, sqsData){
            if(sqsErr){
              console.log("An error occurred with sqs sendMessage: "+sqsErr); // an error occurred
            }
            else{
              console.log("Message successfully sent to SQS!!: "+sqsData); // successful response
              sendSNS(function(snsErr, snsData){
                if(snsErr){
                  console.log("An error occurred: "+snsErr); // an error occurred
                }
                else{
                  console.log("SNS successfully sent!!: "+snsData); // successful response
                }
              });
            }
          });
        }
      }
  });
   
  stream.on('error', function(error) {
    console.log(error);
  });

  console.log("timeout started: "+ Date.now())
  setTimeout(function() {
    timedout = true;
  }, 60000);
}

exports.handler = (event, context, callback) => {
  var userKeyword = event.searchKeyword;
  callTwitterStreamAPI(userKeyword, function(callTwitterErr, callTwitterData){
    if(callTwitterErr){
      callback(callTwitterErr);
    }
    else{
      callback(null, "done streaming!");
    }
  });
}
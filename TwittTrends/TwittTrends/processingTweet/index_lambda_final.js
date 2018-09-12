const AWS = require('aws-sdk');
AWS.config.update({
    "region": "us-east-1"
});
var sns = new AWS.SNS({apiVersion: '2010-03-31'});
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': '<username>',
  'password': '<pwd>',
  'version_date': '2017-02-27'
});
var body, receiptHandle;
var queueUrl = '<sqsLink>';


function sendSNS(message, sendSNSCB){
  var snsParams = {
    Message: message, /* required */
    TopicArn: '<SNSARN>'
  };
  sns.publish(snsParams, function(snsErr, snsData) {
    if(snsErr){
      //console.log("An error occurred: "+snsErr); // an error occurred
      sendSNSCB(snsErr);
    }
    else{
      //console.log("SNS successfully sent!!: "+snsData); // successful response
      sendSNSCB(null, "SNS successfully sent!!");
    }
  });
}

function receiveMessageFromSQS(receiveMessageSQSCB){
  var recParams = {
    QueueUrl: queueUrl, /* required */
  };
  sqs.receiveMessage(recParams, function(sqsRecErr, sqsRecData) {
    if(sqsRecErr){
      receiveMessageSQSCB(sqsRecErr);
    } 
    else{
      if(sqsRecData.hasOwnProperty("Messages")){
        if(sqsRecData.Messages.length > 0){
          receiptHandle = sqsRecData.Messages[0].ReceiptHandle;
          body = sqsRecData.Messages[0].Body;
          var snsMessage ={};
          snsMessage = body;
          receiveMessageSQSCB(null, {'snsMessage': snsMessage, 'receiptHandle': receiptHandle});          // successful response
        }
      }
      else{
        receiveMessageSQSCB(null, "Queue is Empty!");
      }
    }     
  });
}

function deleteMessageFromSQS(delReceiptHandle, deleteMessageSQSCB){
  var delParams = {
    QueueUrl: queueUrl, /* required */
    ReceiptHandle: delReceiptHandle /* required */
  };
  sqs.deleteMessage(delParams, function(sqsDelErr, sqsDelData) {
    if(sqsDelErr){
      deleteMessageSQSCB(sqsDelErr);
    }
    else{
      deleteMessageSQSCB(null, sqsDelData);
    }
  });
}

function getSentiment(sentParams, getSentimentCB){
  natural_language_understanding.analyze(sentParams, function(getSentErr, getSentResponse) {
    if (getSentErr){
      getSentimentCB(getSentErr);
    }
    else{
      //console.log(JSON.stringify(response, null, 2));
      getSentimentCB(null, {'sentiment': getSentResponse.sentiment.document.label});
    }
  });
}

exports.handler = (event, context, callback) => {
  receiveMessageFromSQS(function(err, data){
    if(err){
      console.log(err);
      callback(err);
    }
    else{
      if(data === "Queue is Empty!"){
        console.log(data);
        callback(null, "Queue is Empty!");
      }
      else{
        console.log(data);
        var finalSNSTweetMessage = {};
        finalSNSTweetMessage = JSON.parse(data.snsMessage);
        console.log("Author: "+ finalSNSTweetMessage.author);
        var sentParams = {};
        sentParams = {
          'text': finalSNSTweetMessage.text,
          'features': {
            'sentiment': {
            }
          }
        };
        getSentiment(sentParams, function(sentErr, sentData){
          if(sentErr){
            console.log(sentErr);
          }
          else{
            console.log(sentData);
            console.log("Got the sentiment.");
            finalSNSTweetMessage['sentiment'] = sentData.sentiment;
            deleteMessageFromSQS(data.receiptHandle, function(delErrr, delData){
              if(delErrr){
                console.log(delErrr);
              }
              else{
                console.log(delData);
                console.log("Message deleted");
                sendSNS(JSON.stringify(finalSNSTweetMessage), function(snsErr, snsData){
                  if(snsErr){
                    console.log("An error occurred: "+snsErr); // an error occurred
                  }
                  else{
                    console.log("SNS successfully sent!!: "+snsData); // successful response
                    console.log("finalSNSTweetMessage: "+JSON.stringify(finalSNSTweetMessage));
                    callback(null, "Final SNS trigger sent successfully");
                  }
                });
              }
            });
          }
        });
      }
    }
  });
};
const aws = require('aws-sdk');
const ynabApi = require('ynab');
const config = require('./config');


var  raiseError = (error, stack, callback) => {
    console.log(error);
    console.log(stack);
    callback(error);
};




var processEvent = (bucket_config, event, callback) => {

    

    var ynab = new ynabApi.api(bucket_config['personalAccessToken']);

      var budget_id = bucket_config.budgetId;
      var trn = {
        transactions: [
            {
                account_id: bucket_config.accountId,
                date: event.data.created,
                //date: ynabApi.utils.getCurrentDateInISOFormat(),
                amount: event.data.amount * 10,
                memo: event.data.category + " : " + event.data.description,
                payee_name: event.data.merchant.name,
            }
        ]
      }

      //console.log(trn);
      
      try { 
          ynab.transactions.bulkCreateTransactions(budget_id, trn).catch(e => {
            raiseError("Unable to create transaction", e, callback);
          })
      }
      catch (e) {
          raiseError("Parameters for bulkCreateTransaction invalid", e, callback);
      }

      var response = {
          "statusCode": 200,
          "headers": {},
          "body": null,
          "isBase64Encoded": false
      }

      callback(null, response);
}



exports.handler = (event, context, callback) => {

    //console.log("Starting");

    //console.log(event);

    var s3 = new aws.S3();


    s3.getObject(config['config'], function(err, data){
        if (err) raiseError(err, err.stack, callback); // an error occurred
        else {
            try {
                var bucket_config = JSON.parse(data.Body.toString('utf-8'))
            }
            catch (e) {
                raiseError("Unable to parse bucket config", e, callback);
            }
            processEvent(bucket_config, event, callback);
        }
    })
    

};


var db = require('../server/pghelper');
var auth = require('../server/auth0');

exports.sync = function(req, res, next) {
	var head = req.headers['authorization'];
	var lastsync = req.query.syncdate;
	
	auth.authen(head)
	.then(function(obj) {
		var sales = obj.nickname;
		var query = "SELECT * FROM salesforce.Account WHERE sfid IN ";
		query += "(SELECT account__c FROM salesforce.account_team__c WHERE LOWER(salesman__c) = '" + sales + "')";
		db.select(query) 
		.then(function(results) {
			if(results.length > 0)
			{
				var accountList = "(";
				for(var i = 0 ; i < results.length ; i++)
				{
					accountList += "'" + results[i].sfid + "', ";
				}
				accountList = accountList.substr(0, accountList.length - 2);
				accountList += ")";
								
				var query2 = "SELECT guid as id, name, Bill_To__c as billto, Ship_To__c as shipto, ";
				query2 += "Billing_Type__c as type, Billing_Date__c as date, Customer_PO_No__c as po, ";
				query2 += "Delivery_Order__c as do, Inco_Term__c as incoterm, Payment_Term__c as paymentterm, ";
				query2 += "Sales_Man__c as salesman, Sales_Order__c as so, VAT__c as vat, Order__c as order, ";
				query2 += "Sub_Total__c as total, ";
				//query2 += "success as Success, errorcode as ErrorCode, errormessage as ErrorMessage, ";
				query2 += "to_char( systemmodstamp + interval '7 hour', 'YYYY-MM-DDTHH24:MI:SS') as updatedate , isdeleted "
				query2 += "from salesforce.invoice__c where (Bill_To__c IN " + accountList + " and ";
				query2 += "systemmodstamp + interval '7 hour' > '" + lastsync + "') ";
				db.select(query2)
				.then(function(results2) {
					var output = '{ "success": true, "errorcode" : "", "errormessage" : "", "data":[';
					for(var i = 0 ; i < results.length ; i++)
					{
						output += '{"id":"' + results[i].guid;
						output += '", "name":"' + results[i].name;
						output += '", "billto":"' + results[i].billto;
						output += '", "shipto":"' + results[i].shipto;
						output += '", "date":"' + results[i].date;
						output += '", "total":"' + results[i].total;
						output += '", "isdeleted":' + results[i].isdeleted;
						output += ', "updateddate":"' + results[i].updatedate.replace(" ", "T") + '"},';
					}
					if(results.length)
					{
						output = output.substr(0, output.length - 1);
					}
					output += ']}';
					console.log(output);
					res.json(JSON.parse(output));
				}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"01", "errormessage":"Cannot connect DB." }'); })
			}
		}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"01", "errormessage":"Cannot connect DB." }'); })
	}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"00", "errormessage":"Authen Fail." }'); })
};

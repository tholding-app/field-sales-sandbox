var db = require('../server/pghelper');
var auth = require('../server/auth0');

exports.sync = function(req, res, next) {
	var head = req.headers['authorization'];
	var lastsync = req.query.syncdate;
	console.log('------------------Start Pricebook Entry----------------');
  
	db.init()
	.then(function(conn) {
		auth.authen(head, conn)
		.then(function(obj) {
			var sales = obj.nickname;		
			var query = "SELECT *, to_char( systemmodstamp + interval '7 hour' , 'YYYY-MM-DD HH24:MI:SS') as updatedate ";
			query += "FROM salesforce.pricebook_entry__c WHERE systemmodstamp + interval '7 hour' > '" + lastsync + "' ";
			db.query(query, conn) 
			.then(function(results) {
				/*
				var output = '{ "success": true, "errorcode" : "", "errormessage" : "", "data":[';
				for(var i = 0 ; i < results.length ; i++)
				{
					output += '{"id":"' + results[i].guid;
					output += '", "product":"' + results[i].product__c;
					output += '", "pricebook":"' + results[i].price_book__c;
					output += '", "group":"' + results[i].group__c;
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
				*/
				var output = { "success": true, "errorcode" : "", "errormessage" : "", "data":[]};
				for(var i = 0 ; i < results.length ; i++)
				{
					output.data.push({"id": results[i].guid, "product": results[i].product__c, 
							  "pricebook": results[i].price_book__c, "group": results[i].group__c,
							  "isdeleted": results[i].isdeleted, 
							  "updateddate": results[i].updatedate.replace(" ", "T") + "+07:00"});
				}
				console.log('------------------End Pricebook Entry----------------');
				res.json(output);
			}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"01", "errormessage":"Cannot connect DB." }'); })
		}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"00", "errormessage":"Authen Fail." }'); })	
	}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"02", "errormessage":"initial Database fail." }'); })
};

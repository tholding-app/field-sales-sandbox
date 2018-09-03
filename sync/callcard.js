var db = require('../server/pghelper');
var auth = require('../server/auth0');

exports.sync = function(req, res, next) {
	var head = req.headers['authorization'];
	var lastsync = req.body.syncdate;
	var lastsync2 = req.body.syncdate;
	console.log('------------------Start Call Card----------------');
	
	auth.authen(head)
	.then(function(obj) {
		var sales = obj.nickname;
		db.init()
  		.then(function(conn) {
			var query = "SELECT guid from salesforce.call_visit__c where LOWER(salesman__c) = '" + sales + "'";
			db.query(query, conn)
			.then(function(results) {
				var visitList = "(";
				for(var i = 0 ; i < results.length ; i++)
				{
					visitList += "'" + results[i].guid + "', ";
				}
				visitList = visitList.substr(0, visitList.length - 2);
				visitList += ")";

				var validData = true;
				var callcardList = "(";
				for(var i = 0 ; i < req.body.data.length ; i++)
				{
					if(req.body.data[i].id != null)
						callcardList += "'" + req.body.data[i].id + "', ";
					if(req.body.data[i].product == null) validData = false;
					if(req.body.data[i].visit == null) validData = false;
				}
				callcardList = callcardList.substr(0, callcardList.length - 2);
				callcardList += ")";

				if(validData)
				{
					var query2 = "SELECT guid as id, call_visit_guid as visit, product__c as product, quantity_piece__c as quantity, ";
					//query2 += "success as Success, errorcode as ErrorCode, errormessage as ErrorMessage, ";
					query2 += "to_char( systemmodstamp + interval '7 hour', 'YYYY-MM-DD HH24:MI:SS') as updatedate, isdeleted ";
					query2 += "FROM salesforce.call_card__c WHERE (call_visit_guid IN " + visitList + " and ";
					query2 += "systemmodstamp + interval '7 hour' > '" + lastsync2 + "') ";
					if(req.body.data.length > 0) query2 += "or guid IN " + callcardList;
					db.query(query2, conn)
					.then(function(results2) {
						for(var i = 0 ; i < results2.length ; i++)
						{
							results2[i].updatedate = results2[i].updatedate.replace(" ", "T") + "+07:00";
						}
						var output = buildResponse(req.body.data, results2, lastsync, next, conn);
						output = { "success": true, "errorcode" : "", "errormessage" : "", "data": output };
						//res.send("Finish!!");
						console.log(output);
						res.json(output);
					}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"01", "errormessage":"Cannot connect DB." }'); })
				} else { res.json({ "success": false, "errorcode" :"10", "errormessage":"Invalid Data" }); }
			}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"01", "errormessage":"Cannot connect DB." }'); })
		}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"02", "errormessage":"initial Database fail." }'); })
	}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"00", "errormessage":"Authen Fail." }'); })
};

function buildResponse(update, response, syncdate, next, conn)
{
	var action = [];
	for(var j = 0 ; j < update.length ; j++)
	{
		var found = false;
		var isInsert = true;
		for(var i = 0 ; i < response.length && isInsert; i++)
		{
			if(update[j].id == response[i].id)
			{
				found = true;
				var updateddate = new Date(update[j].updateddate);
				var serverupdatedate = new Date(response[i].updateddate);
				if(updateddate > serverupdatedate)
				{
					isInsert = false;
					response.splice(i, 1);
				}
			}
		}
		if(!found) { action.push("insert"); }
		else if(!isInsert) { action.push("update"); }
		else { action.push("none"); }
	}
	syncDB(update, action, next, conn);
	return response;
};

function syncDB(update, action, next, conn)
{
	if(update.length > 0)
	{
		if(action[0] == "insert")
		{
			var query = "INSERT INTO salesforce.call_card__c ( guid, ";
			if(update[0].visit != null) query += "call_visit_guid, ";
			if(update[0].product != null) query += "product__c, ";
			if(update[0].quantity != null) query += "quantity_piece__c, ";
			query += "createddate, systemmodstamp, IsDeleted, sync_status ) VALUES ('";
			query += update[0].id + "',";
			if(update[0].visit != null) query += " '" + update[0].visit + "',";
			if(update[0].product != null) query += " '" + update[0].product + "',";
			if(update[0].quantity != null) query += " " + update[0].quantity + ",";
			query += "CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 'Mobile')";

			db.query(query, conn)
			.then(function(results) {
				update.shift();
				action.shift();
				syncDB(update, action, next, conn);
			})
			.catch(next);
		}
		else if (action[0] == "update")
		{
			var query = "UPDATE salesforce.order_product__c SET ";
			if(update[0].visit != null) query += "call_visit_guid = '" + update[0].visit + "', ";
			if(update[0].product != null) query += "product__c = '" + update[0].product + "', ";
			if(update[0].quantity != null) query += "quantity_piece__c = " + update[0].quantity + ", ";
			if(update[0].isdeleted != null) query += "Isdeleted = '" + update[0].isdeleted +"', ";
			query += "systemmodstamp = CURRENT_TIMESTAMP, ";
			query += "sync_status = 'Mobile' ";
			query += "WHERE guid = '" + update[0].id + "'";

			db.query(query, conn)
			.then(function(results) {
				update.shift();
				action.shift();
				syncDB(update, action, next, conn);
			})
			.catch(next);
		}	
		else
		{
			update.shift();
			action.shift();
			syncDB(update, action, next, conn);
		}
	}
};

var db = require('../server/pghelper');
var auth = require('../server/auth0');

exports.sync = function(req, res, next) {
	var head = req.headers['authorization'];
	var lastsync = req.body.syncdate;
	var lastsync2 = req.body.syncdate;
	lastsync = new Date(lastsync)
	
	auth.authen(head)
	.then(function(obj) {
		var sales = obj.nickname;
		var query = "SELECT sfid from salesforce.salesman__c where LOWER(sfid) = '" + sales + "'";
		db.select(query)
		.then(function(results) {
			var visitlist = "(";
			for(var i = 0 ; i < req.body.data.length ; i++)
			{
				if(req.body.data[i].Id != null)
					visitlist += "'" + req.body.data[i].Id + "', ";
			}
			visitlist = visitlist.substr(0, visitlist.length - 2);
			visitlist += ")";
			
			var query2 = "SELECT guid as id, account__c as account, Plan_Start__c as Start, Plan_End__c as End, Call_Type__c as Type, ";
			query2 += "status__c as status, comment__c as comment, success as Success, ";
			query2 += "errorcode as ErrorCode, errormessage as ErrorMessage, ";
			query2 += "to_char( systemmodstamp + interval '7 hour', 'YYYY-MM-DD HH24:MI:SS') as updatedate , isdeleted ";
			query2 += "FROM salesforce.call_visit__c WHERE (LOWER(salesman__c) = '" + sales + "' and ";
			query2 += "systemmodstamp > '" + lastsync2 + "') or guid IN " + visitlist;
			db.select(query2)
			.then(function(results2) {
				var output = buildResponse(req.body.data, results2, lastsync, results[0].sfid, next);
				output = { "success": true, "errorcode" : "", "errormessage" : "", "data": output };
				//res.send("Finish!!");
				console.log(output);
				res.json(output);
			}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"01", "errormessage":"Cannot connect DB." }'); })
		}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"01", "errormessage":"Cannot connect DB." }'); })
	}, function(err) { res.status(887).send('{ "success": false, "errorcode" :"00", "errormessage":"Authen Fail." }'); })
};

function buildResponse(update, response, syncdate, sales, next)
{
	var action = [];
	for(var j = 0 ; j < update.length ; j++)
	{
		var found = false;
		var isInsert = true;
		for(var i = 0 ; i < response.length && isInsert; i++)
		{
			if(update[j].Id == response[i].id)
			{
				found = true;
				var updateddate = new Date(update[j].UpdatedDate);
				if(updateddate > response[i].systemmodstamp)
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
	syncDB(update, action, sales, next);
	return response;
};

function syncDB(update, action, sales, next)
{
	if(update.length > 0)
	{
		var start = new Date(update[0].start);
		start.setHours(start.getHours() - 7);
		start = start.toISOString().replace(/T/, ' ').substring(0, 19);
		var end = new Date(update[0].end);
		end.setHours(start.getHours() - 7);
		end = end.toISOString().replace(/T/, ' ').substring(0, 19);
		if(action[0] == "insert")
		{
			var query = "INSERT INTO salesforce.call_visit__c ( guid, ";
			query += "name, ";
			if(update[0].account != null) query += "account__c, ";
			query += "plan_start__c, plan_end__c, ";
			if(update[0].comment != null) query += "comment__c, ";
			query += "salesman__c, status__c, call_type__c, createddate, systemmodstamp, IsDeleted, sync_status ) VALUES ('";
			query += update[0].Id + "',";
			query += " '" + update[0].start + " - " + update[0].end + "',";
			if(update[0].account != null) query += " '" + update[0].account + "',";
			query += " '" + start + "', '" + end + "',";
			if(update[0].comment != null) query += " '" + update[0].comment + "',";
			query += "'" + sales + "', 'On Plan', 'Unplanned', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 'Mobile')";

			db.select(query)
			.then(function(results) {
				update.shift();
				action.shift();
				syncDB(update, action, sales, next);
			})
			.catch(next);
		}
		else if (action[0] == "update")
		{
			var checkin = null;
			if(update[0].check_in_time  != null)
			{
				checkin = new Date(update[0].check_in_time);
				checkin.setHours(start.getHours() - 7);
				checkin = checkin.toISOString().replace(/T/, ' ').substring(0, 19);
			}
			var checkout = null;
			if(update[0].check_out_time != null) 
			{
				checkout = new Date(update[0].check_out_time);
				checkout.setHours(start.getHours() - 7);
				checkout = checkout.toISOString().replace(/T/, ' ').substring(0, 19);
			}
			var query = "UPDATE salesforce.call_visit__c SET ";
			query += "name = '" + update[0].start + " - " + update[0].end + "', ";
			if(update[0].account != null) query += "account__c = '" + update[0].account + "', ";
			query += "plan_start__c = '" + start + "', plan_end__c = '" + end + "', ";
			if(update[0].comment != null) query += "comment__c = '" + update[0].comment + "', ";
			if(update[0].status != null) query += "status__c = '" + update[0].status +"', ";
			if(checkin != null) query += "check_in_time__c  = '" + checkin +"', ";
			if(update[0].check_in_lat != null) query += "check_In_location__latitude__s = '" + update[0].check_in_lat +"', ";
			if(update[0].check_in_long != null) query += "check_in_location__longitude__s = '" + update[0].check_in_long +"', ";
			if(checkout != null) query += "check_out_time__c  = '" + checkout +"', ";
			if(update[0].check_out_lat != null) query += "check_out_location__latitude__s = '" + update[0].check_out_lat +"', ";
			if(update[0].check_out_long != null) query += "check_out_location__longitude__s = '" + update[0].check_out_long +"', ";
			if(update[0].isdeleted != null) query += "isdeleted = '" + update[0].isdeleted +"', ";
			query += "systemmodstamp = CURRENT_TIMESTAMP, ";
			query += "sync_status = 'Mobile' ";
			query += "WHERE guid = '" + update[0].Id + "'";

			db.select(query)
			.then(function(results) {
				update.shift();
				action.shift();
				syncDB(update, action, sales, next);
			})
			.catch(next);
		}	
	}
};

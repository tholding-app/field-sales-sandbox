var db = require('../server/pghelper');

exports.sync = function(req, res, next) {
  var head = req.headers['authorization'];
  var lastsync = req.headers['lastsync'];
  
  auth.authen(head)
	.then(function(obj) {
		var sales = obj.nickname;
		var query = "SELECT * FROM salesforce.Product2 WHERE systemmodstamp > '" + lastsync + "' by ProductCode asc";
		db.select(query) 
		.then(function(results) {
			var output = '[';
			for(var i = 0 ; i < results.length ; i++)
			{
				output += '{"InternalId":"' + results[i].guid;
				output += '", "ProductCode":"' + results[i].productcode;
				output += '", "ProductName":"' + results[i].name;
				output += '", "ProductNameTH":"' + results[i].Product_Name_TH__c;
				output += '", "Description":"' + results[i].description;
				output += '", "Brand":"' + results[i].product_group__c;
				output += '", "Family":"' + results[i].family;
				output += '", "Type":"' + results[i].product_type__c;
				output += '", "Net_Weight":"' + results[i].net_weight_g__c;
				output += '", "Pack_Size":"' + results[i].pack_size__c;
				output += '", "IsActive":' + results[i].isactive;
				output += ', "IsDeleted":' + results[i].isdeleted;
				output += ', "systemmodstamp":"' + results[i].systemmodstamp + '"},';
			}
			if(results.length)
			{
				output = output.substr(0, output.length - 1);
			}
			output += ']';
			console.log(output);
			res.json(JSON.parse(output));
		}) 
		.catch(next);
	}, function(err) { res.status(887).send("{ \"status\": \"fail\" }"); })
};

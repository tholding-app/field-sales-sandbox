var db = require('./pghelper');

exports.getList = function(req, res, next) {
	var sales = req.headers['sales'];
	var limit = req.headers['limit'];
	var start = req.headers['start'];
	var query = "SELECT * FROM salesforce.Account WHERE Salesman__c = '" + sales + "' Order by Name asc";
	if(!isNaN(limit))
	{
		query += " limit " + limit;
	}
	if(!isNaN(start) && start != 0)
	{
		query += " OFFSET  " + start;
	}
	console.log(query);
	db.select(query)
	.then(function(results) {
		var output = '[';
		for(var i = 0 ; i <results.length ; i++)
		{
			output += '{"sfid":"' + results[i].sfid;
			output += '", "Name":"' + results[i].Name;
			output += '", "Tax_Number__c":"' + results[i].Tax_Number__c + '"},';
		}
		output+= ']';
		res.json(JSON.parse(output));
	})
	.catch(next);      
};

exports.getInfo = function(req, res, next) {
	var id = req.params.id;
	var output = '';
	db.select("SELECT * FROM salesforce.Account WHERE sfid='" + id + "'")
	.then(function(results) {
		console.log(results);
		output = '[{"sfid":"' + results[0].sfid;
		output += '", "Name":"' + results[0].Name + results[0].Account_Name_2__c + results[0].Account_Name_3__c + results[0].Account_Name_4__c;
		output += '", "Salesman__c":"' + results[0].Salesman__c;
		output += '", "AccountNumber":"' + results[0].AccountNumber;
		output += '", "Address_No__c":"' + results[0].Address_No__c;
		output += '", "BillingCity":"' + results[0].BillingCity;
		output += '", "BillingCountry":"' + results[0].BillingCountry;
		output += '", "BillingLatitude":"' + results[0].BillingLatitude;
		output += '", "BillingLongitude":"' + results[0].BillingLongitude;
		output += '", "BillingPostalCode":"' + results[0].BillingPostalCode;
		output += '", "BillingState":"' + results[0].BillingState;
		output += '", "BillingStreet":"' + results[0].BillingStreet;
		output += '", "Billing_Information__c":"' + results[0].Billing_Information__c;
		output += '", "Credit_Limit__c":"' + results[0].Credit_Limit__c;
		output += '", "Fax":"' + results[0].Fax;
		output += '", "Fax_Ext__c":"' + results[0].Fax_Ext__c;
		output += '", "Phone":"' + results[0].Phone;
		output += '", "Price_Book__c":"' + results[0].Price_Book__c;
		output += '", "Sales_District__c":"' + results[0].Sales_District__c;
		output += '", "Tax_Number__c":"' + results[0].Tax_Number__c;
		output += '", "IsDeleted":"' + results[0].IsDeleted + '"}]';
		console.log(output);
		res.json(JSON.parse(output));
	})
	.catch(next);
};

exports.createAccount = function(req, res, next) {
	if (!req.body) return res.sendStatus(400);
	
	var query = "INSERT INTO salesforce.Account ( sfid, Name, Account_Name_2__c, Account_Name_3__c, Account_Name_4__c, Salesman__c, AccountNumber, ";
	query += "Address_No__c, BillingCity, BillingCountry, BillingLatitude, BillingLongitude, BillingPostalCode, BillingState, BillingStreet, ";
	query += "Billing_Information__c, Credit_Limit__c, Fax, Fax_Ext__c, Phone, Price_Book__c, Sales_District__c, Tax_Number__c, ";
	query += "IsDeleted ) VALUES ('";
	query += req.body.sfid + "', '" + req.body.name + "', '" + req.body.name2 + "', '" + req.body.name3 + "', '" + req.body.name4 + "', '";
	query += req.body.salesman + "', '" + req.body.accountnumber + "', '" + req.body.addressno + "', '" + req.body.city + "', '";
	query += req.body.country + "', '" + req.body.latitude + "', '" + req.body.longitude + "', '" + req.body.postalcode + "', '";
	query += req.body.stage + "', '" + req.body.street + "', '" + req.body.billinfo + "', '" + req.body.creditlimit + "', '";
	query += req.body.fax + "', '" + req.body.faxext + "', '" + req.body.phone + "', '" + req.body.pricebook + "', '";
	query += req.body.salesdistrict + "', '" + req.body.taxnumber + "', '" + req.body.isdeleted +"')";
	console.log(query);
	
	db.select(query)
	.then(function(results) {
		res.send('{ \"status\": "create success" }');
	})
	.catch(next);
};

exports.updateAccount = function(req, res, next) {
	var id = req.params.id;
	//console.log(id);
	if (!req.body) return res.sendStatus(400);
		
	var query = "UPDATE salesforce.Account SET ";
	query += "Name = '" + req.body.name + "', ";
	query += "Account_Name_2__c = '" + req.body.name2 + "', ";
	query += "Account_Name_3__c = '" + req.body.name3 + "', ";
	query += "Account_Name_4__c = '" + req.body.name4 + "', ";
	query += "Salesman__c ='" + req.body.salesman + "', ";
	query += "AccountNumber = '" + req.body.accountnumber + "', ";
	query += "Address_No__c = '" + req.body.addressno + "', ";
	query += "BillingCity = '" + req.body.city + "', ";
	query += "BillingCountry = '" + req.body.country + "', ";
	query += "BillingLatitude = '" + req.body.latitude + "', ";
	query += "BillingLongitude = '" + req.body.longitude + "', ";
	query += "BillingPostalCode = '" + req.body.postalcode + "', ";
	query += "BillingState = '" + req.body.stage + "', ";
	query += "BillingStreet = '" + req.body.street + "', ";
	query += "Billing_Information__c = '" + req.body.billinfo + "', ";
	query += "Credit_Limit__c = '" + req.body.creditlimit + "', ";
	query += "Fax = '" + req.body.fax + "', ";
	query += "Fax_Ext__c = '" + req.body.faxext + "', ";
	query += "Phone = '" + req.body.phone + "', ";
	query += "Price_Book__c = '" + req.body.pricebook + "', ";
	query += "Sales_District__c = '" + req.body.salesdistrict + "', ";
	query += "Tax_Number__c = '" +  req.body.taxnumber + "', ";
	query += "Isdeleted = '" + req.body.isdeleted +"' ";
	query += "WHERE sfid = '" + id + "'";
	console.log(query);
	
	db.select(query)
	.then(function(results) {
		res.send('{ \"status\": "update success" }');
	})
	.catch(next);
};

exports.deleteAccount = function(req, res, next) {
	var id = req.params.id;
	if (!req.body) return res.sendStatus(400);
	var query = "DELETE FROM salesforce.Account WHERE sfid = '" + id + "'";	
	console.log(query);
	
	db.select(query)
	.then(function(results) {
		res.send('{ \"status\": "delete success" }');
	})
	.catch(next);
};

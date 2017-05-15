var cool = require('cool-ascii-faces');
var express = require('express');
var jsforce = require('jsforce');
var pg = require('pg');
var app = express();
var conn = new jsforce.Connection();
var bodyParser = require('body-parser');
var responseaccesstoken;
var responseinstanceUrl;
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  //response.render('pages/index');
  response.sendFile( __dirname + "/views/pages/" + "index.htm" );
});

app.get('/login', function(request, response) {
  //response.render('pages/index');
  response.sendFile( __dirname + "/views/pages/" + "login.htm" );
});

app.get('/cool', function(request, response) {
  response.send(cool());
});


app.post('/process_get',urlencodedParser, function(req, res) {
	//Login to Salesforce using the credentials
	conn.login(req.body.user_name, req.body.pwd, function(err, userInfo) {
  if (err) { return console.error(err); }
  // Now you can get the access token and instance URL information. 
  // Save them to establish connection next time. 
  //console.log(conn.accessToken);
  //console.log(conn.instanceUrl);
  // logged in user property 
  // console.log("User ID: " + userInfo.id);
  // console.log("Org ID: " + userInfo.organizationId);
	responseaccesstoken=conn.accessToken;
	responseinstanceUrl=conn.instanceUrl;
  // ... 
   res.redirect('/accounts');
	});
    // Prepare output in JSON format
   //response = {
   //   user_name:req.body.user_name,
  //    pwd:req.body.pwd
   //};
   //console.log(res);
   //res.end(JSON.stringify(response));

});

app.get('/accounts', function(req, res) {
    // if auth has not been set, redirect to index
	//console.log(responseaccesstoken);
    if (responseaccesstoken=='' && responseinstanceUrl=='') { res.redirect('/'); }

    var query = 'SELECT id, name,Phone FROM account LIMIT 10';
    // open connection with client's stored OAuth details
    var conn = new jsforce.Connection({
        accessToken: responseaccesstoken,
		instanceUrl: responseinstanceUrl
    });

    conn.query(query, function(err, result) {
        if (err) {
            console.error(err);
            res.redirect('/');
        }
		//console.log(result);
		//res.end(JSON.stringify(result.records));
        res.render('pages/accounts',{results: result.records});
    }); 
});

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

app.get('/sforce', function (request, response) {
conn.login(username, password, function(err, userInfo) {
  if (err) { return console.error(err); }else{
	  // Now you can get the access token and instance URL information.
  // Save them to establish connection next time.
  console.log(conn.accessToken);
  console.log(conn.instanceUrl);
  // logged in user property
  //console.log("User ID: " + userInfo.id);
  //console.log("Org ID: " + userInfo.organizationId);
  response.render('pages/home', {results: userInfo} );
  }
  
});
});
app.get('/createaccountpage', function(request, response) {
  //response.render('pages/index');
  response.render('pages/createaccountpage');
});

app.post('/createaccount',urlencodedParser, function (request, response) {
	console.log("createaccount called");
// Single record creation
  conn.sobject("Account").create({ Name : request.body.accountname , Phone : request.body.accountphone }, function(err, ret) {
  if (err || !ret.success) { 
  return console.error(err, ret); 
  
  }
  console.log("Created record id : " + ret.id);
  response.redirect('/accounts');
});
});

app.get('/logout', function (request, response) {
  console.log("logout called");
  conn.logout();
  response.redirect('/');
  
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



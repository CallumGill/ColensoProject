var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function parseTextSearch(input) {
    input = "contains(.,'"+input;
    input = input.replace(" AND ", ") and contains(., '");
    input = input.replace(" OR ", ") or contains(., '");
    input += "')";
    return input;
}


client.execute("OPEN Colenso");
/* GET home page. */
//client.execute("xquery //movie[position() lt 10]",console.log);
router.get("/",function(req,res,next){
client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';" +
" (//name[@type='place']/text())[1] ",
function(error, result) {
	if(error){console.error(error);}
	else{
	res.render('index', {title: 'The Colenso Project', place: result.result});
	
	}
		}
		);
});

router.get('/list', function(req, res, next) {
  client.execute("XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';" +
"distinct-values (//author/name[@type='person']/text()) " ,
function(error, result) {
	console.log("AUTHOR");
	if(error){console.error(error);}
	else{
	  console.log(result);
	  var resultArray = result.result.toString().split("\n");

	  console.log(resultArray);
	  res.render('list', { title: 'The Colenso Project', result: resultArray });
	}
    });
});

router.get('/search', function(req, res, next) {
    var type = req.query.type;
    var search = req.query.srch;
    if(!search){
      res.render('search', { title: 'The Colenso Project'});
    }else if(type=='markup'){
      
    }else{
      var parsedSearch=parseTextSearch(search);
      console.log("SEACHING FOR '"+parsedSearch+"'");
      var input = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
      "for $n in (/*["+parsedSearch+"]/text())"+
      "return db:path($n)";
      console.log("SEARCH PARSED");
      client.execute(input,function(error, result) {
	console.log("SEARCH EXECUTED");
        console.log(result.result);
	console.log("SEARCH RESULTS SHOWN");
        //res.render('search', { title: 'The Colenso Project', results: });
      });
    }
      
});

router.get('/author', function(req, res, next) {
  var author = req.query.author;
  var input = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
      "(//title[../author/name[@type='person' and .='"+author+"']]/text())";
  console.log("IN AUTHORS");
  client.execute(input, function(error, result) {
	console.log("AUTHOR");
	console.log(author);
	console.log(result);
	if(error){console.error(error);}
	else{
	  var resultArray = result.result.toString().split("\n");

	  console.log(resultArray);
	  res.render('list', { title: 'The Colenso Project', result: resultArray });
	}
    });
});

router.get('/db', function(req, res, next) {
  var path = req.query.path;
  var depth = 0;
  console.log(path);
  if(!path){
    path ='';
  }else{
    depth = path.split("/").length;
  }
  var input = "XQUERY db:is-xml('Colenso', '"+path+"')";
  client.execute(input, function(error, result) {
    console.log(result);
    if(result.result=='true'){
      input = "XQUERY doc('Colenso/" + path + "')";
      client.execute(input, function(error, result) {
	console.log('render file');
        res.render('file', { title: 'The Colenso Project', path: path, file: result.result });
      });
    }else{
      input = "XQUERY db:list('Colenso', '"+path+"')";
      client.execute(input, function(error, result) {
	//console.log(result);
	if(error){
	  console.error(error);
	}else{
	  var resultArray = result.result.toString().split("\n");
	  var heading = 'Database';
	  if (depth>0){
	    heading = path;
	  }
	  for(var i =0; i<resultArray.length; i++){
	    resultArray[i] = resultArray[i].split("/")[depth];
	  }
	  resultArray = resultArray.filter( onlyUnique );
	  //console.log(resultArray);
	  if(path!=''){
	    path += '/'
	  }
	  res.render('database', { title: 'The Colenso Project', result: resultArray, heading: heading, path: path });
	}
      });
    }
  });
});

//router.get('/search', function(req, res, next) {
	  //res.render('search', { title: 'The Colenso Project'});
//});

module.exports = router;
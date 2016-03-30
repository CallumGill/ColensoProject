var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});
router.use(upload.single('uploadedFile'));

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function replaceAll(input, search, replacement) {
    return input.split(search).join(replacement);
};

String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

function parseTextSearch(input) {

    input = "'"+input;
    input = replaceAll(input, " && ", "'ftand'");
    input = replaceAll(input," || ", "'ftor'");
    input = replaceAll(input,"&&", "'ftand'");
    input = replaceAll(input,"||", "'ftor'");
    input = replaceAll(input," -", "'ftnot'");
    input = replaceAll(input,"-", "'ftnot'");
    input += "'";
    return input;
    
    
}

function getLast(input){
 return input[input.length-1]; 
}

function getFileNames(input) {
  var inputArray = input.result.toString().split("\n");
  for(var i =0; i<inputArray.length; i++){
    inputArray[i] = getLast(inputArray[i].split("/"));
  }
  inputArray = inputArray.filter( onlyUnique );
}


client.execute("OPEN Colenso");
/* GET home page. */
router.get("/",function(req,res,next){
  res.render('index', { title: 'The Colenso Project'});
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

router.post('/upload', function(req, res, next) {
  var file = req.file;
  var targetLoc = req.query.path;
  console.log("FILE PATH: " + targetLoc);
  if(file){
    var input = 'REPLACE '+targetLoc+file.originalname + ' "'+file.buffer.toString()+'"';
    client.execute(input, function(error, result) {
      if(error){console.log(error);}
      else{
	console.log(result);
	res.redirect('/db?path='+targetLoc.substring(0, targetLoc.length -1));
      }
    });
  }
});

router.post('/edit/*', function(req, res, next) {
  var editedText = req.body.editField
  var path = req.params[0];
  console.log(editedText);
  if(editedText){
    var input = 'REPLACE '+path+' "'+editedText+'"';
    client.execute(input, function(error, result) {
      if(error){console.log(error);}
      else{
	console.log(result);
	res.redirect('/db?path='+path);
      }
    });
  }
});

router.get('/download/:name', function(req, res, next) {
  var filepath = req.query.path;
  console.log("PATH: " + filepath);
  var input = "XQUERY doc('Colenso/" + filepath + "')";
  client.execute(input,function(error, result) {
    console.log("RESULT: " + result.result);
    res.send(result.result);
  });
});

router.get('/search/:type', function(req, res, next) {
    var search = req.query.srch;
    var searchType = req.params.type;
    if(search){
      if(searchType=='xquery'){
	var input = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
	"for $file in " + search +
	"return db:path($file)";
	client.execute(input,function(error, result) {
	  console.log("SEARCH EXECUTED");
	  console.log(result.result);
	  console.log("SEARCH RESULTS SHOWN");
	  var resultArray = result.result.toString().split("\n")
	  console.log(resultArray);
	  searchType = "XQuery";
	  res.render('search', { title: 'The Colenso Project', results: resultArray, srchType: searchType});
	});
      }else if(searchType=='text'){
	var parsedSearch=parseTextSearch(search);
	console.log("SEACHING FOR "+parsedSearch);
	var input = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0'; " +
	"for $file in //*[. contains text "+parsedSearch+" using wildcards]"+
	"return db:path($file)";
	console.log("SEARCH PARSED");
	client.execute(input,function(error, result) {
	  console.log("SEARCH EXECUTED");
	  console.log(result.result);
	  console.log("SEARCH RESULTS SHOWN");
	  var resultArray = result.result.toString().split("\n");
	  resultArray = resultArray.filter( onlyUnique );
	  console.log(resultArray);
	  searchType = "Text";
	  res.render('search', { title: 'The Colenso Project', results: resultArray, srchType: searchType});
	});
      }
    }else{
      if(searchType=='text'){
	searchType="Text";
      }else if(searchType=='xquery'){searchType="XQuery";}
      res.render('search', { title: 'The Colenso Project', srchType: searchType});
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
	var filename = path.split("/")[depth-1];
        res.render('file', { title: 'The Colenso Project', path: path, file: result.result, name: filename });
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
	   path+='/';
	  }
	  res.render('database', { title: 'The Colenso Project', result: resultArray, heading: heading, path: path });
	}
      });
    }
  });
});



module.exports = router;
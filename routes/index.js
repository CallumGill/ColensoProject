var express = require('express');
var router = express.Router();
var cheerio = require('cheerio');
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");


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
  client.execute("LIST Colenso" ,
function(error, result) {
	if(error){console.error(error);}
	else{
	  res.render('list', { title: 'The Colenso Project', list: result.result });
	}
		}
		);
});

router.get('/search', function(req, res, next) {
	  res.render('search', { title: 'The Colenso Project'});
});

module.exports = router;
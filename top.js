"use strict";

var http                    = require('http'),
    cheerio                 = require('cheerio'),
    URL                     = require('url'),
    Topology                = { Collections : {}, Rules : {} };



Topology.Rules.check_for_title = function($, page){
    if($("title").length === 0) {
        page.errors.push("No title tag set");
        return;
    }
    
    if($("title").text() === "") {
        page.errors.push("No title tag set");
    }
}



Topology.Rules.check_for_canonical_link = function($, page){
    if($('link[rel=canonical]').length === 0) {
        page.warnings.push("No canonical link set");
    }
}




Topology.Rules.check_for_alternate_link = function($, page){
    if($('link[rel=alternate]').length === 0) {
        page.warnings.push("No alternate link set");
    }
}




/*
Topology.Rules.check_for_scripts = function($, page){
    $("link[type=text/javascript]").each(function(){
        page.messages.push("script loaded " + $(this).attr('src'));
    });
}
*/



Topology.Collections.Page = function() {
    if(this.pages === undefined){
        this.pages = [];
    }

    this.exists = function(page) {
        for (var i = 0; i < this.pages.length; i++) {
            if(page.equals(this.pages[i])){
                return true;
            }
        };
        return false;
    };

    this.push   = function(page){ this.pages.push(page); };
    this.length = function(){ return this.pages.length; };

    this.each = function(callback){
       for (var i = 0; i < this.pages.length; i++) {
           callback(this.pages[i]);
       };
    };

    this.as_json = function(){
        var a = [];
        this.each(function(page){
            a.push(page.as_json()); 
        });
        return a;
    }
}



Topology.Site = function(url) {
    this.host = url.host
    this.port = url.port
    //create the collection of pages for this site
    this.page_collection = new Topology.Collections.Page();

    //start off with the index page
    var first_page = new Topology.Page(this, "/");
    this.page_collection.push(first_page);
    first_page.parse();

    this.to_json = function(){
        return JSON.stringify({
            site    : this.host,
            pages   : this.page_collection.as_json()
        });
    };
}




Topology.Page = function(site, path) {
    this.site = site;
    this.path = path;
    this.errors = [];
    this.warnings = [];
    this.messages = []; 

    var $               = {},
        current_page    = this; 

    
    this.printReport = function(){
        console.log("Details for : " + this.path);

        for (var i = 0; i < this.errors.length; i++) {
            console.log(" * [ERROR] " + this.errors[i]);
        }
        
        for (var i = 0; i < this.warnings.length; i++) {
            console.log(" * [WARNING] " + this.warnings[i]);
        }
        
        for (var i = 0; i < this.messages.length; i++) {
            console.log(" * [INFO] " + this.messages[i]);
        }
        
        console.log(" ");
    };

    this.parse = function(){
        var request = http.get({ 
            host : current_page.site.host, 
            port : current_page.site.port, 
            path : current_page.path },
        function(response) {
            if(response.statusCode >= 500 && response.statusCode < 600 ){
                current_page.errors.push("Page returned HTTP status code " + response.statusCode)
            } else {
                current_page.messages.push("Page returned HTTP status code " + response.statusCode)
            }

            response.on('data', function(data){
                console.log("[INFO] Fetching Page: " + current_page.path);
                var $ = cheerio.load(data.toString());
                $('a').each(function(){
                    var p = new Topology.Page(current_page.site, $(this).attr('href'));
                    if(p.valid()) {
                        current_page.site.page_collection.push(p);
                        p.parse();
                    }
                });

                for (var rule in Topology.Rules) {
                    Topology.Rules[rule]($, current_page);
                }
            });
        });

        request.on('error', function(error){
            current_page.errors.push(error);
            console.log("[ERROR] " + error);
        });
    
        request.end();
    };

    this.valid = function(){
        if(current_page.site.page_collection.exists(this)){
            return false;
        }

        if(this.path === undefined) {
            return false;
        }

        //make sure we only scrape urls that are part of the site
        if(URL.parse(this.path).host !== undefined) {
            return false;
        }

        return true;
    };

    this.equals = function(page) {
        return (page.path === this.path);
    };

    this.as_json = function(){
        return {
            path        : this.path,
            errors      : this.errors,
            warnings    : this.warnings,
            messgaes    : this.messgaes
        };
    };
}



var s = new Topology.Site({
    host : "localhost",
    port : "3000"
});



process.on('exit', function(){
    var fs = require('fs');
    fs.writeFileSync("results.json", s.to_json());
});

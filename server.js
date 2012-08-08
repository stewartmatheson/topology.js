var express     = require('express'),
    app         = express.createServer(),
    fs          = require('fs');


var Report = function (){
    var results     = fs.readFileSync('results.json', 'utf-8'),
        all_data    = JSON.parse(results);

    for (var i = 0; i < all_data.pages.length; i++) {
        
        all_data.pages[i].display_result = function(){
            if(this.errors.length < 1) {
                return '<span class="label label-important">Error</span>'
            }
            
            if(this.warnings.length < 1) {
                return '<span class="label label-warning>Warnings</span>'
            }
            
            return " ";
        };

        all_data.pages[i].display_status = function(){
            if(this.status_code === 200) {
                return '200';
            }

            if(this.status_code >= 300 && this.status_code < 400 ) {
                return '<span class="badge badge-info">' + this.status_code + '</span>';
            }

            if(this.status_code >= 400 && this.status_code < 500 ) {
                return '<span class="badge badge-warning">' + this.status_code + '</span>';
            }

            if(this.status_code >= 500 && this.status_code < 600 ) {
                return '<span class="badge badge-important">' + this.status_code + '</span>';
            }
            
            return this.status_code;

        };

        all_data.pages[i].response_time = function(){
            start_time_obj = new Date(this.start_time);
            end_time_obj = new Date(this.end_time);
            return (end_time_obj.getTime() - start_time_obj.getTime()) / 1000;
        };
    };

    return all_data;
}

app.engine('.jade', require('jade').renderFile);
app.set('view engine', 'jade');

app.get('/', function(req, res){ 
    res.header('Content-Type', 'text/html'); 
    res.render('index', Report());
    
});

app.get('/frontend.js', function(req, res){ 
    var content = fs.readFileSync("frontend.js");
    res.header('Content-Type', 'text/javascript'); 
    res.send(content); 
});

app.get('/style.css', function(req, res){ 
    var content = fs.readFileSync("style.css");
    res.header('Content-Type', 'text/css'); 
    res.send(content); 
});

app.listen(3001);

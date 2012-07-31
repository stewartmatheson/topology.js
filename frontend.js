$(document).ready(function(){
    alert("javascript works");

    $.get('results.json', function(data){
        console.log(data);
    });
});

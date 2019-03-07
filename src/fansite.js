// fansite.js
// create your own fansite using your miniWeb framework

const App = require('./miniWeb.js').App;
const app = new App();
//const HOST = '127.0.0.1';
const HOST = '0.0.0.0';
const PORT = 8080;


app.get('/', function(req, res) {
    res.sendFile("/html/home.html");
});

app.get('/about', function(req, res) {
    res.sendFile("/html/about.html");
});

/*app.get('/rando', function(req,res){
    res.sendFile("/html/rando.html");
});*/

app.get('/css/base.css', function(req,res){
    const fileName = "/css/base.css";
    res.sendFile(fileName);
});

app.get('/image1.jpg', function(req,res){
   res.sendFile("/img/image1.jpg"); 
});

app.get('/image2.png', function(req,res){
   res.sendFile("/img/image2.png"); 
});

app.get('/image3.gif', function(req,res){
   res.sendFile("/img/image3.gif"); 
});

app.get("/rando", function(req,res){
    let path = "";

    const rand = Math.floor(Math.random() * 3) + 1;
    if (rand === 1){
        //res.sendFile("/img/image1.jpg");
        path = "/image1.jpg";
    }
    else if (rand === 2){
        //res.sendFile("/img/image2.png");
        path = "/image2.png";
    }
    else{
        //res.sendFile("/img/image3.gif");
        path = "/image3.gif";
    }
    const body = "<!DOCTYPE html>\n<html>\n<head>\n<link rel=\"stylesheet\" type=\"text/css\" href=\"../css/base.css\">"
        + "</head>\n<body>\n<h1>A Random Bender Image</h1>\n<ul>\n<li><a href=\"/\"> Home </a></li>\n" 
        + "<li><a href=\"/about\"> About </a></li>\n<li><a href=\"/rando\"> Rando </a></li>\n</ul>\n<img class=\"center\" src=" + path 
        + ">\n</body>\n</html>\n";
    res.setHeader("Content-Type", "text/html");
    res.send(200,body);
});

app.get('/home', function(req,res){
    res.redirect(301,"/");
});

app.listen(PORT, HOST);
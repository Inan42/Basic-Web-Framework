// create Request and Response constructors...

const fs = require('fs');
const net = require('net');
//const HOST = '127.0.0.1';
const HOST = '0.0.0.0';
const PORT = 8080;

class Request{
    constructor(httpRequest){
        const l = httpRequest.split("\r\n");
        this.path = l[0].split(" ")[1];
        this.method = l[0].split(" ")[0];
        let i = 1;
        const b = {};
        while (l[i] !== ""){
            const indexOfCol = l[i].indexOf(":");
            b[l[i].slice(0,indexOfCol)] = l[i].slice(indexOfCol+1,l[i].length).trim();
            i++;
        }
        this.headers = b;
        i++;
        this.body = l[i];
    }
    
    toString(){
        let s = "";
        s += this.method + " " + this.path + " HTTP/1.1\r\n";
        for (const prop in this.headers){
            s += prop + ": " + this.headers[prop] + "\r\n";
        }
        s += "\r\n";
        s += this.body;
        return s;
    }
}

class Response{
    constructor(sock){
        this.sock = sock;
        this.headers = {};
        this.body = "";
        this.statusCode = -1;
        this.statusMap = {"200": "OK", "404": "Not Found", "500": "Internal Server Error",
            "400": "Bad Request", "301": "Moved Permanently", "302": "Found", "303": "See Other"
        };
        this.contentTypeMap = {"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png",
            "gif": "image/gif", "html": "text/html", "css": "text/css", "txt": "text/plain"
        };
    }
    
    setHeader(name, value){
        this.headers[name] = value;
    }
    
    write(data){
        this.sock.write(data);
    }
    
    end(s){
        this.sock.end(s);
    }
    
    send(statusCode,body){
        this.statusCode = statusCode;
        this.body = body;
        let s = "";
        s += "HTTP/1.1 " + this.statusCode + " " + this.statusMap[this.statusCode] + "\r\n";
        for (const prop in this.headers){
            s += prop + ": " + this.headers[prop] + "\r\n";
        }
        s += "\r\n";
        s += this.body;
        this.end(s);
    }
    
    writeHead(statusCode){
        this.statusCode = statusCode;
        let s = "";
        s += "HTTP/1.1 " + this.statusCode + " " + this.statusMap[this.statusCode] + "\r\n";
        for (const prop in this.headers){
            s += prop + ": " + this.headers[prop] + "\r\n";
        }
        s += "\r\n";
        this.write(s);
    }
    
    redirect(statusCode, url){
        if (arguments.length === 1){
            url = statusCode;
            this.statusCode = 301;
        }
        else{
            this.statusCode = statusCode;
        }
        this.setHeader("Location", url);
        let s = "";
        s += "HTTP/1.1 " + this.statusCode + " " + this.statusMap[this.statusCode] + "\r\n";
        for (const prop in this.headers){
            s += prop + ": " + this.headers[prop] + "\r\n";
        }
        s += "\r\n";
        s += this.body;
        this.end(s);
    }
    
    toString(){
        let s = "";
        s += "HTTP/1.1 " + this.statusCode + " " + this.statusMap[this.statusCode] + "\r\n";
        for (const prop in this.headers){
            s += prop + ": " + this.headers[prop] + "\r\n";
        }
        s += "\r\n";
        s += this.body;
        return s;
    }
    
    sendFile(fileName){
        const ext = fileName.split('.').pop();
        fileName = __dirname + "/../public/" + fileName;
        if (ext === "html" || ext === "txt" || ext === "css"){
            fs.readFile(fileName, "utf8", (err,data) => {
                if (err){
                    this.setHeader("Content-Type","text/plain");
                    const body = "uh oh... 500 server error!\n";
                    this.send(500, body);
                    console.log("Something went wrong", err);
                }
                else{
                    this.setHeader("Content-Type", this.contentTypeMap[ext]);
                    this.writeHead(200);
                    this.write(data);
                    this.end();
                }
            });
        }
        else{
            fs.readFile(fileName, (err,data) => {
                if (err){
                    this.setHeader("Content-Type","text/plain");
                    const body = "uh oh... 500 server error!\n";
                    this.send(500, body);
                    console.log("Something went wrong", err);
                }
                else{
                    this.setHeader("Content-Type", this.contentTypeMap[ext]);
                    this.writeHead(200);
                    this.write(data);
                    this.end();
                }
            });
        }
    }
}
/*
let s = '';
s += 'GET /foo.html HTTP/1.1\r\n';   // request line
s += 'Host: localhost:8080\r\n';     // headers
s += '\r\n\r\n';  
const r = new Request(s);
console.log(r.path);
console.log(r.method);
console.log(r.headers);
console.log("body" + r.body);
console.log(r.toString());
*/

const server = net.createServer((sock) => {
    console.log(`got connection from ${sock.remoteAddress}:${sock.remotePort}`);
    /*
    sock.on('data', (binaryData) => {
        console.log(`got data\n=====\n${binaryData}`);
    });

    sock.on('close', (data) => {
        console.log(`closed - ${sock.remoteAddress}:${sock.remotePort}`);
    });*/

    sock.on('data', function (binaryData) {
        binaryData = binaryData.toString();
        const req = new Request(binaryData);
        const res = new Response(sock);
        if (req.path === "/"){
            /*const res = "HTTP/1.1 200 OK\r\n" + 
                "Content-Type: text/html; charset=UTF-8\r\n\r\n" + 
                "<link rel=\"stylesheet\" type=\"text/css\" href=\"foo.css\">\n" + 
                "<h2> This is a read header!</h2>\n" +
                "<em>Hello</em> <strong>World</strong>\n";*/
            res.setHeader("Content-Type", "text/html");
            const body = "<link rel=\"stylesheet\" type=\"text/css\" href=\"foo.css\">\n" + 
                "<h2> This is a red header!</h2>\n" +
                "<em>Hello</em> <strong>World</strong>\n";
            res.send(200,body);
        }
        else if (req.path === "/foo.css"){
            /*const res = "HTTP/1.1 200 OK\r\n" + 
                "Content-Type: text/css; charset=UTF-8\r\n\r\n" + 
                "h2 {color:red;}\n";*/
            res.setHeader("Content-Type", "text/css");
            const body = "h2 {color:red;}\n";
            res.send(200, body);
        }
        else if (req.path === "/test"){
            const fileName = "html/test.html";
            res.sendFile(fileName);
        }
        else if (req.path === "/img/bmo1.gif"){
            const fileName = "/img/bmo1.gif";
            res.sendFile(fileName);
        }
        /*Test redirect
        else if (req.path === "/home"){
            res.redirect("/");
        }*/
        else{
             /*const res = "HTTP/1.1 404 Not Found\r\n" + 
                "Content-Type: text/plain; charset=UTF-8\r\n\r\n" + 
                 "uh oh... 404 page not found!\n";*/
            res.setHeader("Content-Type", "text/plain");
            const body = "uh oh... 404 page not found!\n";
            res.send(404, body);
        }
        //res.end();
    });
    
});

server.listen(PORT, HOST);

module.exports = {
    Request:Request,
    Response:Response
};
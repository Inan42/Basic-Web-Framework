// miniWeb.js
// define your Request, Response and App objects here
const fs = require('fs');
const net = require('net');

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
        //console.log(this.statusCode);
        this.setHeader("Location", url);
        let s = "";
        s += "HTTP/1.1 " + this.statusCode + " " + this.statusMap[this.statusCode] + "\r\n";
        for (const prop in this.headers){
            s += prop + ": " + this.headers[prop] + "\r\n";
        }
        s += "\r\n";
        s += this.body;
        //console.log(this.statusCode);
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
        if (this.contentTypeMap[ext] === undefined){
            this.setHeader("Content-Type","text/plain");
            const body = "uh oh... 500 server error!\n";
            this.writeHead(500);
            this.write(body);
            this.end("");
        }
        else if (ext === "html" || ext === "txt" || ext === "css"){
            fs.readFile(fileName, "utf8", (err,data) => {
                if (err){
                    this.setHeader("Content-Type","text/plain");
                    const body = "uh oh... 500 server error!\n";
                    this.writeHead(500);
                    this.write(body);
                    this.end("");
                    console.log("Something went wrong", err);
                }
                else{
                    this.setHeader("Content-Type", this.contentTypeMap[ext]);
                    this.writeHead(200);
                    this.write(data);
                    this.end("");
                }
            });
        }
        else{
            fs.readFile(fileName, (err,data) => {
                if (err){
                    this.setHeader("Content-Type","text/plain");
                    const body = "uh oh... 500 server error!\n";
                    this.writeHead(500);
                    this.write(body);
                    this.end();
                    console.log("Something went wrong", err);
                }
                else{
                    this.setHeader("Content-Type", this.contentTypeMap[ext]);
                    this.writeHead(200);
                    this.write(data);
                    this.end("");
                }
            });
        }
    }
}

class App{//fix 500s in req/resp
    constructor(){
        this.server = net.createServer(this.handleConnection.bind(this));
        this.routes = {};
    }
    
    get(path, cb){
        this.routes[path] = cb;
    }
    
    listen(port, host){
        this.server.listen(port,host);
    }
    
    handleConnection(sock){
        sock.on('data', (binaryData) => {
           this.handleRequestData(sock,binaryData); 
        });
    }
    
    handleRequestData(sock,binaryData){
        //console.log(binaryData);
        const reqStr = "" + binaryData;
        //console.log(reqStr);
        const req = new Request(reqStr);
        const res = new Response(sock);
        sock.on('close', () => {
            this.logResponse(req,res);
        });
        sock.on('error', err => console.log(err));
        //console.log(req.headers);
        if (req.headers.hasOwnProperty("Host") || req.headers.hasOwnProperty("host")){
            if (req.path[req.path.length-1] === "/" && req.path.length > 1){
                 req.path = req.path.slice(0,req.path.length-1);
             }
            if (this.routes.hasOwnProperty(req.path)){
                this.routes[req.path](req,res);
            }
            else{
                res.setHeader("Content-Type","text/plain");
                const body = "uh oh... 404 file not found!\n";
                res.send(404, body);
            }
        }
        else{
            res.setHeader("Content-Type","text/plain");
            const body = "uh oh... 400 bad request!\n";
            res.send(400, body);
        }
    }
    
    logResponse(req, res){
        console.log(req.method + " " + req.path + " - " + res.statusCode + " " + res.statusMap[res.statusCode]);
    }
}

module.exports = {
    Request:Request,
    Response:Response,
    App:App
};
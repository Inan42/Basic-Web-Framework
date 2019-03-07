// basic JS networking

const net = require('net');
//const HOST = '127.0.0.1';
const HOST = '0.0.0.0';
const PORT = 8080;

const server = net.createServer((sock) => {
    console.log(`got connection from ${sock.remoteAddress}:${sock.remotePort}`);
    /*
    sock.on('data', (binaryData) => {
        console.log(`got data\n=====\n${binaryData}`);
    });

    sock.on('close', (data) => {
        console.log(`closed - ${sock.remoteAddress}:${sock.remotePort}`);
    });*/
    sock.on('data', () => {
        const res = "HTTP/1.1 200 OK\r\n" + 
                "Content-Type: text/html; charset=UTF-8\r\n\r\n" + 
                 "<em>Hello</em> <strong>World</strong>\n";
        sock.write(res);
        sock.end();
    });
    
});

server.listen(PORT, HOST);



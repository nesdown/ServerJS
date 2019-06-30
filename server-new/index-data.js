const http = require('http');
const net = require('net');
const url = require('url');
const port = 8000;
const host = '127.0.0.1';

//Служебные коды возникновения ошибок
const res101 = 'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n\r\n';

const res200 = 'HTTP/1.1 200 Connection Established\r\n' +
               'proxyReq-agent: Node-VPN\r\n\r\n';

const res400 = 'HTTP/1.1 400 Bad Request\r\n\r\n';
const res404 = 'HTTP/1.1 404 Not Fond\r\n\r\n';
const res500 = 'HTTP/1.1 500 External Server End\r\n';

// Блок инициализации соообщения об ошибке
const ures500 = err => `HTTP/1.1 500 ${err}`;

// установка соединения с парсов урла через хостнейм, для хттпс
// с созданием сокета
// браузер видит прокси, отправляет коннект метод, ловим ео и даем подтверждение
const establishStream = (clientSocket, reqUrl, isWS) => {

  let { port, hostname } = url.parse(`//${reqUrl}`, false, true);
  if (hostname && port) {

    console.log(`\nEstablishing connection to ${hostname}:${port}`);
    // Подключение к порту и хосту назначения
    const serverSocket = net.connect(port, hostname);

    serverSocket.on('connect', () => {
      console.log(`$$$ NET 'connect' `);
      if (!isWS) {
        clientSocket.write(res200);
      } else {
        clientSocket.write(res101);
      }
      // "blindly" (for perf) pipe cl socket and dest socket between each other
      // пайпим данные между браузером и сайтом
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });

    // хендлим ошибки
    const serverErrorHandler = (err) => {
      console.log(`Server error happened on : ${reqUrl}`);
      console.error('serverErrorHandler: ' + err.message);
      if (clientSocket) {
        clientSocket.write(ures500(err.message));
      }
    };


    const serverEndHandler = () => {
      if (clientSocket) {
        clientSocket.end(res500);
      }
    };

    // отслеживание ошибок с еррор кодом
    const clientErrorHandler = (err) => {
      // console.log(reqUrl);
      console.error('clientErrorHandler: ' + err.message);
    };

    const clientEndHandler = () => {
      // console.log(reqUrl);
      if (serverSocket) {
        // console.log('*CLIENT END TRIGGER');
        serverSocket.end();
      }
    };

    serverSocket.on('error', serverErrorHandler);
    serverSocket.on('end', serverEndHandler);
    serverSocket.on('data', (buffer) => {
      console.log(`$$$${reqUrl} "Date Event":\n`, buffer.toString('utf8'));
    })
    clientSocket.on('error', clientErrorHandler);
    clientSocket.on('end', clientEndHandler);
  } else {
    // console.log('***END TRIGGER');
    clientSocket.end(res400);
  }

};


const proxy = http.createServer().listen(port, host, (err) => {
  if (err) {
    return console.error(err);
  }
  const info = proxy.address();
  console.log(`Server is listening on ${info.address}:${info.port}`);
});


// {{{{     HTTP listen for HTTP/1.1 REQUEST method
proxy.on('request', (req, res) => {

  console.log('Request  ', req.method, req.url);

  const options = {
    hostname: req.headers.host,
    path: req.url,
    method: req.method,
    headers: req.headers,
    /*`timeout` spec the number of ms before the request times out.
     * If the request takes longer than `timeout`, the request will be aborted.
     */timeout: 30000
  };

  console.log(options);
  const proxyReq = http.request(options);
  proxyReq.on('response', (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.statusMessage, proxyRes.headers);
      proxyRes.pipe(res);
  });

  proxyReq.on('timeout', () => {
    console.log('timeout! ' +
      (options.timeout / 1000) + ' seconds expired');
    proxyReq.destroy();
  });

  proxyReq.on('error', (e) => {
    console.log('Request Error : ' + e);
  });

  req.pipe(proxyReq, { end: true });

});

proxy.on('connect', (req, clientSocket, head) => {
    console.log('Proxy "connect" ', clientSocket.remoteAddress, clientSocket.remotePort, req.method, req.url);
    establishStream(clientSocket, req.url, false);


});

proxy.on('upgrade', (req, clientSocket) => {

  console.log('++++++++++Upgrade  ', clientSocket.remoteAddress, clientSocket.remotePort,
    req.method, req.url);

  establishStream(clientSocket, req.url, true);

});
//    }}}}
module.exports = proxy
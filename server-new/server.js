const http = require('http');

// onRequest  - функция имплеметированная далее для раоты с запросами
http.createServer(onRequest).listen(3000);

function onRequest(request, response) {
	console.log('Server: ' + request.url)
} 

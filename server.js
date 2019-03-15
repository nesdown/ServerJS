var http = require('http');
var proxy = require('http-proxy');


// Creating a new prox
proxyServer = proxy.createProxyServer({target:'http://127.0.0.1:9000'})

//Listen on a default port
proxyServer.listen(8000);

// Create a server instance
server = http.createServer(function(request, response) {
	// Log the data we are requesting for
	console.log(request.url);

	// Run request and response through the web 
	proxyServer.web(request, response, { target: request.url });

	// Launch a proxy with error handling
	proxyServer.on('error', function(e) {
		console.log('Proxy call returned an error.')
	})
});

// Listen on 9000 port
server.listen(9000);
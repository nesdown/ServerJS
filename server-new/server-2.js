const httpProxy = require('http');

httpProxy.createServer(function(req, res, next) {
   //custom logic
   next();
}, function(req, res) {
   var proxy = new httpProxy.RoutingProxy();
   var buffer = httpProxy.buffer(req);
   var urlObj = url.parse(req.url);
   req.headers.host = urlObj.host;
   req.url = urlObj.path;
   console.log(urlObj.protocol);
  setTimeout(function() {
     proxy.proxyRequest(req, res, {
        host: urlObj.host,
        port: 80,
        buffer: buffer,
    }
   )}, 5000);

}).listen(5000, function() {
console.log("Waiting for requests...");
});
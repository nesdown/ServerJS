const HTTP = require('http');

// Создать сервер принимающий запросы на порту 3000
HTTP.createServer(processRequest).listen(50000);

// Запрос проходит через функцию
function processRequest(request, response) {
	// Логируем ссылку на запрошенный объект
	console.log("Request URL: " + request.url);

	// Объект опций содержит набор данных - путь, метод, заголовки запроса
	let options = {
		hostname: request.headers.host,
		port: 80,
		path: request.url,
		method: request.method,
		headers: request.headers
	}

	// console.log(request);

	// А теперь воспроизведем сам запрос
	let proxy = HTTP.request(options, function(res) {
		response.writeHead(res.statusCode, res.headers);
		res.pipe(response, {
			end: true
		});
	});

	request.pipe(proxy, {
		end: true
	})
}


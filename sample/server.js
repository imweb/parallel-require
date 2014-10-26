var connect = require('connect'),
	compression = require('compression');

connect()
	.use(compression())
	.use(connect.static('./'))
	.listen(3000, function () {
		console.log('Enter http://localhost:3000/index.html & see the demo!');
	});
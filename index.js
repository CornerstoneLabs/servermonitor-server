var uuid = require('uuid');
var socketio = require('socket.io');

function listClients (clients) {
	var result = clients.map(function (client) {
		return client.config;
	});

	console.log("List clients:");
	console.log(result);

	return result;
}

var Server = {};
Server.start = function (server) {
	var io = socketio(server);
	var _sockets = [];
	var _clients = [];
	var _tasks = [];

	io.on('connection', function(socket) {
		console.log('New client connected.');

		_sockets.push(socket);

		var clientConfig = {
			name: uuid.v4()
		};

		var clientData = {
			config: clientConfig,
			socket: socket
		};

		_clients.push(clientData);

		socket.on('input-log', function (from, msg) {
			console.log(from, '\n', msg.toString());

			io.sockets.emit('output-log', from, msg.toString());
		});

		socket.on('input-error', function (from, msg) {
			console.log(from, '\n', msg.toString());

			io.sockets.emit('output-error', from, msg.toString());
		});

		socket.on('input-close', function (from, msg) {
			console.log(from, '\n', msg.toString());

			io.sockets.emit('output-close', from, msg.toString());
		});

		socket.on("newclient", function (newClientOptions) {
			console.log(newClientOptions);
			clientConfig.roles = newClientOptions.roles;
			newClientOptions.tasks.forEach((task) => {
				if (_tasks.indexOf(task) === -1) {
					_tasks.push(task);
				}
			});

			io.sockets.emit("clients-updated", listClients(_clients));
			io.sockets.emit("tasks-updated", _tasks);

			socket.emit("manage-newclient", clientConfig);
		});

		socket.on('execute-task', function (task, role) {
			io.sockets.emit(task);
		});

		socket.on('list-clients', function () {
			socket.emit("clients-updated", listClients(_clients));
		});

		socket.on('list-tasks', function () {
			socket.emit("tasks-updated", _tasks);
		});

		socket.on('disconnect', function() {
			console.log('Got disconnect!');

			_sockets.splice(_sockets.indexOf(socket), 1);
			_clients.splice(_clients.indexOf(clientData), 1);

			io.sockets.emit("clients-updated", listClients(_clients));
		});
	});
};

module.exports = Server;
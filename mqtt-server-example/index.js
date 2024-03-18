
const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)
const port = 1883
 
server.listen(port, function () {
  console.log('server started and listening on port ', port)
});
 
// TODO: use device certificate will be greater
aedes.authenticate = function (client, username, password, callback) {
    callback(null, (username === 'user' && password.toString() === '123456'));
}
 
aedes.on('client', function (client) {
    console.log(`Client Connected: ${client ? client.id : client} to broker, ${aedes.id}`);
});
 
aedes.on('clientDisconnect', function (client) {
    console.log(`Client Disconnected: ${client ? client.id : client} to broker, ${aedes.id}`)
})
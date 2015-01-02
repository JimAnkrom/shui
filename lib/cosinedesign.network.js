/**
 * Created by Jim Ankrom on 1/1/2015.
 */
var xhr = {
    delete: function (url, params, options) {
        return xhr.request(url, 'DELETE', params, options);
    },
    get: function (url, params, options) {
        return sway.api.request(url, 'GET', params, options);
    },
    post: function (url, params, options) {
        return sway.api.request(url, 'POST', params, options);
    },
    request: function (url, verb, params, options) {
        var options = options || {};
        if (window.XMLHttpRequest) {
            var http = new XMLHttpRequest();
            http.withCredentials = true;
            options.responseType = options.responseType || "json";
            if (http.responseType) http.responseType = options.responseType;

            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    if (http.status == 200) {
                        var response;
                        if (!http.responseType) {
                            if (options.responseType == 'json' && http.responseText) {
                                try {
                                    response = JSON.parse(http.responseText);
                                } catch (ex) {
                                    response = ex;
                                }
                            } else {
                                response = http.responseText;
                            }
                        }
                        sway.api.processResponse(response);
                        if (options.success) {
                            options.success(http, response);

                        }
                    } else {
                        if (options.error) {
                            options.error(http, http.response);
                        }
                    }
                }
            };
            var message = JSON.stringify(params);
            //console.log(url);
            http.open(verb, url, true);
            http.setRequestHeader('Accept', '*/*');
            http.setRequestHeader('Content-Type', 'application/json');

            //http.setRequestHeader("Content-Length", message.length);
            //http.send(params);
            http.send(message);
            return http;
        }
        // because IE5&6 needs to go away
        return 'You are using a browser that does not support required technology';
    }
};

/**
 *
 *   Socket Extensions
 *   Created by Jim Ankrom on 12/14/2014.
 *
 *   - Multicast Events
 *   -
 *
 *   Requires:
 *   - Engine.io ( repo at https://github.com/Automattic/engine.io-client )
 *   - Multicast ( clone at https://gist.github.com/087c895971dc20ce9e37.git )
 *
 *   Reference:
 *   engine.io's packet prefixes -
 var packets = exports.packets = {
        open:     0    // non-ws
      , close:    1    // non-ws
      , ping:     2
      , pong:     3
      , message:  4
      , upgrade:  5
      , noop:     6
    };
 */
function Socket (config) {
    var self = this;
    this.verbose = false;
    var delimiter = this.delimiter = config.delimiter || '|';
    var socket;

    this.log = function (source, data) {
        if (self.verbose && console) console.log('[' + source + ']: ' + JSON.stringify(data));
    };

    // Assign handlers
    this.onHandshake = multicast(self.log.bind(self, 'handshake'));
    this.onConnect = multicast(self.log.bind(self, 'connect'));
    this.onMessage = multicast(self.log.bind(self, 'message'));
    this.onClose = multicast(self.log.bind(self, 'close'));
    this.onError = multicast(function (error) {
        //if (bleepout.debug && console)
        console.log('Socket Error: ' + error.message);
    });
    this.onOpen = multicast(function () {
        socket.on('message', self.onMessage);
        socket.on('close', self.onClose);
        socket.on('error', self.onError);
        self.onConnect("Entering Connect");
    });

    this.connect = function () {
        /*
         ( Engine.io - in reverse order)
         open is emitted by Socket.onOpen and Transport.onOpen
         Socket.onOpen is called by socket.onHandshake
         Socket.onHandshake is called by Socket.onPacket
         Socket.onPacket is a pass-through call from Transport's 'packet' event handler
         Transport's packet event is emitted by Transport.onPacket
         Transport.onPacket is raised by Transport.onData after calling parser.decodePacket
         */
        socket = eio(config.socketAddress, { "transports": ['websocket']});
        socket.on('open', self.onOpen);
        socket.on('handshake', self.onHandshake);
    };

    this.send = function (message) {
        if (socket) {
            if (self.verbose) self.log('send', JSON.stringify(message));
            socket.send(message);
        }
    };

    return this;
};
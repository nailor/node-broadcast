var http = require('http'),
    sys = require('sys'),
    posix = require('posix');

var messages = [];
var message_queue = process.EventEmitter();

function store_message(msg) {
    msg.id = messages.length;
    messages.push(msg);
    message_queue.emit('message', msg);
}

function receive_messages(id) {
    return messages.slice(id);
}

function send_file(filename, res, content_type) {
    if (!content_type) {
        content_type = 'text/html';
    }
    sys.puts('Serving file: ' + filename);
    var page = posix.cat(filename).addCallback(
        function(content) {
            res.sendHeader(200, {'Content-Type': content_type});
            res.sendBody(content);
            res.finish();
        });
}

function send_json(obj, res) {
    var json = JSON.stringify(obj);
    res.sendHeader(200, {'Content-Type': 'application/json'});
    res.sendBody(json);
    res.finish();
}

function handle_post(req, callback) {
    req.setBodyEncoding('utf-8');
    var body = '';
    req.addListener(
        'body',
        function(chunk) {
            body += chunk;
        });
    req.addListener(
        'complete',
        function() {
            callback(http.parseUri('http://example.com/?' + body).params);
        });
}

function main(req, res) {
    var path = req.uri.path;

    if (path == '/') {
        send_file('index.html', res);
    } else if (path == '/jquery.js') {
        send_file('jquery.js', res, 'text/javascript');
    } else if (path == '/chatter.js') {
        send_file('chatter.js', res, 'text/javascript');
    } else if (path == '/wait') {
        var messages = receive_messages(req.uri.params.id);
        if (messages.length) {
            send_json(messages, res);
        } else {
            var listener = message_queue.addListener(
                'message',
                function(msg) {
                    send_json(receive_messages(msg.id), res);
                    message_queue.removeListener(listener);
                    clearTimeout(timeout);
                });
            var timeout = setTimeout(
                function() {
                    message_queue.removeListener(listener);
                    send_json([], res);
                }, 10000);
        }
    } else if (path == '/post') {
        if (req.method == 'POST') {
            handle_post(
                req,
                function(params) {
                    store_message(params);
                });
        }
        res.sendHeader(200, {'Content-Type': 'text/html'});
        res.sendBody('<form method="post" action="/post">'
                     + '<input type="text" name="message">'
                     + '<input type="submit" value="submit">'
                     + '</form>');
        res.finish();
    }
}

var server = http.createServer(main);
server.listen(8000);

sys.puts('Listening in http://127.0.0.1:8000/');
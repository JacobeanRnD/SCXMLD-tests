'use strict';
// jshint node: true
/* global expect */

var scxmld = require('../../'),
  request = require('request'),
  eventsource = require('eventsource'),
  path = require('path'),
  fs = require('fs'),
  glob = require('glob');

module.exports = function(opts) {
  opts = opts || {};
  opts.port = opts.port || 6003;
  opts.host = 'http://localhost:' + opts.port;
  opts.baseApi = '/api/v1/';
  opts.api = opts.host + opts.baseApi;
  opts.testFolder = path.resolve(__dirname + '/../node_modules/scxml-test-framework/test') + '/';

  // Load every *.scxml file under scxml-test-framework/test
  opts.fileList = glob.sync('**/*.scxml', { cwd: opts.testFolder });

  opts.beforeEach = function (done) {
    if(opts.server) {
      console.log('\u001b[31mCleanup timed out server\u001b[0m');
      // This is a workaround for jasmine
      // Jasmine doesn't cleanup on timeouts
      opts.server.close(function () {
        delete opts.server;

        opts.startServer(done);        
      });
    }

    opts.startServer(done);
  };

  opts.startServer = function (done) {
    scxmld.initExpress({ port: opts.port }, function (err, express) {
      if(err) {
        console.log(err);
        return done();
      }

      opts.server = express.app.listen(opts.port, done);
    });
  };

  opts.afterEach = function (done) {
    //Run request delete methods here
    //On success, delete server, call done()
    opts.server.close(function () {
      delete opts.server;

      done();
    });
  };

  opts.statechart = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                      '<scxml xmlns="http://www.w3.org/2005/07/scxml" name="helloworld" datamodel="ecmascript" version="1.0">\n' +
                      '  <state id="a">\n' +
                      '    <transition target="b" event="t"/>\n' +
                      '  </state>\n' +
                      '  <state id="b">\n' +
                      '    <transition target="c" event="t"/>\n' +
                      '  </state>\n' +
                      '  <state id="c">\n' +
                      '    <transition target="a" event="t"/>\n' +
                      '  </state>\n' +
                      '</scxml>';

  opts.saveStatechart = function (name, content, done) {
    request({
      url: opts.api + name,
      method: 'PUT',
      body: content
    }, function (error, response) {
      expect(error).toBeNull();

      if(error) {
        console.log('save statechart error', error);
        return done();
      }

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        name: 'success.create.definition',
        data: {
          chartName: name
        }
      });
      expect(response.headers.location).toBe(name);

      done();
    });
  };

  opts.runInstance = function (id, result, done) {
    request({
      url: opts.api + id,
      method: 'PUT'
    }, function (error, response) {
      expect(error).toBeNull();

      if(error) {
        console.log('run instance error', error);
        return done();
      }

      expect(response.statusCode).toBe(201);
      expect(response.headers.location).toBe(id);

      if(typeof(result) === 'function') {
        done = result; 
      } else {
        expect(JSON.parse(response.headers['x-configuration']).sort()).toEqual(result.sort());
      }

      done();
    });
  };

  opts.send = function (id, event, result, delay, done) {
    request({
      url: opts.api + id,
      method: 'POST',
      json: event
    }, function (error, response) {
      expect(error).toBeNull();

      if(error) {
        console.log('send error', error);
        return done();
      }
      
      expect(response.statusCode).toBe(200);

      if(delay) {
        setTimeout(function () {
          opts.getInstanceConfiguration(id, function (instanceResult) {
            var currentStates = instanceResult.data.instance.snapshot[0];

            checkResult(currentStates, result, done);
          });
        }, delay);
      } else {
        checkResult(JSON.parse(response.headers['x-configuration']), result, done);
      }
    });

    function checkResult (states, result, done) {
      expect(states.sort()).toEqual(result.sort());

      if(done) done();
    }
  };

  opts.subscribeInstance = function (id, startedListening) {
    var es = new eventsource(opts.api + id + '/_changes'),
      messages = [];

    function eventAction (e) { messages.push({ type: e.type, data: e.data }); }

    es.addEventListener('subscribed', function (e) {
      expect(e.type).toBe('subscribed');
      expect(e.data.length).toBe(0);

      // Trigger callback and let test know that it started listening
      // Send event source closing function
      startedListening(completed);
    }, false);
    es.addEventListener('onEntry', eventAction, false);
    es.addEventListener('onExit', eventAction, false);
    es.onerror = eventAction;

    function completed(results, done) {
      es.close();

      if(results) {
        expect(messages).toEqual(results);
      }

      done();
    }
  };

  opts.subscribeInstanceUntilState = function (id, pass, fail, done, startedListening) {
    var es = new eventsource(opts.api + id + '/_changes');

    function eventAction (e) {
      console.log(JSON.stringify({ type: e.type, data: e.data }));

      expect(e.type).not.toBe('error');
      expect(e.data).not.toBe(fail);

      if(e.data === pass) {
        expect(e.data).toBe(pass);

        return completed();
      }

      if(e.data === fail || e.type === 'error') {
        return completed();
      }
    }

    es.addEventListener('subscribed', function (e) {
      expect(e.type).toBe('subscribed');
      expect(e.data.length).toBe(0);

      // Check if instance is already on pass/fail state
      opts.getInstanceConfiguration(id, function (result) {
        var currentStates = result.data.instance.snapshot[0];

        // Simulate receiving changes
        currentStates.forEach(function (state) {
          eventAction({ type: 'onEntry', data: state });
        });
      });

      // Trigger callback and let test know that it started listening
      if(startedListening) startedListening();
    }, false);
    es.addEventListener('onEntry', eventAction, false);
    es.addEventListener('onExit', eventAction, false);
    es.onerror = eventAction;

    function completed() {
      es.close();

      done();
    }
  };

  opts.getInstanceConfiguration = function (id, done) {
    request({
      url: opts.api + id,
      method: 'GET'
    }, function (error, response) {
      expect(error).toBeNull();

      if(error) {
        console.log('get instance conf error', error);
        return done();
      }
      
      expect(response.statusCode).toBe(200);

      var body = JSON.parse(response.body);

      done(body);
    });
  };

  opts.deleteStatechart = function(scName, done) {
    request({
      url: opts.api + scName,
      method: 'DELETE'
    }, function (error, response) {
      expect(error).toBeNull();

      if(error) {
        console.log('error on sc delete', error);
        return done(error);
      }
      
      expect(response.statusCode).toBe(200);

      done();

    });
  };

  opts.read = function (path) {
    return fs.readFileSync(opts.testFolder + path, 'utf-8');
  };

  return opts;
};

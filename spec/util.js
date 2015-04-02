'use strict';
// jshint node: true
/* global expect */

var scxmld = require('scxmld'),
  request = require('request'),
  eventsource = require('eventsource');

module.exports = function(opts) {
  opts = opts || {};
  opts.port = opts.port || 6003;
  opts.host = 'http://localhost:' + opts.port;
  opts.baseApi = '/api/v1/';
  opts.api = opts.host + opts.baseApi;

  opts.beforeEach = function (done) {
    this.server = scxmld.listen(opts.port);
    done();
  };

  opts.afterEach = function (done) {
    this.server.close();
    
    done();
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
      expect(response.statusCode).toBe(201);
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
      expect(response.statusCode).toBe(201);
      expect(response.headers.location).toBe(id);
      expect(JSON.parse(response.headers['x-configuration'])).toEqual(result);

      done();
    });
  };

  opts.send = function (id, event, result, done) {
    request({
      url: opts.api + id,
      method: 'POST',
      json: event
    }, function (error, response) {
      expect(error).toBeNull();
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.headers['x-configuration'])).toEqual(result);

      if(done) done();
    });
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

      expect(messages.length).toBeGreaterThan(0);
      expect(messages).toEqual(results);

      done();
    }
  };

  opts.subscribeInstanceUntilState = function (id, pass, fail, done, startedListening) {
    var es = new eventsource(opts.api + id + '/_changes');

    function eventAction (e) {
      expect(e.type).not.toBe('error');
      expect(e.data).not.toBe(fail);

      if(e.data === pass) {
        expect(e.data).toBe(pass);

        return completed();
      }

      if(e.data === fail || e.type === 'error') {
        return completed(false);
      }
    }

    es.addEventListener('subscribed', function (e) {
      expect(e.type).toBe('subscribed');
      expect(e.data.length).toBe(0);

      // Trigger callback and let test know that it started listening
      startedListening();
    }, false);
    es.addEventListener('onEntry', eventAction, false);
    es.addEventListener('onExit', eventAction, false);
    es.onerror = eventAction;

    function completed() {
      es.close();

      done();
    }
  };

  return opts;
};
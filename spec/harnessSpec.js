'use strict';
// jshint node: true
/* global describe, beforeEach, afterEach, it */

var util = require('./util')();

describe('SCXMLD', function () {
  beforeEach(function (done) { util.beforeEach(done); });
  afterEach(function (done) { util.afterEach(done); });

  it('should save helloworld statechart', function (done) {
    util.saveStatechart('helloworld.scxml', util.statechart, done); 
  });

  it('should run helloworld', function (done) {
    util.saveStatechart('helloworld.scxml', util.statechart, function () {
      util.runInstance('helloworld.scxml', 'test', done);
    });
  });

  it('should send event "t"', function (done) {
    util.saveStatechart('helloworld.scxml', util.statechart, function () {
      util.runInstance('helloworld.scxml', 'test', function () {
        util.send('helloworld.scxml/test', { name: 't' }, done);  
      });
    });
  });

  it('should subscribe to changes and send event "t"', function (done) {
    util.saveStatechart('helloworld.scxml', util.statechart, function () {
      util.runInstance('helloworld.scxml', 'test', function () {
        util.subscribeInstance('helloworld.scxml/test', function (stopListening) {
          util.send('helloworld.scxml/test', { name: 't' }, function () {
            var results = [{
              type: 'onExit',
              data: 'a'
            }, {
              type: 'onEntry',
              data: 'b'
            }];

            stopListening(results, done);
          });
        });
      });
    });
  });
});
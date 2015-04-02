'use strict';
// jshint node: true
/* global describe, beforeEach, afterEach, it */

var util = require('./util')();

var chartName = 'helloworld.scxml',
  instanceId = chartName + '/test';

describe('SCXMLD', function () {
  beforeEach(function (done) { util.beforeEach(done); });
  afterEach(function (done) { util.afterEach(done); });

  it('should save helloworld.scxml', function (done) {
    util.saveStatechart(chartName, util.statechart, done); 
  });

  it('should run helloworld.scxml', function (done) {
    util.saveStatechart(chartName, util.statechart, function () {
      util.runInstance(instanceId, done);
    });
  });

  it('should send event "t"', function (done) {
    util.saveStatechart(chartName, util.statechart, function () {
      util.runInstance(instanceId, function () {
        util.send(instanceId, { name: 't' }, done);  
      });
    });
  });

  it('should subscribe to changes and send event "t"', function (done) {
    util.saveStatechart(chartName, util.statechart, function () {
      util.runInstance(instanceId, function () {
        util.subscribeInstance(instanceId, function (stopListening) {
          util.send(instanceId, { name: 't' }, function () {
            var results = [ { type: 'onExit', data: 'a' },
                            { type: 'onEntry', data: 'b' }];

            stopListening(results, done);
          });
        });
      });
    });
  });
});
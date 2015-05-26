'use strict';
// jshint node: true
/* global describe, beforeEach, afterEach, it */

var util = require('./util')();

var stateChartPath = __dirname + '/../helloworld.scxml',
  instanceId = 'test';

describe('SCXMLD', function () {
  beforeEach(util.beforeEach);
  afterEach(function (done) {
    util.deleteInstance(instanceId, function () {
      util.afterEach(done);
    });
  });

  it('should run helloworld.scxml', function (done) {
    console.log('\n\u001b[34mshould run helloworld.scxml\u001b[0m');

    util.startStatechart(stateChartPath, function () {
      util.createInstance(instanceId, function () {
        util.send(instanceId, { name: 'system.start' }, ['a'], null, done);
      });
    });
  });

  it('should send event "t"', function (done) {
    console.log('\n\u001b[34mshould send event "t"\u001b[0m');

    util.startStatechart(stateChartPath, function () {
      util.createInstance(instanceId, function () {
        util.send(instanceId, { name: 'system.start' }, ['a'], null, function () {
          util.send(instanceId, { name: 't' }, ['b'], null, done);  
        });
      });
    });
  });

  it('should subscribe to changes and send event "t"', function (done) {
    console.log('\n\u001b[34mshould subscribe to changes and send event "t"\u001b[0m');

    util.startStatechart(stateChartPath, function () {
      util.createInstance(instanceId, function () {
        util.subscribeInstance(instanceId, function (stopListening) {
          util.send(instanceId, { name: 'system.start' }, ['a'], null, function () {
            util.send(instanceId, { name: 't' }, ['b'], null, function () {
              var results = [ { type: 'onExit', data: '$generated-initial-0' },
                              { type: 'onEntry', data: '$generated-scxml-0' },
                              { type: 'onEntry', data: 'a' },
                              { type: 'onExit', data: 'a' },
                              { type: 'onEntry', data: 'b' }];

              setTimeout(function () {
                stopListening(results, done);  
              }, 500);
            });
          });
        });
      });
    });
  });

  it('should end up at "b" state', function (done) {
    console.log('\n\u001b[34mshould end up at "b" state\u001b[0m');

    util.startStatechart(stateChartPath, function () {
      util.createInstance(instanceId, function () {
        util.subscribeInstanceUntilState(instanceId, 'b', 'c', done, function () {
          util.send(instanceId, { name: 't' }, ['b'], null);
        });
      });
    });
  });
});

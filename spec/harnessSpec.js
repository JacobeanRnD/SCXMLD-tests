'use strict';
// jshint node: true
/* global describe, beforeEach, afterEach, it */

var util = require('./util')();

var chartName = 'helloworld.scxml',
  instanceId = chartName + '/test';

describe('SCXMLD', function () {
  beforeEach(function (done) { util.beforeEach(done); });
  afterEach(function (done) { 
    util.deleteStatechart(chartName, function(){
      util.afterEach(done); 
    });
  });

  it('should save helloworld.scxml', function (done) {
    console.log('\n\u001b[34mshould save helloworld.scxml\u001b[0m');
    
    util.saveStatechart(chartName, util.statechart, null, done); 
  });

  it('should run helloworld.scxml', function (done) {
    console.log('\n\u001b[34mshould run helloworld.scxml\u001b[0m');

    util.saveStatechart(chartName, util.statechart, null, function () {
      util.runInstance(instanceId, ['a'], done);
    });
  });

  it('should send event "t"', function (done) {
    console.log('\n\u001b[34mshould send event "t"\u001b[0m');

    util.saveStatechart(chartName, util.statechart, null, function () {
      util.runInstance(instanceId, ['a'], function () {
        util.send(instanceId, { name: 't' }, ['b'], null, done);  
      });
    });
  });

  it('should subscribe to changes and send event "t"', function (done) {
    console.log('\n\u001b[34mshould subscribe to changes and send event "t"\u001b[0m');

    util.saveStatechart(chartName, util.statechart, null, function () {
      util.runInstance(instanceId, ['a'], function () {
        util.subscribeInstance(instanceId, function (stopListening) {
          util.send(instanceId, { name: 't' }, ['b'], null, function () {
            var results = [ { type: 'onExit', data: 'a' },
                            { type: 'onEntry', data: 'b' }];

            stopListening(results, done);
          });
        });
      });
    });
  });

  it('should end up at "b" state', function (done) {
    console.log('\n\u001b[34mshould end up at "b" state\u001b[0m');

    util.saveStatechart(chartName, util.statechart, null, function () {
      util.runInstance(instanceId, ['a'], function () {
        util.subscribeInstanceUntilState(instanceId, 'b', 'c', done, function () {
          util.send(instanceId, { name: 't' }, ['b'], null);
        });
      });
    });
  });
});

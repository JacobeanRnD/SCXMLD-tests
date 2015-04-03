'use strict';
// jshint node: true
/* global describe, beforeEach, afterEach, it */

var util = require('./util')(),
  path = require('path');

var chartName = 'helloworld.scxml',
  instanceId = chartName + '/test';

describe('SCXMLD - scxml-test-framework', function () {
  beforeEach(function (done) { util.beforeEach(done); });
  afterEach(function (done) { util.afterEach(done); });

  // Run below code for all tests
  util.frameworkFiles.forEach(function (file) {
    // Prepare test name to represent it better on console
    var pathfolders = file.split(path.sep);
    var testName = pathfolders[pathfolders.length - 2] + '/' + path.basename(file);
    // Actual test
    it('should pass ' + testName, function (done) {
      console.log('\n\u001b[32m' + testName + '\u001b[0m');

      util.saveStatechart(chartName, util.read(file), function () {
        util.runInstance(instanceId, function () {
          // Get filename.json
          var settings = require(file.slice(0, -6) + '.json'),
            events = [],
            passState = 'pass'; //Default pass state is pass

          // Check if scxml needs extra events sent
          if(settings.events && settings.events.length > 0) {
            events = settings.events;
            var lastEvent = settings.events[settings.events.length - 1];

            // Get only the last event and set it as pass state
            if(lastEvent.nextConfiguration) passState = lastEvent.nextConfiguration[0];
          }

          // Start listening
          util.subscribeInstanceUntilState(instanceId, passState, 'fail', done, function () {
            // Send events on started listening
            events.forEach(function (eventDetails) {
              util.send(instanceId, eventDetails.event, eventDetails.nextConfiguration);
            });
          });
        });
      });
    });
  });
});
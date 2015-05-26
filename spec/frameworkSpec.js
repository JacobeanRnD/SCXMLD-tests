'use strict';
// jshint node: true
/* global describe, beforeEach, afterEach, it */

var util = require('./util')(),
  async = require('async'),
  path = require('path'),
  ignoredTests = require('../ignoredTests.json');

var instanceId = 'test';

describe('SCXMLD - scxml-test-framework', function () {
  beforeEach(util.beforeEach);
  afterEach(util.afterEach);

  // Run below code for all tests
  util.fileList.forEach(function (file) {
    // Don't run ignored tests
    if(ignoredTests.indexOf(file) !== -1) return;

    // Prepare test name to represent it better on console
    var pathfolders = file.split(path.sep);
    var testName = pathfolders[pathfolders.length - 2] + '/' + path.basename(file);

    // Read testname.json file
    var settings = require(util.testFolder + file.slice(0, -6) + '.json'),
      events = [],
      passState = 'pass'; //Default pass state is pass

    // Check if scxml needs extra events sent
    if(settings.events && settings.events.length > 0) {
      // Prepare event list
      events = settings.events;

      // Get last event
      var lastEvent = settings.events[settings.events.length - 1];

      // Only the last event can be pass state
      if(lastEvent.nextConfiguration) passState = lastEvent.nextConfiguration[0];
    }
    
    if(settings.finalPass) passState = settings.finalPass[0];

    it('should pass ' + testName, function (done) {
      console.log('\n\u001b[34m' + testName + '\u001b[0m');
      console.log('Pass state:', passState);

      if(events.length > 0) {
        // Run eventful tests by sending events and checking the result
        util.startStatechart(util.getStateChartPath(file), function () {
          util.createInstance(instanceId, function () {
            util.send(instanceId, { name: 'system.start'}, null, null, function () {
              // If testname.json files contains events we can run them without listening to changes
              // Because they have nextConfiguration set, thus we know what the end result should be
              async.eachSeries(events, function (eventDetails, done) {
                // Send events one after another, waiting for the previous one
                util.send(instanceId, eventDetails.event, eventDetails.nextConfiguration, eventDetails.delayBefore, done);
              }, function () {
                done();
              });
            });
          });
        });
      } else {
        // Run eventless tests with listening to changes
        util.startStatechart(util.getStateChartPath(file), function () {
          util.createInstance(instanceId, function () {
            // Provide pass/fail parameters and set it free
            // If it passes, it was, and always will be successful.
            // If it never returns, it was never yours to begin with.
            util.subscribeInstanceUntilState(instanceId, passState, 'fail', done);
          });
        });
      }
    }, 10000);
  });
});

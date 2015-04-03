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

  util.frameworkFiles.forEach(function (file) {
    it('should pass ' + path.basename(file), function (done) {
      util.saveStatechart(chartName, util.read(file), function () {
        util.runInstance(instanceId, function () {
          util.subscribeInstanceUntilState(instanceId, 'pass', 'fail', done);
        });
      });
    });
  });
});
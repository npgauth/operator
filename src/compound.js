"use strict";

// Import
// ========

var _    = require('underscore');
var util   = require('substance-util');
var Operation = require('./operation');

// Module
// ========

var COMPOUND = "compound";

var Compound = function(ops, data) {
  this.type = COMPOUND;
  this.ops = ops;
  this.alias = undefined;
  this.data = data;

  if (!ops || ops.length === 0) {
    throw new Operation.OperationError("No operations given.");
  }
};

Compound.Prototype = function() {

  this.clone = function() {
    var ops = [];
    for (var idx = 0; idx < this.ops.length; idx++) {
      ops.push(util.clone(this.ops[idx]));
    }
    return new Compound(ops, util.clone(this.data));
  };

  this.apply = function(obj) {
    for (var idx = 0; idx < this.ops.length; idx++) {
      obj = this.ops[idx].apply(obj);
    }
    return obj;
  };

  this.invert = function() {
    var ops = [];
    for (var idx = 0; idx < this.ops.length; idx++) {
      // reverse the order of the inverted atomic commands
      ops.unshift(this.ops[idx].invert());
    }
    return new Compound(ops, this.data);
  };

  this.toJSON = function() {
    var result = {
      type: COMPOUND,
      ops: this.ops,
    };
    if (this.alias) result.alias = this.alias;
    if (this.data) result.data = this.data;
    return result;
  };

};
Compound.Prototype.prototype = Operation.prototype;
Compound.prototype = new Compound.Prototype();

Compound.TYPE = COMPOUND;

// Transforms a compound and another given change inplace.
// --------
//

var compound_transform = function(a, b, first, check, transform0) {
  var idx;

  if (b.type === COMPOUND) {
    for (idx = 0; idx < b.ops.length; idx++) {
      compound_transform(a, b.ops[idx], first, check, transform0);
    }
  }

  else {
    for (idx = 0; idx < a.ops.length; idx++) {
      var _a, _b;
      if (first) {
        _a = a.ops[idx];
        _b = b;
      } else {
        _a = b;
        _b = a.ops[idx];
      }
      transform0(_a, _b, {inplace: true, check: check});
    }
  }
};

// A helper to create a transform method that supports Compounds.
// --------
//

Compound.createTransform = function(primitive_transform) {
  return function(a, b, options) {
    options = options || {};
    if(a.type === COMPOUND || b.type === COMPOUND) {
      if (!options.inplace) {
        a = util.clone(a);
        b = util.clone(b);
      }
      if (a.type === COMPOUND) {
        compound_transform(a, b, true, options.check, primitive_transform);
      } else if (b.type === COMPOUND) {
        compound_transform(b, a, false, options.check, primitive_transform);
      }
      return [a, b];
    } else {
      return primitive_transform(a, b, options);
    }

  };
};

// Export
// ========

module.exports = Compound;

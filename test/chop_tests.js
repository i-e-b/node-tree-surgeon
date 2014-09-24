var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Chopping data out of a tree", function() {
    describe("When chopping matching data out of a tree", function() {
        it("should remove all relationships where a matching node is a child");
        it("should compose to a tree with the matching nodes and their children removed");
        it("should leave non-matching nodes in place, even if they have the same relationship kind");
        it("should chop members of an array independently");
    });
    // plus, chop after
});

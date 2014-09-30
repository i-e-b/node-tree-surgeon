var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Fusing nodes into parents and children", function() {
    describe("When fusing a node by predicate", function(){
        it("should remove the selected nodes");
        it("should retain the parent and child of the selected nodes");
        it("should add values to child as selected by child-predicate");
        it("should add values to parent as selected by parent-predicate");
    });
});

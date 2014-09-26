var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Merging nodes into children", function() {
    describe("When merging down by relationship kind", function() {
        it("should remove the parent nodes of a relationship");
        it("should retain the child nodes of a relationship");
        it("should add all values from the parent to all of its children");
        it("should apply the merge recursively");
        it("should join conflicting values by creating arrays on the child elements which have conflicts");
        it("should concatenate arrays being merged");
        it("should not remove the root node even if matched");
    });

    describe("When merging down by node predicate",function(){
        it("should remove the matched nodes");
        it("should retain the children of matched nodes");
        it("should add all values from matched nodes to their children");
        it("should apply the merge recursively, but not to children who received predicated values");
        it("should join conflicting values by creating arrays on the child elements which have conflicts");
        it("should concatenate arrays being merged");
        it("should not remove the root node even if matched");
    });
});

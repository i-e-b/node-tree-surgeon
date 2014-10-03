var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Rendering a relational structure into a new object structure", function() {
    it("should apply the node transform to all nodes");
    it("should apply the relation transform to all relationships");
    it("should not render properties on source that are not output by the node transform");
    it("should not render relationships from the source that are not output by the relation transform");
    it("should be able to render and then compose, resulting in unmodified composed output");
    it("should be able to render the same relational structure multiple times through different transforms");
    it("should handle conflicts between rendered properties and kind properies by concatenating into arrays");
});

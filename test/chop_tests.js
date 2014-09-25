var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Chopping data out of a tree", function() {
    describe("When chopping matching data out of a tree", function() {
        it("should remove all relationships where a matching node is a child", function(){
            var input = {
                "keep" : {
                    "match":"no",
                    "goneChild":{
                        "match":"yes"
                    }
                },
                "gone":{
                    "match":"yes"
                }
            };
            var filter = function(n) { return n.match == "yes"; }

            var expected = {
                "keep":{
                    "match":"no"
                }
            };

            var result = 
                tree.compose(
                    tree.chop(filter,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should compose to a tree with the matching nodes and their children removed");
        it("should leave non-matching nodes in place, even if they have the same relationship kind");
        it("should chop members of an array independently");
    });
    // plus, chop after
    describe("When chopping after matching data in a tree", function(){
        it("should remove all relationships where a matching node is a parent");
        it("should compose to a tree where matching nodes exist but have no children");
        it("should leave non-matching nodes in place");
        it("should chop members of an array independently");
    });
});

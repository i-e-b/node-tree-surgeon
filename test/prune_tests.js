var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Tree pruning", function() {
    describe("When pruning a relationship kind", function() {
        it("should remove relationships matching the given kind", function(){
            var relational = {
                "Root":"1",
                "Nodes":{
                    "1":{
                        "ID":"1", 
                        "simple":"value"
                    },
                    "4":{ // note: breadth first search
                        "ID":"4", "what":"child of the root"
                    },
                    "2":{
                        "ID":"2", "node":"2"
                    },
                    "3":{
                        "ID":"3", "value":"hi there"
                    }
                },
                "Relations":[
                    {"Parent":"1", "Child":"2", "Kind":"subtree"},
                    {"Parent":"1", "Child":"4", "Kind":"another"},
                    {"Parent":"2", "Child":"3", "Kind":"subsub"}
                ]
            };

            var expected = [
                {"Parent":"1", "Child":"4", "Kind":"another"},
                {"Parent":"2", "Child":"3", "Kind":"subsub"}
            ];

            var result = tree.prune(relational, "subtree");

            expect(result.Relations).to.deep.equal(expected);
        });

        it("should compose into an object with the matched nodes removed", function(){
            var input = {
                "ID":"1",
                "simple":"value",
                "subtree" : {
                    "ID":"2",
                    "node":"2",
                    "subsub" : {
                        "ID":"3",
                        "value":"hi there"
                    }
                },
                "another" : {
                    "ID":"4",
                    "what":"child of the root"
                }
            };
            var expected = {
                "ID":"1",
                "simple":"value",
                "another" : {
                    "ID":"4",
                    "what":"child of the root"
                }
            };

            var result = tree.compose(tree.prune(tree.decompose(input), "subtree"));

            expect(result).to.deep.equal(expected);
        });
    });

    describe("When pruning after a relationship kind", function(){
        it("should remove all child relationships of all matching kinds");
        it("should compose into an object with the matched nodes still present");
        it("should compose into an object with no children on the matched nodes");
    });

    describe("When pruning all but a set of relationship kinds", function() {
        /* like:  tree.pruneAllBut(["a","b"], relational); */
        it("should compose into an object with only the matching subtrees remaining");
    });
}); 

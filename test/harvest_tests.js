var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Harvesting subtrees", function() {
    describe("When getting subtrees by kind", function(){    
        it("should return an object whose property values are the composed subtrees", function(){
            var sample = {
                "one": {
                    "MyID":"ID-1",
                    "pick-me" : {
                        "hello":"world",
                        "deeper" : {
                            "k":"v"
                        }
                    }
                },
                "two": {
                    "deeper": {
                        "MyID":"ID-2",
                        "pick-me" : {
                            "hello":"world",
                            "deeper" : {
                                "k":"v"
                            }
                        }
                    }
                },
                "MyID":"root",
                "pick-me" : {
                    "root":"selector"
                }
            };

            var expected = {
                "root" : {
                    "root":"selector"
                },
                "ID-1" : {
                    "hello":"world",
                    "deeper" : {
                        "k":"v"
                    }
                },
                "ID-2" : {
                    "hello":"world",
                    "deeper" : {
                        "k":"v"
                    }
                }
            };

            var keySelector = function(node){return node.MyID;};

            var result = tree.harvest("pick-me", keySelector, tree.decompose(sample));

            expect(result).to.deep.equal(expected);

        });
        it("should return an object whose property keys are selected from parent nodes by a function");
        it("should handle conflicting keys by merging into arrays");
        it("should handle overlapping subtrees"); // i.e. one selected is a child of another
    });
});

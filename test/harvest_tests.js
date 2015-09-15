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
            var composed = tree.decompose(sample).harvest("pick-me", keySelector);

            expect(result).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
        });
        it("should return an object whose property keys are selected from parent nodes by a function", function() {
            var sample = {
                "MyID":"root",
                "pick-me" : {
                    "root":"selector"
                }
            };

            var expected = {
                "root+function" : {
                    "root":"selector"
                }
            };

            var keySelector = function(node){return node.MyID+"+function";};

            var result = tree.harvest("pick-me", keySelector, tree.decompose(sample));

            expect(result).to.deep.equal(expected);
        });
        it("should give default keys if no selector function is provided", function(){
            var sample = {
                "pick-me" : {
                    "root":"selector"
                }
            };

            var expected = {
                "1" : {
                    "root":"selector"
                }
            };

            var result = tree.harvest("pick-me", undefined, tree.decompose(sample));

            expect(result).to.deep.equal(expected);

        });
        it("should handle conflicting keys by merging into arrays", function() {
            var sample = {
                "1":{
                    "pick-me" : {
                        "1":"1"
                    }
                },
                "2":{
                    "pick-me" : {
                        "2":"2"
                    }
                }

            };

            var expected = {
                "same_key" : [
                    {"1":"1"},
                    {"2":"2"}
                ]
            };

            var keySelector = function(node){return "same_key";};

            var result = tree.harvest("pick-me", keySelector, tree.decompose(sample));

            expect(result).to.deep.equal(expected);
        });
        it("should handle overlapping subtrees", function() {
            var sample = {
                "ID":"1",
                "pick-me":{
                    "ID":"2",
                    "pick-me" : {
                        "1":"1"
                    }
                }
            };

            var expected = {
                "1":{
                    "ID":"2",
                    "pick-me" : {
                        "1":"1"
                    }
                },
                "2":{"1":"1"}
            };

            var keySelector = function(node){return node.ID;};

            var result = tree.harvest("pick-me", keySelector, tree.decompose(sample));

            expect(result).to.deep.equal(expected);
        });
    });
});

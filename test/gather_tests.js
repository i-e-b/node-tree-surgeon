var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Gathering subtrees", function() {
    describe("When getting subtrees by kind", function(){    
        it("should return an array of the composed subtrees", function(){
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

            var expected = [
                {
                    "root":"selector"
                },
                {
                    "hello":"world",
                    "deeper" : {
                        "k":"v"
                    }
                },
                {
                    "hello":"world",
                    "deeper" : {
                        "k":"v"
                    }
                }
            ];

            var result = tree.gatherByKind("pick-me", tree.decompose(sample));

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

            var expected = [
                {
                    "ID":"2",
                    "pick-me" : {
                        "1":"1"
                    }
                },
                {"1":"1"}
            ];

            var result = tree.gatherByKind("pick-me", tree.decompose(sample));

            expect(result).to.deep.equal(expected);
        });
    });
    describe("When getting subtrees by predicate function",function(){
        it("should return an array of the composed subtrees",function(){
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

            var expected = [
                {
                    "root":"selector"
                },
                {
                    "hello":"world",
                    "deeper" : {
                        "k":"v"
                    }
                },
                {
                    "hello":"world",
                    "deeper" : {
                        "k":"v"
                    }
                }
            ];

            var selector = function(node) { return (node.hello == "world") || (node.root == "selector");};
            var result = tree.gatherByNode(selector, tree.decompose(sample));

            expect(result).to.deep.equal(expected);
        });
        /*it("should handle overlapping subtrees", function() {
            var sample = {
                "ID":true,
                "pick-me":{
                    "ID":true,
                    "pick-me" : {
                        "1":"1"
                    }
                }
            };

            var expected = [
                {
                    "ID": true,
                    "pick-me": {
                        "ID": true,
                        "pick-me": {
                            "1": "1"
                        }
                    }
                },
                {
                    "ID": true,
                    "pick-me": {
                        "1": "1"
                    }
                }
            ];

            var selector = function(node) { return node.ID;};
            var result = tree.gatherByNode(selector, tree.decompose(sample));

            expect(result).to.deep.equal(expected);
        });*/
        it("should be able to pick the root node", function(){
            var sample = {
                "ID":true,
                "hello":"world"    
            };

            var expected = [
                {
                    "ID":true,
                    "hello":"world"    
                }
            ];

            var selector = function(node) { return true;};
            var result = tree.gatherByNode(selector, tree.decompose(sample));

            expect(result).to.deep.equal(expected);
        });
    });
});

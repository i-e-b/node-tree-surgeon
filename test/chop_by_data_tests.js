var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Chopping data out of a tree", function() {
    describe("When chopping child nodes by kind and a data predicate", function(){
        it("should remove the nodes and their subtrees where they match", function(){
            var input = {
                "a":{
                    "par":{
                        "targ":{
                            "victim":[{"a":1},{"a":2}], // these should be removed
                            "other":{"a":1} // this should be retained
                        },
                        "data":{
                            "max":0 // this one should have all its 'victim' children removed
                        }
                    }
                },
                "b":{
                    "par":{
                        "targ":{
                            "victim":[{"a":1},{"a":2}], // these should be retained
                        },
                        "data":{
                            "max":1 // this one should keep all its 'victim' children
                        }
                    }
                }
            };

            var expected = {
                "a":{ "par":{
                        "targ":{ "other":{"a":1} },
                        "data":{ "max":0 }
                    }
                },
                "b":{ "par":{
                        "targ":{ "victim":[{"a":1},{"a":2}], },
                        "data":{ "max":1 }
                    }
                }
            };

            var comparator = function(parent, victim){ return true };
            var selector = function(dataNode){return dataNode.max == 0;}; 
            
            var actual = tree.decompose(input).chopNodesByData("data", "targ", "victim", selector, comparator).compose();

            expect(actual).to.deep.equal(expected);

        });
        it("should only remove nodes if the victim function returns a true value", function(){
         var input = {
                "a":{
                    "par":{
                        "match":1,
                        "targ":{
                            "victim":[
                                {"a":1, "match":2},
                                {"a":2, "match":1}
                            ],
                            "other":{"a":1}
                        },
                        "data":{
                            "max":0
                        }
                    }
                }
            };

            var expected = {
                "a":{ "par":{
                        "match":1,
                        "targ":{
                            "victim":[
                                {"a":1, "match":2}
                            ],
                            "other":{"a":1}
                        },
                        "data":{ "max":0 }
                    }
                }
            };

            var comparator = function(parent, victim){ return parent.match == victim.match };
            var selector = function(dataNode){return dataNode.max == 0;}; 
            
            var actual = tree.decompose(input).chopNodesByData("data", "targ", "victim", selector, comparator).compose();

            expect(actual).to.deep.equal(expected);

        });
    });
});

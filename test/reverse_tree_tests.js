var expect = require('chai').expect;

var tree = require("../tree-surgeon.js");

describe("Reverse tree of relations", function() {
    it("should reverse the hierarchy of nodes", function(){
        var input = {
            "first":{
                "o":1,
                "child":{
                    "o":2,
                    "child":{
                        "o":3,
                        "child":{
                            "o":4,
                        }
                    }
                }
            }
        };
        var expected = {
            "first":{
                "o":4,
                "child":{
                    "o":3,
                    "child":{
                        "o":2,
                        "child":{
                            "o":1,
                        }
                    }
                }
            }
        };

        var result = tree.decompose(input).reverseTree("child").compose();

        expect(result).to.deep.equal(expected);
    });
});

var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Chaining of calls", function() {
    it("should have compose call available on decomposed object", function() {
        var original = {
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
 
        var result = tree.decompose(original).compose();

        expect(result).to.deep.equal(original);
        expect(result == original).to.be.false;
    });
});

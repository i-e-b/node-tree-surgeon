var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Editing children by kind and filter function", function() {
    it("should modify selected children but no other nodes", function(){
        var input = {
            "no":{"A":"B"},
            "yes":{"A":"C"},
            "neither":{"A":"D"}
        };
        var expected = {
            "no":{"A":"B"},
            "yes":{"A":"C", "Found":"C"},
            "neither":{"A":"D"}
        };

        var result = tree.compose(
            tree.editByKind("yes", function(n){n["Found"] = n["A"]; return n;},
                tree.decompose(input)));

        expect(result).to.deep.equal(expected);
    });
});

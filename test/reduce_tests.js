var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Reducing collections to values", function() {
    it("should reduce array of objects to array of values", function(){
        var input = {
            "keep":{
                "values":[
                    {"Value":"one", x:1},   // note that keys and unselected values
                    {"Value":"two", y:2},   // are not present in the output
                    {"Value":"three", z:{"sub":"tree"}} // neither are subtrees
                ],
                "other":"still here" // peers of the selected node remain
            }
        };
        var expected = {
            "keep":{
                "values":["one","two","three"],
                "other":"still here"
            }
        };

        var result = tree.compose(
            tree.reduce("values", "Value",
                tree.decompose(input)));

        expect(result).to.deep.equal(expected);
    });
});

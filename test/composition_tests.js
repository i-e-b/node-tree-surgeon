var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Tree composition from relational model", function() {
    it("should build a plain object tree from a relational model", function() {
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
        var expected = {
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
 
        var result = tree.compose(relational);

        expect(result).to.deep.equal(expected);
    });
});

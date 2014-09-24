var expect = require("chai").expect;
var tree = require("../tree-surgeon.js");

describe("Tree Surgeon", function() {
    it("should exist somehow", function(done){
        expect(typeof tree.test).to.equal("function");
        done();
    });

    it("should decompose an object tree into nodes and relations", function() {
        var sample = {
            "ID":"1",
            "simple":"value",       // not changed
            "subtree" : {           // becomes a relation of "Kind":"subtree"
                "ID":"2",
                "node":"2",         // not changed, but a different node from "simple":"value"
            }
        };

        var expected = {
            "Nodes":{
                "1":{
                    "ID":"1", "simple":"value"
                },
                "2":{
                    "ID":"2", "node":"2"
                }
            },
            "Relations":[
                {"Parent":"1", "Child":"2", "Kind":"subtree"}
            ]
        }

        var result = tree.decompose(sample);

        expect(result).to.deep.equal(expected);
    });
});

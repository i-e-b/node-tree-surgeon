var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Removing empty nodes", function() {
    it("should remove nodes which contains only null or undefined properties", function(){
        var input = {
            "empty":{
                "value":null,
                "another":null,
                "third":undefined
            },
            "notEmpty":{
                "empty":null,
                "notEmpty": 1
            }
        };
        var expected = {
            "notEmpty":{
                "empty":null,
                "notEmpty": 1
            }
        };

        var result = tree.compose(
            tree.removeEmptyNodes(
                tree.decompose(input)));

        expect(result).to.deep.equal(expected);
    });
    it("should not remove nodes which have non empty children", function(){
        var input = {
            "empty":{
                "empty":null,
                "child":{
                    "grandchild": {
                        "value":null
                    }
                }
            },
            "notEmpty":{
                "empty":null,
                "child":{
                    "grandchild": {
                        "value":1
                    }
                }
            }
        };
        var expected = {
            "notEmpty":{
                "empty":null,
                "child":{
                    "grandchild": {
                        "value":1
                    }
                }
            }
        };

        var result = tree.compose(
            tree.removeEmptyNodes(
                tree.decompose(input)));

        expect(result).to.deep.equal(expected);
    });

});

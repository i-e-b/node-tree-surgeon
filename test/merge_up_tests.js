var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Merging nodes into parents", function() {
    describe("When merging up by relationship kind", function() {
        it("should remove the child nodes of a relationship",function(){
            var input = {
                "I":"am the parent",
                "mergeTarget" : {
                    "here":"is the child"
                }
            };

            var expected = {
                "I":"am the parent",
                "here":"is the child"
            };

            var result =
                tree.compose(
                    tree.mergeUpByKind("mergeTarget",
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should retain the grandchildren of a relationship",function(){
            var input = {
                "I":"am the parent",
                "mergeTarget" : {
                    "here":"is the child",
                    "grandchild1":{
                        "with":"values"
                    },
                    "grandchild2":{
                        "with":"values"
                    }
                }
            };

            var expected = {
                "I":"am the parent",
                "here":"is the child",
                "grandchild1":{
                    "with":"values"
                },
                "grandchild2":{
                    "with":"values"
                }
            };

            var result =
                tree.compose(
                    tree.mergeUpByKind("mergeTarget",
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });
        it("should add values from the child to the parent");
        it("should apply merge recursively", function(){
            var input = {
                "m":{
                    "a":1,
                    "m": {
                        "b":2,
                            "m":{
                                "c":3
                            }
                    }
                }
            };
            var expected = {
                "a":1, "b":2, "c":3
            };

            var result =
                tree.compose(
                    tree.mergeUpByKind("m",
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);

        });
        it("should join conflicting values by creating an array on the parent");
        it("should concatenate arrays being merged");
        it("should not apply merge up to the root node");
    });
});

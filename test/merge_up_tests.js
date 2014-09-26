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
            var result = tree.compose( tree.mergeUpByKind("mergeTarget", tree.decompose(input)));

            expect(result.mergeTarget).to.not.exist;
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

        it("should add values from the child to the parent", function(){
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

        it("should join conflicting values by creating an array on the parent", function(){
            var input = {
                "a":1,
                "m":{
                    "a":2
                }
            };
            var expected = {
                "a":[1,2]
            };

            var result =
                tree.compose(
                    tree.mergeUpByKind("m",
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should concatenate arrays being merged", function(){
            var input = {
                "a":[1,2],
                "b":1,
                "c":[1,2],
                "m":{
                    "a":[3,4],
                    "b":[2,3],
                    "c":3
                }
            };
            var expected = {
                "a":[1,2,3,4],
                "b":[1,2,3],
                "c":[1,2,3]
            };

            var result =
                tree.compose(
                    tree.mergeUpByKind("m",
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);

        });

        it("should not apply merge up to the root node", function(){
            // no-op... no relation to merge.
        });
    });

    describe("When merging up by node predicate", function(){
        it("should remove the matched node",function(){
            var input = {
                "I":"am the parent",
                "mergeTarget" : {
                    "here":"is the child",
                    "target":"me"
                }
            };
            var predicate = function(n) { return n.target == "me"; };
            var result = tree.compose(tree.mergeUpByNode(predicate, tree.decompose(input)));

            expect(result.mergeTarget).to.not.exist;
        });
        it("should retain the children of a matched node");
        it("should add values of the matched node to its parent");
        it("should apply merge recursively");
        it("should join conflicting values by creating an array on the parent");
        it("should concatenate arrays being merged");
        it("should not remove root element even if it was matched");
    });
});

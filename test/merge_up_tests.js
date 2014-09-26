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

        it("should retain the children of a matched node",function(){
            var input = {
                "I":"am the parent",
                "whatever" : {
                    "target":"me",
                    "grandchild1":{
                        "with":"values"
                    },
                    "grandchild2":{}
                }
            };
            var predicate = function (n) {return n.target == "me";};
            var result =
                tree.compose(
                    tree.mergeUpByNode(predicate,
                        tree.decompose(input)));

            expect(result.grandchild1).to.exist;
            expect(result.grandchild2).to.exist;
        });

        it("should add values of the matched node to its parent", function(){
            var input = {
                "I":"am the parent",
                "whatever" : {
                    "target":"me",
                    "value":1,
                    "other":2
                }
            };

            var expected = {
                "I":"am the parent",
                "target":"me", // our predicate property is copied up
                "value":1,
                "other":2
            };
            var predicate = function (n) {return n.target == "me";};
            var result =
                tree.compose(
                    tree.mergeUpByNode(predicate,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);

        });

        it("should apply merge recursively, but not to parents who received predicated values", function(){
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

            var predicate = function (n) {return n.a || n.b || n.c;};
            var result =
                tree.compose(
                    tree.mergeUpByNode(predicate,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should join conflicting values by creating an array on the parent", function(){
            var input = {
                "m":{
                    "a":1,
                    "m": {
                        "a":2,
                        "m":{
                            "a":3
                        }
                    }
                }
            };
            var expected = { "a":[1,2,3] };

            var predicate = function (n) {return true;};
            var result =
                tree.compose(
                    tree.mergeUpByNode(predicate,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);

        });

        it("should concatenate arrays being merged", function(){
            var input = {
                "m":{
                    "a":[1,2],
                    "m": {
                        "a":3,
                        "m":{
                            "a":[4,5]
                        }
                    }
                }
            };
            var expected = {"a":[1,2,3,4,5]};

            var predicate = function (n) {return n.a;};
            var result =
                tree.compose(
                    tree.mergeUpByNode(predicate,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should not remove root element even if it was matched", function() {
            var input = {
                "hello":"world",
                "gone" : {
                    "keep":"me"
                }
            };
            var expected = {
                "hello":"world",
                "keep":"me"
            };

            var predicate = function (n) {return true;};
            var result =
                tree.compose(
                    tree.mergeUpByNode(predicate,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });
    });
});

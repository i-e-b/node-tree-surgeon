var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Fusing nodes into parents and children", function() {
    describe("When fusing a node by predicate", function(){
        it("should remove the selected nodes", function(){
            var input = {
                "keep":{
                    "gone":{
                        "target":"me",
                        "child":{}
                    }
                }
            };
            var filter = function(n){return n.target == "me";};
            var pickNothing = function(n){return null;};

            var result = tree.compose(
                tree.fuseByNode(filter, pickNothing, pickNothing,
                    tree.decompose(input)));

            expect(result.keep.gone).to.not.exist;
        });

        it("should retain the parent and child of the selected nodes", function(){
            var input = {
                "keep":{
                    "gone":{
                        "target":"me",
                        "child":{}
                    }
                }
            };
            var filter = function(n){return n.target == "me";};
            var pickNothing = function(n){return null;};

            var result = tree.compose(
                tree.fuseByNode(filter, pickNothing, pickNothing,
                    tree.decompose(input)));

            expect(result.keep).to.exist;
            expect(result.keep.child).to.exist;
        });

        it("should add values to child as selected by child-predicate", function(){
            var input = {
                "keep":{
                    "gone":{
                        "target":"me",
                        "pick":"this",
                        "child":{}
                    }
                }
            };
            var filter = function(n){return n.target == "me";};
            var pickForParent = function(n){return null;};
            var pickForChild = function(n){return {"pick":n.pick};};

            var result = tree.compose(
                tree.fuseByNode(filter, pickForParent, pickForChild,
                    tree.decompose(input)));

            expect(result.keep.child.pick).to.equal("this");
        });

        it("should ignore bare values picked by the child-predicate", function(){
            var input = {
                "keep":{
                    "gone":{
                        "target":"me",
                        "pick":"this",
                        "child":{}
                    }
                }
            };
            var filter = function(n){return n.target == "me";};
            var pickForParent = function(n){return null;};
            var pickForChild = function(n){return 5;}; // no key, so can't be added to object

            var expected = {
                "keep": {
                    "child": { }
                }
            };

            var result = tree.compose(
                tree.fuseByNode(filter, pickForParent, pickForChild,
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should add values to parent as selected by parent-predicate", function(){
            var input = {
                "keep":{
                    "gone":{
                        "target":"me",
                        "pick":"this",
                        "child":{}
                    }
                }
            };
            var filter = function(n){return n.target == "me";};
            var pickForParent = function(n){return {"pick":n.pick};};
            var pickForChild = function(n){return null;};

            var result = tree.compose(
                tree.fuseByNode(filter, pickForParent, pickForChild,
                    tree.decompose(input)));

            expect(result.keep.pick).to.equal("this");
        });

        it("should be apply values to both parents and children if both predicates select the same values", function(){
            var input = {
                "keep":{
                    "gone":{
                        "target":"me",
                        "child":{}
                    }
                }
            };
            var filter = function(n){return n.target == "me";};
            var pickForParent = function(n){return n;}; // we can just pick the whole node -- there is no hierarchy
            var pickForChild = function(n){return n;};
            var expected = {
                "keep": {
                    "target":"me",
                    "child": {
                        "target":"me"
                    }
                }
            };

            var result = tree.compose(
                tree.fuseByNode(filter, pickForParent, pickForChild,
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should apply the merge recursively, but not to nodes which received predicated values", function(){
            var input = {
                "gone":{
                    "target":"me",
                    "gone":{
                        "target":"me",
                        "child":{}
                    }
                }
            };
            var filter = function(n){return n.target == "me";};
            var pickForParent = function(n){return null;};
            var pickForChild = function(n){return {target:"me"};};
            var expected = {
                "child": {"target":"me"}
            };

            var result = tree.compose(
                tree.fuseByNode(filter, pickForParent, pickForChild,
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);

        });

        it("should join conflicting values by creating arrays, concatenating to existing array values");

        it("should not remove the root node even if matched", function(){
            var input = {
                "target":"me",
                "keep":{}
            };
            var filter = function(n){return n.target == "me";};
            var pickForParent = function(n){return n;}; // we can just pick the whole node -- there is no hierarchy
            var pickForChild = function(n){return n;};

            var result = tree.compose(
                tree.fuseByNode(filter, pickForParent, pickForChild,
                    tree.decompose(input)));

            expect(result).to.deep.equal(input);
        });

        it("should remove matched leaf nodes if no data is produced for children");
        it("should keep matched leaf nodes and child data if data is produced for children");
    });
});

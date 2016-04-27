var expect = require('chai').expect;

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

            var composed = tree.decompose(input).fuseByNode(filter, pickForParent, pickForChild).compose();

            expect(result).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
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

        it("should join conflicting values by creating arrays, concatenating to existing array values", function(){
            var input = {
                "a":[1,2],
                "gone":{
                    "a":3,
                    "target":"me",
                    "gone":{
                        "a":[4,5],
                        "target":"me",
                        "child":{
                            "a":6
                        }
                    }
                }
            };
            var filter = function(n){return n.target == "me";};
            var pickForParent = function(n){return n;};
            var pickForChild = function(n){return n;};
            var expected = {
                "a": [ 1, 2, 3, 3, 4, 5 ], // merging up *and* down is a bit tricky!
                // the second 'gone' had two when it merged to parent, which had one from the first gone:
                "target": [ "me", "me", "me" ],
                "child": {
                    "a": [ 3, 4, 5, 6 ],
                    "target": [ "me", "me" ]
                }
            };

            var result = tree.compose(
                tree.fuseByNode(filter, pickForParent, pickForChild,
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

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

        it("should remove matched leaf nodes if matched", function(){
            var input = {
                "gone":{"target":"me"}
            };
            var filter = function(n){return n.target == "me";};
            var pickNothing = function(n){return null;};
            var pickAll = function(n){return n;};

            var expected = {};

            var result = tree.compose(
                tree.fuseByNode(filter, pickNothing, pickAll,
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });
    });
    describe("When fusing a node by kind", function(){
        it("should remove the selected node, while retaining the parent and child", function(){
            var input = {
                "keep":{
                    "gone":{
                        "target":"me",
                        "child":{}
                    }
                }
            };
            var pickNothing = function(n){return null;};

            var result = tree.compose(
                tree.fuseByKind("gone", pickNothing, pickNothing,
                    tree.decompose(input)));

            expect(result.keep).to.exist;
            expect(result.keep.child).to.exist;

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
                tree.fuseByKind("gone", pickForParent, pickForChild,
                    tree.decompose(input)));

            var composed = tree.decompose(input).fuseByKind("gone", pickForParent, pickForChild).compose();

            expect(result).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
        });
        it("should be able compact arrays of objects into arrays of values", function(){
            var input = {
                "keep":{
                    "grouping":[
                        {"This":"1"},
                        {"This":"2"},
                        {"This":"3"}
                    ]
                }
            };
            var pickForParent = function(n){return n;};
            var pickForChild = function(n){return null};
            var expected = {
                "keep":{
                    "This":["1", "2", "3"]
                }
            };

            var result = tree.compose(
                tree.fuseByKind("grouping", pickForParent, pickForChild,
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });
        it("should be able to use where predicate kinds", function(){
            var input = {
                "keep":{
                    "grouping":[
                        {"This":"1"},
                        {"This":"2"},
                        {"This":"3"}
                    ]
                }
            };
            var pickForParent = function(n){return n;};
            var pickForChild = function(n){return null};
            var expected = {
                "keep":{
                    "This":["1", "3"],
                    "grouping": [{"This":"2"}]
                }
            };

            var dec = function(n){return {NotTwo: (n.This !== "2")};};
            var result = tree.compose(
                tree.fuseByKind({Kind:"grouping", NotTwo:true}, pickForParent, pickForChild,
                    tree.decompose(input, dec)));

            expect(result).to.deep.equal(expected);
        });

    });
});

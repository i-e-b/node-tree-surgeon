var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Merging nodes into children", function() {
    describe("When merging down by relationship kind", function() {
        it("should remove the parent nodes of a relationship", function(){
            var input = {
                "keep" : {
                    "lose" : {
                        "keep" : {
                        }
                    }
                }
            };
            var result = tree.compose(tree.mergeDownByKind("lose",
                    tree.decompose(input)));

            expect(result.keep.lose).to.not.exist;
        });

        it("should retain the child nodes of a relationship", function() {
            var input = {
                "keep" : {
                    "lose" : {
                        "keep" : {
                        }
                    }
                }
            };
            var result = tree.compose(tree.mergeDownByKind("lose",
                    tree.decompose(input)));

            expect(result.keep.keep).to.exist;
        });

        it("should add all values from the parent to all of its children", function(){
            var input = {
                "keep" : {
                    "a":1,
                    "lose" : {
                        "b":2,
                        "c":3,
                        "keep" : {
                            "d":4
                        }
                    }
                }
            };
            var expected = {
                "keep":{
                    "a":1,
                    "keep" :{
                        "b":2,
                        "c":3,
                        "d":4
                    }
                }
            };
            var result = tree.compose(tree.mergeDownByKind("lose",
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should apply the merge recursively", function(){
            var input = {
                "lose" : {
                    "a":1,
                    "lose" : {
                        "b":2,
                        "lose":{
                            "c":3,
                            "keep" : {
                                "d":4
                            }
                        }
                    }
                }
            };
            var expected = {
                "keep":{
                    "a":1,
                    "b":2,
                    "c":3,
                    "d":4
                }
            };
            var result = tree.compose(tree.mergeDownByKind("lose",
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should lose any nodes and data pushed off the end of a list of merges", function(){
            var input = {
                "lose" : {
                    "a":1,
                    "lose" : {
                        "b":2,
                        "lose":{
                            "c":3,
                            "lose" : {
                                "d":4
                            }
                        }
                    }
                }
            };
            var expected = { };

            var result = tree.compose(tree.mergeDownByKind("lose",
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should join conflicting values by creating arrays on the child elements which have conflicts", function(){
            var input = {
                "lose" : {
                    "a":1,
                    "lose" : {
                        "a":2,
                        "lose":{
                            "a":3,
                            "keep" : {
                                "a":4
                            }
                        }
                    }
                }
            };
            var expected = {
                "keep":{
                    "a":[1,2,3,4]
                }
            };
            var result = tree.compose(tree.mergeDownByKind("lose",
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });
        
        it("should concatenate arrays being merged", function(){
            var input = {
                "lose" : {
                    "a":[1,2],
                    "lose":{
                        "a":3,
                        "keep" : {
                            "a":[4,5]
                        }
                    }
                }
            };
            var expected = {
                "keep":{
                    "a":[1,2,3,4,5]
                }
            };
            var result = tree.compose(tree.mergeDownByKind("lose",
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });
    });

    describe("When merging down by node predicate",function(){
        it("should remove the matched nodes");
        it("should retain the children of matched nodes");
        it("should add all values from matched nodes to their children");
        it("should apply the merge recursively, but not to children who received predicated values");
        it("should join conflicting values by creating arrays on the child elements which have conflicts");
        it("should concatenate arrays being merged");
        it("should not remove the root node even if matched");
    });
});

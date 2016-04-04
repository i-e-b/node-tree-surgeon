var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Tree pruning", function() {
    describe("When pruning a relationship kind", function() {
        it("should remove relationships matching the given kind", function(){
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

            var expected = [
                {"Parent":"1", "Child":"4", "Kind":"another"},
                {"Parent":"2", "Child":"3", "Kind":"subsub"}
            ];

            var result = tree.prune("subtree", relational);

            expect(result.Relations).to.deep.equal(expected);
        });

        it("should be able to use where predicate kinds", function(){
            var input = {
                "X": {
                    "B":{
                        "C":{
                            "hello":"world"
                        }
                    }
                },
                "Y": {
                    "B":{
                        "Skip":true,
                        "C":{
                            "hello":"world"
                        }
                    }
                }
            };
            var expected = {
                "X": {},
                "Y": {
                    "B":{
                        "Skip":true,
                        "C":{
                            "hello":"world"
                        }
                    }
                }
            };

            var dec = function(n){return {"Skip": (n.Skip === true)};};
            var result = tree.compose(tree.prune({Kind:"B", Skip:false}, tree.decompose(input, dec)));

            expect(result).to.deep.equal(expected);
        });

        it("should compose into an object with the matched nodes removed", function(){
            var input = {
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
            var expected = {
                "ID":"1",
                "simple":"value",
                "another" : {
                    "ID":"4",
                    "what":"child of the root"
                }
            };

            var result = tree.compose(tree.prune("subtree", tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });
    });

    describe("When pruning after a relationship kind", function(){
        it("should remove all child relationships of all matching kinds", function(){
            var relational = {
                "Root":"1",
                "Nodes":{
                    "1":{
                        "ID":"1",
                    },
                    "2":{
                        "ID":"2"
                    },
                    "3":{
                        "ID":"3"
                    },
                    "4":{
                        "ID":"4"
                    }
                },
                "Relations":[
                    {"Parent":"1", "Child":"2", "Kind":"first"},
                    {"Parent":"2", "Child":"3", "Kind":"target"},
                    {"Parent":"3", "Child":"4", "Kind":"eliminated"}
                ]
            };

            var expected = [
                {"Parent":"1", "Child":"2", "Kind":"first"},
                {"Parent":"2", "Child":"3", "Kind":"target"}
            ];

            var result = tree.pruneAfter("target", relational);

            expect(result.Relations).to.deep.equal(expected);
        });

        it("should be able to use where predicate kinds", function(){
            var input = {
                "X": {
                    "B":{
                        "C":{
                            "hello":"world"
                        }
                    }
                },
                "Y": {
                    "B":{
                        "Skip":true,
                        "C":{
                            "hello":"world"
                        }
                    }
                }
            };
            var expected = {
                "X": {
                    "B":{}
                },
                "Y": {
                    "B":{
                        "Skip":true,
                        "C":{
                            "hello":"world"
                        }
                    }
                }
            };

            var dec = function(n){return {"Skip": (n.Skip === true)};};
            var result = tree.compose(tree.pruneAfter({Kind:"B", Skip:false}, tree.decompose(input, dec)));
            var composed = tree.decompose(input, dec).pruneAfter({Kind:"B", Skip:false}).compose();

            expect(result).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
        });

        it("should compose into an object with the matched nodes still present", function(){
            var input = {
                "A": {
                    "B":{
                        "C":{
                            "hello":"world"
                        }
                    }
                }
            };

            var result = tree.compose(tree.pruneAfter("B", tree.decompose(input)));

            expect(result.A.B).to.exist;
        });
        it("should compose into an object with no children on the matched nodes", function(){
            var input = {
                "A": {
                    "B":{
                        "C":{
                            "hello":"world"
                        }
                    }
                }
            };

            var result = tree.compose(tree.pruneAfter("B", tree.decompose(input)));

            expect(result.A.B.C).to.not.exist;
        });
    });

    describe("When pruning all but a set of relationship kinds", function() {
        it("should compose into an object with only the matching subtrees remaining", function(){
            var input = {
                "keep1":{
                    "keep2":{
                        "hello":"world"
                    },
                    "gone" : {
                        "goodbye":"world"
                    }
                },
                "keep2":{
                    "keep1":{
                        "alsoGone":{"bye":"bye"},
                        "keep3":{} // empty
                    }
                },
                "lost":{
                    "keep1": {"goodbye":"world"} // parent removed, so this is gone
                }
            };

            var result = tree.compose(
                tree.pruneAllBut(["keep1", "keep2", "keep3"],
                    tree.decompose(input)));

            var composed = tree.decompose(input).pruneAllBut(["keep1", "keep2", "keep3"]).compose();

            expect(result.keep1.keep2.hello).to.equal("world");
            expect(result.keep2.keep1.keep3).to.exist;

            expect(result.keep1.gone).to.not.exist;
            expect(result.keep2.keep1.alsoGone).to.not.exist;
            expect(result.lost).to.not.exist;

            expect(composed).to.deep.equal(result);
        });
    });
});

var expect = require('chai').expect;

var tree = require("../tree-surgeon.js");

describe("Chopping data out of a tree", function() {
    describe("When chopping nodes by id list", function(){
        it("should remove the nodes and their subtrees", function(){
            var input = {
                id:'r',
                'gone':{
                    id:'gone',
                    right:'yes',
                    'grandchild':[
                        { id:'g1' },
                        { id:'g2', "final":{id:'F'}},
                        { id:'g3'}
                    ]
                },
                'keep':{
                    id:'d',
                    right:'yes',
                    'grandchild':[
                        { id:'G1' },
                        { id:'going', "final":{id:'Fx'}},
                        { id:'G3'}
                    ]
                }
            };
            var expected = {
                id:'r',
                'keep':{
                    id:'d',
                    right:'yes',
                    'grandchild':[
                        { id:'G1'},
                        { id:'G3'}
                    ]
                }
            };

            var relational = tree.chopNodesByIds([1,7], tree.decompose(input));
            var actual = tree.compose(relational);

            var composed = tree.decompose(input).chopNodesByIds([1,7]).compose();

            expect(actual).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
        });
    });

    describe("When chopping matching data out of a tree", function() {
        it("should remove all relationships where a matching node is a child", function(){
            var input = {
                "Root": 0,
                "Nodes": [
                    {},
                    {
                        "match": "no"
                    },
                    {
                        "match": "yes"
                    },
                    {
                        "match": "yes"
                    }
                ],
                "Relations": [
                    { "Parent": 0, "Child": 1, "Kind": "keep" },
                    { "Parent": 0, "Child": 2, "Kind": "gone" },
                    { "Parent": 1, "Child": 3, "Kind": "goneChild" }
                ]
            };


            var expected = {
                "Root": 0,
                "Nodes": [
                    {},
                    {
                        "match": "no"
                    }
                ],
                "Relations": [
                    { "Parent": 0, "Child": 1, "Kind": "keep" }
                ]
            }
            var filter = function(n) { return n.match == "yes"; }

            var result = tree.chop(filter, input);

            expect(result).to.deep.equal(expected);
         });

        it("should compose to a tree with the matching nodes and their children removed", function(){
            var input = {
                "keep" : {
                    "match":"no",
                    "goneChild":{
                        "match":"yes"
                    }
                },
                "gone":{
                    "match":"yes"
                }
            };
            var filter = function(n) { return n.match == "yes"; }

            var expected = {
                "keep":{
                    "match":"no"
                }
            };

            var result = 
                tree.compose(
                    tree.chop(filter,
                        tree.decompose(input)));
            var composed = tree.decompose(input).chop(filter).compose();

            expect(result).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
        });

        it("should be able to chop root node, resulting in empty object", function(){
            var input = {
                "thing" : {
                    "match":"no",
                    "goneChild":{
                        "match":"yes"
                    }
                },
                "match":"yes"
            };
            var filter = function(n) { return n.match == "yes"; }

            var expected = {};

            var result =
                tree.compose(
                    tree.chop(filter,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should leave non-matching nodes in place, even if they have the same relationship kind", function(){
            var input = {
                "rel" : {
                    "rel":{
                        "remove":"me"
                    },
                    "but":"not me"
                }
            };
            var expected = {
                "rel" : {
                    "but":"not me"
                }
            };

            var filter = function(n) { return n.remove == "me"; }
            var result = tree.compose(tree.chop(filter, tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should chop members of an array independently", function(){
            var input = {
                "children" : [
                    {"hello":"world"},
                    {"goodbye":"world", "remove":"me"},
                    {"where":"is waldo"},
                    {"sayonara":"sekai", "remove":"me"}
                ]
            };
            var expected = {
                "children" : [
                    {"hello":"world"},
                    {"where":"is waldo"}
                ]
            };

            var filter = function(n) { return n.remove == "me"; }
            var result = tree.compose(tree.chop(filter, tree.decompose(input)));
            expect(result).to.deep.equal(expected);
        });
    });

    describe("When chopping after matching data in a tree", function(){
        it("should remove all relationships where a matching node is a parent", function(){
            var input = {
                "Root": 0,
                "Nodes": [
                    {},
                    {
                        "match": "yes"
                    },
                    {
                        "match": "yes"
                    },
                    {
                        "match": "no"
                    }
                ],
                "Relations": [
                    { "Parent": 0, "Child": 1, "Kind": "matched_keep" },
                    { "Parent": 0, "Child": 2, "Kind": "matched_keep" },
                    { "Parent": 1, "Child": 3, "Kind": "no_matched_gone" }
                ]
            };


            var expected = {
                "Root": 0,
                "Nodes": [
                    {},
                    {
                        "match": "yes"
                    },
                    {
                        "match": "yes"
                    }
                ],
                "Relations": [
                    { "Parent": 0, "Child": 1, "Kind": "matched_keep" },
                    { "Parent": 0, "Child": 2, "Kind": "matched_keep" }
                ]
            };

            var filter = function(n) { return n.match == "yes"; };

            var result = tree.chopAfter(filter, input);
            expect(result).to.deep.equal(expected);
        });

        it("should compose to a tree where matching nodes exist but have no children", function(){
            var input = {
                "matched_keep" : {
                    "match":"me",
                    "unmatched_gone": {
                        "not":"me"
                    }
                }
            };
            var filter = function(n){return n.match == "me";};
            var expected = {
                "matched_keep":{
                    "match":"me"
                }
            };

            var result =
                tree.compose(
                    tree.chopAfter(filter,
                        tree.decompose(input)));
            var composed = tree.decompose(input).chopAfter(filter).compose();

            expect(result).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
        });

        it("should be able to chop after root", function(){
            var input = {
                "match":"me",
                "unmatched_gone" : {
                    "unmatched_gone": {
                        "not":"me"
                    }
                }
            };
            var filter = function(n){return n.match == "me";};
            var expected = {
                "match":"me"
            };

            var result =
                tree.compose(
                    tree.chopAfter(filter,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });

        it("should leave non-matching nodes in place", function(){
            var invariant = {
                "a":{
                    "b":"c",
                    "d":[1,2,3]
                },
                "x" : [
                    {"a":1},
                    {"b":2}
                ]
            };
            var filter = function(n){return false;};

            var result =
                tree.compose(
                    tree.chopAfter(filter,
                        tree.decompose(invariant)));

            expect(result).to.deep.equal(invariant);

        });

        it("should chop members of an array independently", function(){
            var input = {
                "arr":[
                    {"jim":"hawkins", "alive":{"value":true}},
                    {"john":"silver", "alive":{"value":true}},
                    {"other":"muntineers", "killed":"or marooned", "alive":{"value":true}}
                ]
            };
            var filter = function(n){return n.killed == "or marooned";};
            var expected= {
                "arr":[
                    {"jim":"hawkins", "alive":{"value":true}},
                    {"john":"silver", "alive":{"value":true}},
                    {"other":"muntineers", "killed":"or marooned"}
                ]
            };

            var result =
                tree.compose(
                    tree.chopAfter(filter,
                        tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });
    });

    describe("When chopping data of a Kind out of a tree", function() {
        it("should compose to a tree with the matching nodes and their children removed", function(){
            var input = {
                "toKeep" : {
                    "hello" : "world",
                    "toChop" : {
                        "goodbye" : "Vienna",
                        "match" : "yes"
                    },
                    "child" : {
                        "hello" : "there",
                        "toChop" : {
                            "goodbye" : "Cruel World",
                            "match" : " no"
                        }
                    }
                },
                "toChop":{
                    "match" : "yes",
                    "child" : {
                        "hello": "again",
                        "toChop" : {
                            "goodbye" : "no just farewell",
                            "match" : " no"
                        }
                    }
                }
            };
            var filter = function(n) { return (n.match === 'yes'); };

            var expected = {
                "toKeep" : {
                    "hello" : "world",
                    "child" : {
                        "hello" : "there",
                        "toChop" : {
                            "goodbye" : "Cruel World",
                            "match" : " no"
                        }
                    }
                }
            };

            var result =
                tree.compose(
                    tree.chopByKind('toChop', filter,
                        tree.decompose(input)));
            var composed = tree.decompose(input).chopByKind('toChop', filter).compose();

            expect(result).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
        });

        it("should chop members of an array independently", function(){
            var input = {
                "children" : [
                    {"hello":"world"},
                    {"goodbye":"world", "match":"yes"},
                    {"where":"is waldo", "match":"no"},
                    {"sayonara":"sekai", "match":"yes" }
                ]
            };
            var expected = {
                "children" : [
                    {"hello":"world"},
                    {"where":"is waldo", "match": "no"}
                ]
            };

            var filter = function(n) { return n.match === 'yes'; };
            var result = tree.compose(
                            tree.chopByKind('children', filter,
                                tree.decompose(input)));
            expect(result).to.deep.equal(expected);
        });
    });

    describe("When chopping by meta information in a relationship", function(){
        it("should remove only subtrees that match all parts of the filter", function(){
            var input = {
                "one":[{"lop":true},
                       {"lop": false}],
                "three":{"lop": true}
            };
            var relationDecorator = function(node){return { "metaValue": node.lop };};
            var relational = tree.decompose(input, relationDecorator);
            var always = function(n){return true;};

            var expected = {
                "one":[{"lop":false}],
                "three":{"lop":true}
            };

            var result = tree.compose(tree.chopByKind({"Kind":"one", "metaValue":true}, always, relational));

            expect(result).to.deep.equal(expected);
        });
    });

    describe("When chopping Childless nodes out of a tree", function() {
        it("should compose to a tree with the matching childless nodes removed", function() {
            var input = {
                "toKeep" : {
                    "hello" : "world",
                    "childlessChop" : {
                        "goodbye" : "Vienna",
                        "match" : "yes"
                    },
                    "child" : {
                        "hello" : "there",
                        "childlessKeep" : {
                            "goodbye" : "Cruel World",
                            "match" : "no"
                        }
                    }
                },
                "toStow":{
                    "match" : "yes",
                    "child" : {
                        "hello": "again",
                        "childlessChop" : {
                            "goodbye" : "no just farewell",
                            "match" : "yes"
                        },
                        "childlessKeep" : {
                            "goodbye" : "no just farewell",
                            "match" : "no"
                        }
                    }
                }
            };
            var expected = {
                "toKeep" : {
                    "hello" : "world",
                    "child" : {
                        "hello" : "there",
                        "childlessKeep" : {
                            "goodbye" : "Cruel World",
                            "match" : "no"
                        }
                    }
                },
                "toStow":{
                    "match" : "yes",
                    "child" : {
                        "hello": "again",
                        "childlessKeep" : {
                            "goodbye" : "no just farewell",
                            "match" : "no"
                        }
                    }
                }
            };

            var filter = function(n) { return (n.match === 'yes'); };

            var result =
                tree.compose(
                    tree.chopChildless(filter,
                        tree.decompose(input)));

            var composed = tree.decompose(input).chopChildless(filter).compose();

            expect(result).to.deep.equal(expected);
            expect(composed).to.deep.equal(expected);
        });

        it("should chop members of an array independently", function() {
            var input = {
                "children" : [
                    {"hello":"world"},
                    {"goodbye":"world", "match":"yes"},
                    {"where":"is waldo", "match":"no"},
                    {"sayonara":"sekai", "match":"yes" }
                ]
            };
            var expected = {
                "children" : [
                    {"hello":"world"},
                    {"where":"is waldo", "match":"no"}
                ]
            };

            var filter = function(n) { return (n.match === 'yes'); };

            var result =
                tree.compose(
                    tree.chopChildless(filter,
                        tree.decompose(input)));
            expect(result).to.deep.equal(expected);
        });
    });
});

var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Chopping data out of a tree", function() {
    describe("When chopping matching data out of a tree", function() {
        it("should remove all relationships where a matching node is a child", function(){
            var input = {
                "Root": "id_0",
                "Nodes": {
                        "id_0": {},
                    "id_1": {
                        "match": "no"
                    },
                    "id_2": {
                        "match": "yes"
                    },
                    "id_3": {
                        "match": "yes"
                    }
                },
                "Relations": [
                    { "Parent": "id_0", "Child": "id_1", "Kind": "keep" },
                    { "Parent": "id_0", "Child": "id_2", "Kind": "gone" },
                    { "Parent": "id_1", "Child": "id_3", "Kind": "goneChild" }
                ]
            };


            var expected = {
                "Root": "id_0",
                "Nodes": {
                    "id_0": {},
                    "id_1": {
                        "match": "no"
                    }
                },
                "Relations": [
                    { "Parent": "id_0", "Child": "id_1", "Kind": "keep" }
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

            expect(result).to.deep.equal(expected);
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
                "Root": "id_0",
                "Nodes": {
                    "id_0": {},
                    "id_1": {
                        "match": "yes"
                    },
                    "id_2": {
                        "match": "yes"
                    },
                    "id_3": {
                        "match": "no"
                    }
                },
                "Relations": [
                    { "Parent": "id_0", "Child": "id_1", "Kind": "matched_keep" },
                    { "Parent": "id_0", "Child": "id_2", "Kind": "matched_keep" },
                    { "Parent": "id_1", "Child": "id_3", "Kind": "no_matched_gone" }
                ]
            };


            var expected = {
                "Root": "id_0",
                "Nodes": {
                    "id_0": {},
                    "id_1": {
                        "match": "yes"
                    },
                    "id_2": {
                        "match": "yes"
                    }
                },
                "Relations": [
                    { "Parent": "id_0", "Child": "id_1", "Kind": "matched_keep" },
                    { "Parent": "id_0", "Child": "id_2", "Kind": "matched_keep" }
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

            expect(result).to.deep.equal(expected);
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
});

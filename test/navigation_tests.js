var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Navigating relational structure", function(){
    describe("When getting the child IDs of a node by ID", function(){
        it("should give an array with all the child node IDs", function(){
            var input = {
                "array" : [{a:1},{b:2}],
                "norm1" : {c:3},
                "norm2" : {d:4}
            };
            var relational = tree.decompose(input);

            var actual = tree.getChildrenOf(relational.Root, relational);

            expect(actual.length).to.equal(4);
            expect(actual).to.deep.equal(["id_1","id_2","id_3","id_4"]);
        });
        it("should give an array with a single item when only one child", function(){
            var input = {
                "onlyChild" : {a:1}
            };
            var relational = tree.decompose(input);

            var actual = tree.getChildrenOf(relational.Root, relational);

            expect(actual.length).to.equal(1);
            expect(actual).to.deep.equal(["id_1"]);
        });
        it("should give an empty array when passed a leaf node ID", function(){
            var input = {
                "onlyChild" : {a:1}
            };
            var relational = tree.decompose(input);

            var actual = tree.getChildrenOf("id_1", relational);

            expect(actual.length).to.equal(0);
            expect(actual).to.deep.equal([]);
        });
        it("should give an empty array when passed an ID not in the relational structure", function(){
            var input = {
                "onlyChild" : {a:1}
            };
            var relational = tree.decompose(input);

            var actual = tree.getChildrenOf("1 + log₂n", relational);

            expect(actual.length).to.equal(0);
            expect(actual).to.deep.equal([]);
        });

    });
    describe("When getting the parent ID of a node by ID", function(){
        it("should give a single id where there is a parent", function(){
            var input = {
                "kind" : {
                    "right":"yes"
                }
            };
            var relational = tree.decompose(input);
            var childId = Object.keys(relational.Nodes).filter(function(k){return k !== relational.Root;})[0];

            var actual = tree.parentIdOf(childId, relational);

            expect(actual).to.equal(relational.Root);
        });
        it("should give `null` where the given ID is for the root node", function(){
            var input = {
                "kind" : {
                    "right":"yes"
                }
            };
            var relational = tree.decompose(input);

            var actual = tree.parentIdOf(relational.Root, relational);

            expect(actual).to.equal(null);
        });
        it("should give `null` where the given ID is not in the relational structure", function(){
            var input = {};
            var relational = tree.decompose(input);

            var actual = tree.parentIdOf("myleftfoot", relational);

            expect(actual).to.equal(null);
        });
    });
});


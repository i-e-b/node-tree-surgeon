var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Navigating relational structure", function(){
    describe("When reading the path for a node by ID", function(){
        it("should give the full path as an array", function(){
            var input = {
                id:'r',
                'child':{
                    id:'c',
                    right:'yes',
                    'grandchild':[
                        { id:'g1' },
                        { id:'g2', "final":{id:'F'}},
                        { id:'g3'}
                    ]
                }
            };
            var relational = tree.decomposeWithIds(input, function(n){return n.id;});

            var actual = tree.getPathOf('F', relational);
            expect(actual).to.deep.equal(['child','grandchild','final']);
        });
        it("should give an empty array if node is not present", function(){
            var input = {};
            var relational = tree.decompose(input);

            var actual = tree.getPathOf('z', relational);
            expect(actual).to.deep.equal([]);
        });
        it("should give an empty array if root node path is given", function(){
            var input = {
                id:'r',
                'child':{
                    id:'c'
                }
            };
            var relational = tree.decomposeWithIds(input, function(n){return n.id;});

            var actual = tree.getPathOf('r', relational);
            expect(actual).to.deep.equal([]);
        });
    });
    describe("When getting the data for a given node by ID", function(){
        it("should give the correct node data", function(){
            var input = {
                id:'r',
                'child':{
                    id:'c',
                    right:'yes',
                    'grandchild':{
                        id:'g'
                    }
                }
            };
            var relational = tree.decomposeWithIds(input, function(n){return n.id;});

            var actual = tree.getNode('c', relational);
            expect(actual.right).to.equal('yes');
        });
        it("should give undefined for bad data", function(){
            expect(tree.getNode('x', null)).to.be.undefined;
        });
    });
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

    describe("When getting the child IDs of children of s specific Kind given the parent ID", function() {
        it("should give an empty array when passed an ID not in the relational structure", function(){
            var input = {
                "onlyChild" : {a:1}
            };
            var relational = tree.decompose(input);

            var actual = tree.getChildrenByKindOf('ParentDoesntExist', 'nice', relational);

            expect(actual.length).to.equal(0);
            expect(actual).to.deep.equal([]);
        });
        it("should return an empty array if child Kind does not exists for parent", function() {
            var input = {
                'NotThis' : { 'name': 'no-one', 'match': 'no' },
                'OnlyThis': { 'name': 'someone', 'match': 'yes' }
            };

            var relational = tree.decompose(input);
            var actual = tree.getChildrenByKindOf(relational.Root, 'SomethingElse', relational);

            expect(actual.length).to.equal(0);
            expect(actual).to.deep.equal([]);
        });
        it("should return an array of a single child for a child object", function() {
            var input = {
                'NotThis' : { 'name': 'no-one', 'match': 'no' },
                'OnlyThis': { 'name': 'someone', 'match': 'yes' }
            };
            var expected = ['someone'].sort();

            var relational = tree.decompose(input);
            var actualIds = tree.getChildrenByKindOf(relational.Root, 'OnlyThis', relational);
            var actual = [];
            actualIds.forEach(function(id) {
                var node = tree.getNode(id, relational);
                actual.push(node.name);
            });

            expect(actual.length).to.equal(1);
            expect(actual.sort()).to.deep.equal(expected);
        });
        it("should return an array of children for an array object", function() {
            var input = {
                'OnlyThis': [
                    { 'name': 'someone', 'match': 'yes' },
                    { 'name': 'somewhere', 'match': 'yes' },
                    { 'name': 'elsewhere', 'match': 'yes' },
                ]
            };
            var expected = ['someone', 'somewhere', 'elsewhere'].sort();

            var relational = tree.decompose(input);
            var actualIds = tree.getChildrenByKindOf(relational.Root, 'OnlyThis', relational);
            var actual = [];
            actualIds.forEach(function(id) {
                var node = tree.getNode(id, relational);
                actual.push(node.name);
            });

            expect(actual.length).to.equal(3);
            expect(actual.sort()).to.deep.equal(expected);
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


var expect = require('chai').expect;

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

            var actual = tree.getPathOf(5, tree.decompose(input));
            var composed = tree.decompose(input).getPathOf(5);

            expect(actual).to.deep.equal(['child','grandchild','final']);
            expect(composed).to.deep.equal(actual);
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
            var relational = tree.decompose(input);

            var actual = tree.getPathOf(0, relational);
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

            var actual = tree.getNode(1, tree.decompose(input));
            var composed = tree.decompose(input).getNode(1);

            expect(actual.right).to.equal('yes');
            expect(composed).to.deep.equal(actual);
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

            var actual = tree.getChildrenOf(0, tree.decompose(input));
            var composed = tree.decompose(input).getChildrenOf(0);

            expect(actual.length).to.equal(4);
            expect(actual).to.deep.equal([1,2,3,4]);
            expect(composed).to.deep.equal(actual);
        });
        it("should give an array with a single item when only one child", function(){
            var input = {
                "onlyChild" : {a:1}
            };
            var relational = tree.decompose(input);

            var actual = tree.getChildrenOf(relational.Root, relational);

            expect(actual.length).to.equal(1);
            expect(actual).to.deep.equal([1]);
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

    describe("When getting the child IDs of children of a specific Kind given the parent ID", function() {
        it("should give an empty array when passed an ID not in the relational structure", function(){
            var input = {
                "onlyChild" : {a:1}
            };

            var actual = tree.getChildrenByKindOf('ParentDoesntExist', 'nice', tree.decompose(input));

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
            var actualIds = relational.getChildrenByKindOf(0, 'OnlyThis');

            var actual = [];
            actualIds.forEach(function(id) {
                var node = tree.getNode(id, relational);
                actual.push(node.name);
            });

            expect(actual.length).to.equal(3);
            expect(actual.sort()).to.deep.equal(expected);
        });
        it("should use a predicate to filter child items if provided", function() {
            var input = {
                'OnlyThis': [
                    { 'name': 'someone', 'match': 'no' },
                    { 'name': 'somewhere', 'match': 'yes' },
                    { 'name': 'elsewhere', 'match': 'no' },
                ]
            };

            var expected = ['somewhere'].sort();

            var dec = function (n) {return {skip:(n.match == 'no')};};
            var relational = tree.decompose(input, dec);
            var actualIds = tree.getChildrenByKindOf(relational.Root, {Kind:'OnlyThis', skip:false}, relational);
            var actual = [];
            actualIds.forEach(function(id) {
                var node = tree.getNode(id, relational);
                actual.push(node.name);
            });

            expect(actual.length).to.equal(1);
            expect(actual.sort()).to.deep.equal(expected);
        });
        it("should accept a predicate function to filter child items",function(){
            var input = {
                'NotThis' : { 'name': 'no-one', 'match': 'no' },
                'OnlyThis': { 'name': 'someone', 'match': 'yes' }
            };
            var expected = ['someone'].sort();

            var predicate = function(rel) { return rel.Kind === 'OnlyThis'; };

            var relational = tree.decompose(input);
            var actualIds = tree.getChildrenByKindOf(relational.Root, predicate, relational);
            var actual = [];
            actualIds.forEach(function(id) {
                var node = tree.getNode(id, relational);
                actual.push(node.name);
            });

            expect(actual.length).to.equal(1);
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
            var actual = relational.parentIdOf(1, relational);

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


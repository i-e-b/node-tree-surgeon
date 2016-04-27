var expect = require('chai').expect;

var tree = require("../tree-surgeon.js");

describe("Reversing a relation, child should end up parent in a tree", function() {
    var decoratorFunc = function(childNode, childKind, parentNode) {
        if (childNode.swap) {
            return {
                reverseThis: true,
                groupById: childNode.charId
            };
        } else {
            return {};
        }
    };
    var groupByFunc = function(r) {return r.groupById; };
    var filterFunc = function(r) { return r.reverseThis; };

    it("should have the selected children as the new parent and each of the selected parents as new children", function(){
        var input = {
            use : {
                name: 'ParentUse',
                value : [
                    {
                        valueId : 1,
                        char: {
                            charId: 'Char01',
                            name: 'Characteristic 01',
                            swap: true
                        },
                        name: 'value 1',
                        detail: { name: 'detail1', checked: true }
                    },
                    {
                        valueId : 2,
                        char: {
                            charId: 'Char01',
                            name: 'Characteristic 01',
                            swap: true
                        },
                        name: 'value 2',
                        detail: { name: 'detail2', checked: true }
                    },
                    {
                        valueId : 3,
                        char: {
                            charId: 'Char02',
                            name: 'Characteristic 02',
                            swap: true
                        },
                        name: 'value 3',
                        detail: { name: 'detail3', checked: true }
                    }
                ]
            }
        };

        var expected = {
            use : {
                name: 'ParentUse',
                char: [
                    {
                        charId: 'Char01',
                        name: 'Characteristic 01',
                        swap: true,
                        value: [
                            {
                                valueId : 1,
                                name: 'value 1',
                                detail: { name: 'detail1', checked: true }
                            },
                            {
                                valueId : 2,
                                name: 'value 2',
                                detail: { name: 'detail2', checked: true }
                            }
                        ]
                    },
                    {
                        charId: 'Char02',
                        name: 'Characteristic 02',
                        swap: true,
                        value: [
                            {
                                valueId : 3,
                                name: 'value 3',
                                detail: { name: 'detail3', checked: true }
                            }
                        ]
                    }
                ]
            }
        };
        var relational = tree.decompose(input, decoratorFunc);
        relational = tree.reverseByRelation(filterFunc, groupByFunc, relational)
        var result = tree.compose(relational);


        var compositionResult = tree.decompose(input, decoratorFunc).reverseByRelation(filterFunc, groupByFunc).compose();

        expect(result).to.deep.equal(expected);            // correct result
        expect(compositionResult).to.deep.equal(result);   // composed version is the same
    });
});

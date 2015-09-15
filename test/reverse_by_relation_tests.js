var expect = require('chai').expect;
var _ = require('lodash');

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
    //it("should not change structure if there is not a single matching child under a parent to be flipped", function(){
    //    var input = {
    //        a:{
    //            b:{
    //                c:[
    //                    {"I":"could be a parent"},
    //                    {"Me":"too!"}
    //                ]
    //            }
    //        }
    //    };
    //
    //    var result = tree.compose(tree.reverseByRelation("b", "c", null, tree.decompose(input)));
    //
    //    expect(result).to.deep.equal(input);
    //});
    //it("should not change structure unless both side of the flip are present", function(){
    //    var input = {
    //        a : {
    //            b : [
    //                {
    //                    key : 1,
    //                    "I":"should stay put"
    //                },
    //                {
    //                    key : 2,
    //                    c : { "parent": "a" }
    //                }
    //            ]
    //        },
    //        z : {
    //            c: {"I":"should stay put"}
    //        }
    //    };
    //
    //    var expected = {
    //        a : {
    //            b : [{
    //                key : 1,
    //                "I":"should stay put"
    //            }],
    //            c : {
    //                "parent":"a",
    //                b : {
    //                    key : 2,
    //                }
    //            }
    //        },
    //        z : {
    //            c : {"I":"should stay put"}
    //        }
    //    };
    //
    //    var result = tree.compose(tree.reverseByRelation("b", "c", null, tree.decompose(input)));
    //
    //    expect(result).to.deep.equal(expected);
    //});
    //it("should group new children by parent equality match", function(){
    //    var input = {
    //        a : {
    //            b : [
    //                {
    //                    key : 1,
    //                    c : { "parent": "a" }
    //                },
    //                {
    //                    key : 2,
    //                    c : { "parent": "a" }
    //                },
    //                {
    //                    key : 3,
    //                    c : { "parent": "b" }
    //                },
    //                {
    //                    key : 4,
    //                    c : { "parent": "b" }
    //                }
    //            ]
    //        }
    //    };
    //
    //    var expected = {
    //        a : {
    //            c :
    //            [
    //                {
    //                    "parent":"a",
    //                    b :
    //                    [
    //                        {
    //                            key : 1,
    //                        },
    //                        {
    //                            key : 2,
    //                        }
    //                    ]
    //                },
    //                {
    //                    "parent":"b",
    //                    b :
    //                    [
    //                        {
    //                            key : 3,
    //                        },
    //                        {
    //                            key : 4,
    //                        }
    //                    ]
    //                },
    //            ]
    //        }
    //    };
    //
    //    var selector = function(n) {return n.parent;};
    //    var result = tree.compose(tree.reverseByRelation("b", "c", selector, tree.decompose(input)));
    //
    //    expect(result).to.deep.equal(expected);
    //});
    //
    //it("should select flip targets by where predicate kinds", function(){
    //    var input = {
    //        a : {
    //            b : [
    //                {
    //                    key : 1,
    //                    c : { "parent": "a" }
    //                },
    //                {
    //                    key : 2,
    //                    c : { "parent": "a" }
    //                },
    //                {
    //                    key : 3,
    //                    c : { "parent": "a" }
    //                },
    //                {
    //                    key : 4,
    //                    c : { "parent": "a" }
    //                }
    //            ]
    //        }
    //    };
    //
    //    var expected = {
    //        "a": {
    //            "b": [
    //                {
    //                    "c": {
    //                        "parent": "a"
    //                    },
    //                    "key": 3
    //                },
    //                {
    //                    "c": {
    //                        "parent": "a"
    //                    },
    //                    "key": 4
    //                }
    //            ],
    //            "c": {
    //                "b": [
    //                    {
    //                        "key": 1
    //                    },
    //                    {
    //                        "key": 2
    //                    }
    //                ],
    //                "parent": "a"
    //            }
    //        }
    //    };
    //
    //
    //    var decorator = function(n) {return {skip:(n.key > 2)};};
    //    var equality = function(n) {return n.key;};
    //
    //    var result = tree.compose(tree.reverseByRelation({Kind:"b", skip:false}, "c", equality, tree.decompose(input, decorator)));
    //
    //    expect(result).to.deep.equal(expected);
    //});
    //
    //it("should ignore where predicate kinds on new parent kind", function(){
    //    var input = {
    //        a : {
    //            b : [
    //                {
    //                    key : 1,
    //                    c : { "parent": "a" }
    //                },
    //                {
    //                    key : 2,
    //                    c : { "parent": "a" }
    //                },
    //                {
    //                    key : 3,
    //                    c : { "parent": "a" }
    //                },
    //                {
    //                    key : 4,
    //                    c : { "parent": "a" }
    //                }
    //            ]
    //        }
    //    };
    //
    //    var expected = {
    //        "a": {
    //            "c": {
    //                "b": [
    //                    { "key": 1 }, { "key": 2 }, { "key": 3 }, { "key": 4 }
    //                ],
    //                "parent": "a"
    //            }
    //        }
    //    };
    //
    //    var decorator = function(n) {return {skip:true};};
    //    var equality = function(n) {return n.key;};
    //
    //    var result = tree.compose(tree.reverseByRelation("b",{Kind:"c", skip:false}, equality, tree.decompose(input, decorator)));
    //
    //    expect(result).to.deep.equal(expected);
    //});
});

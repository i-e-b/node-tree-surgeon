var chai = require('chai');
var expect = chai.expect;

var tree = require("../tree-surgeon.js");

// clean up objects to make testing easier
function noFunctions(obj){
    for (var m in obj) if (typeof obj[m] == "function") { delete obj[m]; }
    return obj;
}

describe("Normalising relational structure", function() {
    describe("When chopping nodes then normalising", function(){
        it("should remove the redundant nodes and relations", function(){
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
                "Root": 0,
                "Nodes": [
                    {//keep
                        "id": "r"
                    }, ,
                    {//keep
                        "id": "d",
                        "right": "yes"
                    }, , , ,
                    {//keep
                        "id": "G1"
                    }, ,
                    {//keep
                        "id": "G3"
                    }, ,
                ],
                "Relations": [
                    {
                        "Parent": 0,
                        "Child": 2,
                        "Kind": "keep",
                        "IsArray": false
                    }, , , ,
                    {
                        "Parent": 2,
                        "Child": 6,
                        "Kind": "grandchild",
                        "IsArray": true
                    },
                    {
                        "Parent": 2,
                        "Child": 8,
                        "Kind": "grandchild",
                        "IsArray": true
                    }, ,
                ],
                "RootArray": false
            };

            var actual = tree.normalise(tree.chopNodesByIds([1,7], tree.decompose(input)));
            var composed = tree.decompose(input).chopNodesByIds([1,7]).normalise();

            expect(noFunctions(actual)).to.deep.equal(expected);
            expect(noFunctions(composed)).to.deep.equal(expected);
        });
    });
});

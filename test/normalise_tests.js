var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

//chai.config.truncateThreshold = 0;

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

            expect(actual).to.deep.equal(expected);

        });
    });
});

var _         = require('lodash');
var instances = require('./Instances.json');
var relations = require('./Relationships.json');

// Pick out the parent<-target->child details
// We want to have the links in as many types as possible.

var insts = [];
var rels = [];


Object.keys(relations).forEach(function(a){
    relations[a].forEach(function(i){
        var businessID = _.first(_.where(instances[i.Child].Data, {Name:"Business_ID"}));
        if (businessID) businessID = businessID.Value;
        rels.push({Parent: a, Child: i.Child, Kind: i.Kind, Schema:i.SchemaElementGuid, Type:instances[i.Child].Meta[1].Value, BID:businessID});
    });
});

// We want to be able to find a parent by any key, then a set of it's children by any key (maybe not the same as the parent).
// Also, we should be able to reduce the children by applying more than one key.
//
// root.where({Schema:x}).where({Type:y});
//  - or -
// root.search({Kind:a, BID:b});  // this would be 'AND' ?
// root.search({Kind:a},{BID:b}); // would this be 'OR' ?
//


console.log(JSON.stringify(rels,undefined, 2));

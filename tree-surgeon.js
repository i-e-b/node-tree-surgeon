"use strict";
var global, exports;
var _ = require('lodash');

// Some helpers for chained API.
function rebind1(f,end){return (function(a1)                {return f(a1, this);                }).bind(end);}
function rebind2(f,end){return (function(a1, a2)            {return f(a1, a2, this);            }).bind(end);}
function rebind3(f,end){return (function(a1, a2, a3)        {return f(a1, a2, a3, this);        }).bind(end);}
function rebind5(f,end){return (function(a1, a2, a3, a4, a5){return f(a1, a2, a3, a4, a5, this);}).bind(end);}


(function (provides) {
    var CallBoundObject = function CallBoundObject(){
        // this might be worth measuring for speed difference
        this.compose = provides.compose.bind(this, this);
        this.render = rebind2(provides.render, this);
        this.flipRelationship = rebind3(provides.flipRelationship, this);
        this.reverseByRelation = rebind2(provides.reverseByRelation, this);
        this.removeEmptyNodes = provides.removeEmptyNodes.bind(this, this);
        this.prune = rebind1(provides.prune, this);
        this.pruneAfter = rebind1(provides.pruneAfter, this);
        this.pruneAllBut = rebind1(provides.pruneAllBut, this);
        this.chopNodesByIds = rebind1(provides.chopNodesByIds, this);
        this.chop = rebind1(provides.chop, this);
        this.chopAfter = rebind1(provides.chopAfter, this);
        this.chopChildless = rebind1(provides.chopChildless, this);
        this.chopByKind = rebind2(provides.chopByKind, this);
        this.chopNodesByData = rebind5(provides.chopNodesByData, this);
        this.mergeUpByKind = rebind1(provides.mergeUpByKind, this);
        this.mergeUpByNode = rebind1(provides.mergeUpByNode, this);
        this.mergeDownByKind = rebind1(provides.mergeDownByKind, this);
        this.mergeDownByNode = rebind1(provides.mergeDownByNode, this);
        this.fuseByNode = rebind3(provides.fuseByNode, this);
        this.fuseByKind = rebind3(provides.fuseByKind, this);
        this.harvest = rebind2(provides.harvest, this);
        this.gatherByKind = rebind1(provides.gatherByKind, this);
        this.gatherByNode = rebind1(provides.gatherByNode, this);
        this.reduce = rebind2(provides.reduce, this);
        this.editByKind = rebind2(provides.editByKind, this);
        this.forEachByKind = rebind2(provides.forEachByKind, this);
        this.getPathOf = rebind1(provides.getPathOf, this);
        this.getNode = rebind1(provides.getNode, this);
        this.getChildrenOf = rebind1(provides.getChildrenOf, this);
        this.getChildrenByKindOf = rebind2(provides.getChildrenByKindOf, this);
        this.parentIdOf = rebind1(provides.parentIdOf, this);
        this.normalise = provides.normalise.bind(this, this);
    };

    /** decompose -- Takes a plain object and decomposed sub-objects into separate nodes
     *
     * Output structure looks like
     *      {"Root": id,
     *       "Nodes" : { "Key" :{ ... }, ... },
     *       "Relations": [ {"Parent":.., "Child":.., "Kind":...}, ... ]
     *      }
     * */
    provides.decompose = function(obj, excludedKinds, relationDecorator, useEmptyRelations) {
        var idx = 0; // used to make unique IDs

        if (typeof excludedKinds === 'function') {
            relationDecorator = excludedKinds;
            excludedKinds = []
        }
        
        var nodesToDecompose = [];
        var nodes = [];
        var relations = [];
        var exclude = excludedKinds || [];
        var decorator = relationDecorator;
        
        var rootId = idx++;
        var isRootArray = Array.isArray(obj);
        if (obj !== null && obj !== undefined) nodesToDecompose.push([rootId, obj]);

        var isNonArrayObject = function(o){
            if (Array.isArray(o)) return false;
            var type = typeof o;
            return !!o && (type == 'object' || type == 'function');
        };

        // This code has been unrolled and made ugly for speed. Be very careful working on it!
        while(nodesToDecompose.length > 0) {
            var pair = nodesToDecompose.shift();
            var id = pair[0], node = pair[1];
            nodes[id] = {};

            var nodeType = typeof node;
            var keys = (node == null || node == undefined || (nodeType !== 'object' && nodeType !== 'function')) ? [] : Object.keys(node);
            var kc = keys.length;
            for (var ki = 0; ki < kc; ki++){
                var key = keys[ki];
                var value = node[key];
                var isArr      = Array.isArray(value);
                var type       = typeof value;
                var isObj      = !!value && (type == 'object' || type == 'function');
                var isExcluded = exclude.indexOf(key) >= 0 || ((value instanceof Date));

                if ((!isExcluded) && isArr && (useEmptyRelations || (value.length > 0 && value.every(isNonArrayObject)))) {
                    if (value.length === 0) {
                        // an empty relation
                        var childId = idx++;
                        if (decorator) {
                            relations.push(merge(decorator(null, key, undefined), {"Parent":id, "Child":childId, "Kind":key, "IsArray":true}));
                        } else {
                            relations.push({"Parent":id, "Child":childId, "Kind":key, "IsArray":true});
                        }
                        nodes[childId] = [];
                    } else {
                        // is an array of objects, treat as multiple child nodes
                        for (var i = 0; i < value.length; i++) {
                            var childNode = value[i];
                            var childId = idx++;
                            if (decorator) {
                                relations.push(merge(decorator(childNode, key, node), {"Parent":id, "Child":childId, "Kind":key, "IsArray":true}));
                            } else {
                                relations.push({"Parent":id, "Child":childId, "Kind":key, "IsArray":true});
                            }

                            if (childNode !== null) nodesToDecompose.push([childId, childNode]);
                            else nodes[childId] = [];
                        }
                    }
                } else if ((!isExcluded) && isObj && (!isArr)) {
                    // new node to be decomposed. Add to queue, don't add to parent.
                    var childId = idx++;
                    if (decorator) {
                        relations.push(merge(decorator(value, key, node), {"Parent":id, "Child":childId, "Kind":key, "IsArray":false}));
                    } else {
                        relations.push({"Parent":id, "Child":childId, "Kind":key, "IsArray":false});
                    }

                    if (value !== null) nodesToDecompose.push([childId, value]);
                    else nodes[childId] = [];
                } else {
                    // just some value. Add to general output
                    nodes[id][key] = value;
                }
            }
        }

        var ret = new CallBoundObject();
        ret.Root = rootId; ret.Nodes = nodes; ret.Relations = relations; ret.RootArray = isRootArray;
        return ret;
    };

    /** compose -- Takes a decomposed structure and returns a plain object
     *
     * Input structure looks like
     *      {"Root": id,
     *       "Nodes" : { "Key" :{ ... }, ... },
     *       "Relations": [ {"Parent":.., "Child":.., "Kind":...}, ... ]
     *      }
     * */
    provides.compose = function(relational) {
        return renderFromRoot(null, null, relational.Root, relational);
    };

    /** 
     * render -- compose a relational structure into a plain object, changing node contents using a supplied function.
     * If any of the render functions are null or undefined, rendered output will match `compose`
     * @renderNodeFunc -- function that takes (node, path, id) and returns the rendered node
     * @renderKindFunc -- function that takes (kind, path) and returns kind
     **/
    provides.render = function(renderNodeFunc, renderKindFunc, relational) {
        return renderFromRoot(renderNodeFunc, renderKindFunc, relational.Root, relational);
    };


    /** flipRelationship -- make children into parents and parents into children 
     * new parents are merged based on equality of the value returned by `newParentHashFunc`
     * if no hash function is provided, all are considered equal
     **/
    provides.flipRelationship = function(newChildKind, newParentKind, newParentHashFunc, relational) {
        var hashFunc = newParentHashFunc || function(){return 1;}; // if no hash, all are considered equal
        var grandparents = {};
        var IDs = {};
        
        var mergeHash = function(rel){
            var hash = hashFunc(relational.Nodes[rel.Child]);
            IDs[hash] = IDs[hash] || rel.Child;
            return IDs[hash];
        };
        var groupNewParentsByHashEquality = function(oldChildren) {
            return oldChildren.map(mergeHash);
        };

        var newChildSpec = (typeof newChildKind === "string") ? ({Kind:newChildKind}) : (newChildKind);
        var newParentSpec = (typeof newParentKind === "string") ? ({Kind:newParentKind}) : (newParentKind);

        var toRemove = [];
        var removeRel = function(rel) {toRemove.push(rel.Parent); toRemove.push(rel.Child);};
        
        // build the id tree for the new relationships, and keep track of the old relationships to delete
        _.where(relational.Relations, newChildSpec).forEach(function(rel) {
            var gParent = rel.Parent; var oldParent = rel.Child;
            if (!grandparents[gParent]) grandparents[gParent] = {};

            var oldChildren = _.where(relational.Relations, {Kind:newParentSpec.Kind, Parent:oldParent});
            var map = groupNewParentsByHashEquality(oldChildren);

            if (map.length !== 1) return; // doesn't match the pattern -- must have exactly one new parent to flip out

            oldChildren.forEach(removeRel);

            var newParent = map[0];
            var newChild = oldParent;

            if (grandparents[gParent][newParent]) grandparents[gParent][newParent].push(newChild);
            else grandparents[gParent][newParent] = [newChild];
        });

        // delete the old structure
        removeRelationByIds(relational, toRemove);

        // build the new structure
        var gpKeys = Object.keys(grandparents);
        for (var gpi = 0; gpi < gpKeys.length; gpi++) {
            var gPid = gpKeys[gpi];
            var gpar = grandparents[gPid];
            var newPids = Object.keys(gpar);

            for (var npi = 0; npi < newPids.length; npi++) {
                var newPid = newPids[npi];
                var npar = gpar[newPid];
                relational.Relations.push({Parent:gPid, Child:newPid, Kind:newParentSpec.Kind});
                for(var i = 0; i < npar.length; i++) {
                    relational.Relations.push({Parent:newPid, Child:npar[i], Kind:newChildSpec.Kind});
                }
            }
        }

        return relational;
    };

    /**
     * Reverse relationships
     * @param relationFilter - function(relation). A filter which identifies which relations to flip
     * @param groupPredicate - function(relation). A function defining how the new parents should be grouped
     * @param relational -- the source relational model to reverse Relations on (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.reverseByRelation = function(relationFilter, groupPredicate, relational) {
        var relationsToReverse = _.where(relational.Relations,relationFilter);
        var relationGroups = _.groupBy(relationsToReverse, groupPredicate);

        var nodesToRemove = [];
        var relationsToRemove = [];
        var newRelations = [];

        var relKeys = Object.keys(relationGroups);
        for (var ki = 0; ki < relKeys.length; ki++) {
            var relGroupKey = relKeys[ki];
            // New grandparent to child relations built for this group
            var newGroupRelations = [];

            var rgrps = relationGroups[relGroupKey];
            for (var ri = 0; ri < rgrps.length; ri++) {
                var rel = rgrps[ri];
                // find grandparent parent relation, and therefore gp id, mark relation to delete
                var gpRelation = _.find(relational.Relations, {Child: rel.Parent});
                var gpId = gpRelation.Parent;
                var oldParentKind = gpRelation.Kind;
                relationsToRemove.push(rel.Parent);

                // Create a new relation for GP->Child if doesn't already exist
                // otherwise note the new ParentId and mark old child for deletion
                var newParentId = rel.Child;
                var existingRel = _.find(newGroupRelations, {Parent: gpId, Kind: rel.Kind});
                if (existingRel !== undefined) {
                    newParentId = existingRel.Child;
                    nodesToRemove.push(rel.Child);
                } else {
                    newGroupRelations.push({Parent: gpId, Child: rel.Child, Kind: rel.Kind, IsArray: true});
                }

                // Create the new Child->Parent, if Child & ParentKind already exist,
                // All reverse relations are considered arrays, mark old relation for deletion
                var newChildToParentRel = {Parent: newParentId, Child: rel.Parent, Kind: oldParentKind, IsArray: true};
                newRelations.push(newChildToParentRel);
                relationsToRemove.push(rel.Child);
            };

            // Push new group relations into new Relations
            newRelations = newRelations.concat(newGroupRelations);

        };

        // delete the old relations
        removeRelationByIds(relational, relationsToRemove);

        // build the new structure
        relational.Relations = relational.Relations.concat(newRelations);

        // Delete any child nodes which are now grouped
        removeNodesByIds(relational, nodesToRemove);

        return relational;
    };
    
    /** removeEmptyNodes -- remove node relations if node contains only null properties */
    provides.removeEmptyNodes = function(relational) {
        var isEmpty = function (x) {
            var n = Object.keys(x);
            for (var i=0; i < n.length; i++) {
                var k = n[i];
                if (x[k] !== null && x[k] !== undefined) return false;
            }
            return true;
        };

        var noChildren = function(k, rel) {
            return ! (_.some(rel.Relations, {Parent:k}));
        };

        var cycleAgain = true;
        var remover = function(rel) {
            var dead = emptyNodes.indexOf(rel.Child) !== -1;
            if (dead) cycleAgain = true;
            return dead;
        };

        while (cycleAgain) {
            cycleAgain = false;

            var emptyNodes = [];
            for (var i=0; i < relational.Nodes.length; i++) {
                if (isEmpty(relational.Nodes[i]) && noChildren(i, relational)) { emptyNodes.push(i); }
            }

            _.remove(relational.Relations, remover);
        }

        return relational;
    };

    /** prune -- remove relationships by kind */
    provides.prune = function(kind, relational) {
        var pred = (typeof kind === "string") ? {Kind:kind} : kind;
       _.remove(relational.Relations, pred);
        return relational;
    };

    /** pruneAfter -- remove children by matching parent relationship kind */
    provides.pruneAfter = function(kind, relational) {
        // remove children of child IDs
        var pred = (typeof kind === "string") ? {Kind:kind} : kind;
        var parents = _.pluck(_.where(relational.Relations, pred), "Child");
        removeChildrenByParentsIds(relational, parents);
        return relational;
    };

    /** pruneAllBut -- remove nodes where kind is not in the given list */
    provides.pruneAllBut = function(kinds, relational) {
        var sel = function(rel, k) {return k == rel.Kind;};
        _.remove(relational.Relations, function(rel) {
            return ! _.some(kinds, sel.bind(this,rel));
        });
        return relational;
    };

    /** chop -- remove nodes and their children if they match a filter
     * @param filterFunc -- function of (node, id). If this returns a truthy value, node will be removed, else node will be kept
     * @param relational -- the source relational model to "chop" (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.chop = function(filterFunc, relational) {
        var toRemove = [];
        _.forEach(relational.Nodes, function(node, id) {
            if (filterFunc(node, id)) toRemove.push(id);
        });
        removeNodesByIds(relational, toRemove);
        return relational;
    };

    /** chopAfter -- remove child nodes where a parent matches a predicate
     * @param filterFunc -- function of (node, id). If this returns a truthy value, node will be removed, else node will be kept
     * @param relational -- the source relational model to "chop" (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.chopAfter = function(filterFunc, relational) {
        var toRemove = [];
        _.forEach(relational.Nodes, function(node, id) {
            if (filterFunc(node, id)) toRemove.push(id);
        });
        removeChildrenByParentsIds(relational, toRemove);
        return relational;
    };

    /** chopByKind -- remove nodes, of a specified kind, and their children if they match a filter
     * @param kind -- the type of node to consider
     * @param filterFunc -- function of (node, id). If this returns a truthy value, node will be removed, else node will be kept
     * @param relational -- the source relational model to "chop" (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.chopByKind = function(kind, filterFunc, relational) {
        var toRemove = [];
        var targetIds = pickIdsByKind(kind, relational);
        _.forEach(targetIds, function(targetId) {
            if (filterFunc(relational.Nodes[targetId], targetId)) { toRemove.push(targetId); }
        });
        removeNodesByIds(relational, toRemove);
        return relational;
    };

    /** chopChildless -- remove nodes, where the nodes have no children (leaves), if they match a data predicate
     * @param filterFunc -- function of (node, id). If this returns a truthy value, node will be removed, else node will be kept
     * @param relational -- the source relational model to "chop" (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.chopChildless = function(filterFunc, relational) {
        var toRemove = [];
        var targetIds = pickIdsWithNoChildren(relational);
        _.forEach(targetIds, function(targetId) {
            if (filterFunc(relational.Nodes[targetId], targetId)) { toRemove.push(targetId); }
        });
        removeNodesByIds(relational, toRemove);
        return relational;
    };

    /** Remove nodes and their subtrees by node ID */
    provides.chopNodesByIds = function(ids, relational) {
        removeNodesByIds(relational, ids);
        return relational;
    };

    // takes a query object (like the 'kind' matches) and returns a matching function.
    function matchFunc(query){
        var props = Object.keys(query);

        return function(object) {
            var result = false;
            var length = props.length;

            while (length--) {
                var key = props[length];
                if (!(result = (object[key] == query[key]))) { break; }
            }
            return result;
        };
    }

    /** remove nodes of kind 'victim' from 'target', where 'target' has a sibling 'data' for which selectorFunc returns true.
     * Nodes are not removed if victimFunc returns falsy */
    provides.chopNodesByData = function(dataKind, targetKind, victimKind, selectorFunc, victimFunc, relational){
        // find the relations that apply:
        var dataMatch = matchFunc((typeof dataKind === "string") ? {Kind:dataKind} : dataKind);
        var targMatch = matchFunc((typeof targetKind === "string") ? {Kind:targetKind} : targetKind);
        var victMatch = matchFunc((typeof victimKind === "string") ? {Kind:victimKind} : victimKind);

        var dataRels = [], targRels = {}, victRels = {};
        for (var n = 0; n < relational.Relations.length; n++) {
            var rel = relational.Relations[n];
            if (dataMatch(rel)) {dataRels.push(rel);}
            else if(targMatch(rel)){
                targRels[rel.Parent] = (targRels[rel.Parent] || []);
                targRels[rel.Parent].push(rel);
            }
            else if(victMatch(rel)){
                victRels[rel.Parent] = (victRels[rel.Parent] || []);
                victRels[rel.Parent].push(rel);
            }
        }

        // group targRels and dataRels where they have the same "Parent" id.
        // reject any that can't be grouped.
        // reject any where `selectorFunc(dataNode)` returns falsy values.
        var toProc = dataRels.map(function(d){
            if (!targRels[d.Parent]) return undefined;
            if (!selectorFunc(relational.Nodes[d.Child])) return undefined;
            
            // get the 'victims' to go with each parent
            var victimList = [].concat.apply([], targRels[d.Parent].map(function(t){return victRels[t.Child];}));
            return {data:d, victims: victimList};
        }).filter(function(e){return e !== undefined});

        // any that are not rejected, run `victimFunc(parentNode, victimNode)` and delete any that return truthy values.
        var toChop = [];
        for (var i = 0; i < toProc.length; i++) {
            var pair = toProc[i];
            var parentNode = relational.Nodes[pair.data.Parent];

            for (var j = 0; j < pair.victims.length; j++) {
                var childIndex = pair.victims[j].Child;
                var childNode = relational.Nodes[childIndex];
                if (victimFunc(parentNode, childNode)) {toChop.push(childIndex);}
            }
        }

        // take out the results
        removeNodesByIds(relational,toChop);

        return relational;
    }; 

    /** merge up by kind -- remove child nodes by relationship putting data into parent */
    provides.mergeUpByKind = function(kind, relational) {
        var parentGetsAll = function (n){return n;};
        var childGetsNone = function (n){return null;};

        var ids = pickIdsByKind(kind, relational);
        return fuseByNodeIds(ids, parentGetsAll, childGetsNone, relational);
    };

    /** merge up by predicate on nodes -- remove nodes that match a predicate */
    provides.mergeUpByNode = function(predFunc, relational) {
        var parentGetsAll = function (n){return n;};
        var childGetsNone = function (n){return null;};

        var ids = pickIdsByNodePredicate(predFunc, relational);
        return fuseByNodeIds(ids, parentGetsAll, childGetsNone, relational);
    };

    /** mergeDownByKind -- remove parent nodes by relationship, putting data into children */
    provides.mergeDownByKind = function(kind, relational) {
        var parentGetsNone = function (n){return null;};
        var childGetsAll = function (n){return n;};

        var ids = pickIdsByKind(kind, relational);
        return fuseByNodeIds(ids, parentGetsNone, childGetsAll, relational);
    };

    /** mergeDownByNode -- remove nodes by predicate function, merging data into children */
    provides.mergeDownByNode = function (predFunc, relational) {
        var parentGetsNone = function (n){return null;};
        var childGetsAll = function (n){return n;};

        var ids = pickIdsByNodePredicate(predFunc, relational);
        return fuseByNodeIds(ids, parentGetsNone, childGetsAll, relational);
    };

    /** fuseByNode -- remove a node by merging into it's parent and child (by supplied functions) */
    provides.fuseByNode = function(nodePredFunc, pickForParentFunc, pickForChildFunc, relational){
        var ids = pickIdsByNodePredicate(nodePredFunc, relational);
        return fuseByNodeIds(ids, pickForParentFunc, pickForChildFunc, relational);
    };

    /** fuseByKind -- remove a child node by it's kind, merging data into parent and grandchildren by supplied functions run on removed node */
    provides.fuseByKind = function(kind, pickForParentFunc, pickForChildFunc, relational) {
        var ids = pickIdsByKind(kind, relational);
        return fuseByNodeIds(ids, pickForParentFunc, pickForChildFunc, relational);
    };

    /** harvest -- return subtrees by kinds, keyed by parent value picked by a selector */
    provides.harvest = function(kind, idSelector, relational) {
        var targetIds = pickIdsByKind(kind, relational);
        var childToParent;
        if (idSelector) {
            childToParent = _.indexBy(relational.Relations, "Child");
        }

        var outp = {};
        _.forEach(targetIds, function(nodeId) { // for each targeted node

            var key = nodeId;
            if (idSelector) {
                // get parent node and pass to selector
                var parentId = childToParent[nodeId].Parent;
                key = idSelector(relational.Nodes[parentId]);
            }

            outp[key] = join(outp[key], renderFromRoot(null, null, nodeId, relational)); // render the sub-tree
        });

        return outp;
    };

    /** gather -- return arrays of subtrees by kinds */
    provides.gatherByKind = function(kind, relational) {
        var targetIds = pickIdsByKind(kind, relational);
        return targetIds.map(function(id){return renderFromRoot(null, null, id, relational);});
    };

    /** gather -- return arrays of subtrees by a selector predicate function */
    provides.gatherByNode = function(predicate, relational) {
        var targetIds = pickIdsByNodePredicateIncludeRoot(predicate, relational);
        return targetIds.map(function(id){return renderFromRoot(null, null, id, relational);});
    };

    /** pick values of a given property from the given kind */
    provides.reduce = function(kind, prop, relational) {
        var rels  =_.where(relational.Relations, {Kind:kind});
        // for each in ids, get parent, populate with child values and chop.

        _.forEach(rels, function(r){
            relational.Nodes[r.Parent][kind] = join(relational.Nodes[r.Parent][kind], relational.Nodes[r.Child][prop]);
        });

        provides.prune(kind, relational);
        return relational;
    };

    /** change nodes of a given kind to the return value of the `filterFunc` */
    provides.editByKind = function(kind, filterFunc, relational) {
        var targetIds = pickIdsByKind(kind, relational);
        var i = targetIds.length;
        for(;i--;){
            var id = targetIds[i];
            relational.Nodes[id] = filterFunc(relational.Nodes[id], id);
        }
        return relational;
    };

    /**
     * Action the supplied function for each node of a specific kind
     * @param kind -- the type of node to consider
     * @param actionFunc -- function of (node, id) to execute for each matching node. Any return is ignored
     * @param relational -- the source relational model (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.forEachByKind = function(kind, actionFunc, relational) {
        var targetIds = pickIdsByKind(kind, relational);
        _.forEach(targetIds, function(id) {
            actionFunc(relational.Nodes[id], id);
        });
        return relational;
    };

    /** Given a child ID, find its parent's ID. Returns `null` if not found */
    provides.parentIdOf = function(childId, relational) {
        return (_.first(_.where(relational.Relations, {Child:childId})) || {Parent:null}).Parent;
    };

    /** Given a parent ID, return a list of all child IDs, or empty */
    provides.getChildrenOf = function(parentId, relational) {
        return _.pluck(_.where(relational.Relations, {Parent:parentId}), 'Child');
    };

    /**
     * getChildrenByKindOf
     * Get a list of child IDs for the specified parent filtered by a specified Kind
     * @param parentId -- the Id of the parent whose children should be checked
     * @param kind -- the Kind of node to check for
     * @param relational -- the source relational model (as created by decompose)
     * @return an array of Child Id's of a specified Kind
     */
    provides.getChildrenByKindOf = function(parentId, kind, relational) {

        var whereCriteria;
        if (typeof kind === "string") {
            whereCriteria = {Parent: parentId, Kind: kind};
        } else {
            whereCriteria = _.clone(kind);
            whereCriteria.Parent = parentId;
        }
        return _.pluck(_.where(relational.Relations, whereCriteria), 'Child' );
    };

    /** return the Kind strings between root and the given node as an array  */
    provides.getPathOf = function(nodeId, relational) {
        var result = [];
        var rel, id = nodeId;
        while (rel = _.first(_.where(relational.Relations, {Child: id}))) {
            result.unshift(rel.Kind);
            id = rel.Parent;
        }
        return result;
    };

    /** get node data by id */
    provides.getNode = function(id, relational) {if (!relational) return undefined; else return relational.Nodes[id];};

    provides.normalise = function(relational) {
        // reachable array, walk tree then cleanup.
        var reachable = new Array(relational.Nodes.length);
        var edge = [relational.Root];

        reachable[relational.Root] = true;
        var parentToChild = _.groupBy(relational.Relations, "Parent");

        // walk the tree copying reachability down
        while (edge.length > 0) {
            var parent = edge.pop();
            var rels = parentToChild[parent];
            if (rels) for (var i = 0; i < rels.length; i++) {
                reachable[rels[i].Child] = reachable[parent];
                edge.unshift(rels[i].Child);
            }
        }

        // remove unreachable nodes
        for (var i = 0; i < reachable.length; i++) {
            if (reachable[i]) continue;
            delete relational.Nodes[i];
        }

        // remove unreachable relations
        for (var i = 0; i < relational.Relations.length; i++) {
            if (reachable[relational.Relations[i].Parent]) continue;
            delete relational.Relations[i];
        }

        return relational;
    };

    // Return Child ids for a relation kind, or kind-spec
    function pickIdsByKind(kind, relational) {
        var spec = (typeof kind === "string") ? {Kind:kind} : kind;
        return _.pluck(_.where(relational.Relations, spec), 'Child');
    }

    function pickIdsByNodePredicate(predFunc, relational) {
        var ids = [];
        _.forEach(relational.Nodes, function(node, idx) {
            if (idx == relational.Root) return;
            if (predFunc(node, idx)) ids.push(idx);
        });
        return ids;
    }
    function pickIdsByNodePredicateIncludeRoot(predFunc, relational) {
        var ids = [];
        _.forEach(relational.Nodes, function(node, idx) {
            if (predFunc(node, idx)) ids.push(idx);
        });
        return ids;
    }

    function pickIdsWithNoChildren(relational) {
        var children = _.pluck(relational.Relations, 'Child');
        var parents = _.pluck(relational.Relations, 'Parent');
        return _.difference(children, parents);
    }

    function fuseByNodeIds(ids, pickForParentFunc, pickForChildFunc, relational){
        // TODO: this is now the general case for a lot of things -- tune it!
        var flip_join = flip(join);
        _.forEach(ids, function(nodeId) { // for each node to merge
            var parentId = null, childRels = [];
            _.forEach(relational.Relations, function(rel, idx) { // find rels where id is parent or child
                if ( ! rel) return;
                if (rel.Child == nodeId) {
                    parentId = rel.Parent;
                    delete relational.Relations[idx];
                } else if (rel.Parent == nodeId) {
                    var forChild = pickForChildFunc(relational.Nodes[nodeId], nodeId);
                    if (forChild) _.merge(relational.Nodes[rel.Child], forChild, flip_join); // merge node down
                    childRels.push(idx);
                }
            });
            var forParent = pickForParentFunc(relational.Nodes[nodeId], nodeId);
            if (forParent) _.merge(relational.Nodes[parentId], forParent, join); // merge node up
            _.forEach(childRels, function(idx) { // connect children to parent
                relational.Relations[idx].Parent = parentId;
            });
        });

        // filter undefined nodes
        _.remove(relational.Relations, function(r){return _.isUndefined(r);});

        return relational;
    }

    function flip(f2) { // flip the args on a 2-ary function
        return function(a,b){return f2(b,a);};
    }
    
    function join (old, additional) {
        if (additional === null || additional === undefined) return old;
        if (old) {
            return (Array.isArray(old)) ? (old.concat(additional)) : ([old].concat(additional));
        } else {
            return additional;
        }
    }
    
    function merge (obj1, obj2) {for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; };return obj1;};

    function removeNodesByIds(relational, Ids) {
        relational.Relations = relational.Relations.filter(function(rel){return (Ids.indexOf(rel.Child) === -1);});
        for (var i = 0; i < Ids.length; i++){
            delete relational.Nodes[Ids[i]];
        }
    }

    function removeRelationByIds(relational, Ids) {
        var newRelations = [];
        var oldRels = relational.Relations;
        for (var i = 0; i < oldRels.length; i++){
            if (Ids.indexOf(oldRels[i].Child) === -1) newRelations.push(oldRels[i]);
        }
        relational.Relations = newRelations;
    }

    function buildRecursive(currentNode, path, relational, parentToChild, renderNodeFunc, renderKindFunc) {
        if (! relational.Nodes[currentNode]) return undefined;

        var src = relational.Nodes[currentNode];
        var output = {};
        for (var k in src) output[k] = src[k];
        var output = renderNodeFunc(relational.Nodes[currentNode], path, currentNode);

        var childNodes = parentToChild[currentNode];
        if (output && childNodes) {
            for (var i = 0; i < childNodes.length; i++) {
                var childNode = childNodes[i];
                var renderedKind = renderKindFunc(childNode.Kind, path);
                var subpath = path.concat(childNode.Kind); // path is always input path, not rendered

                var subtree = join(output[renderedKind],
                    (renderedKind) ? buildRecursive(childNode.Child, subpath, relational, parentToChild, renderNodeFunc, renderKindFunc) : undefined); // if the kind is removed by renderer, don't build the subtree

                if (subtree) output[renderedKind] = (childNode.IsArray) ? asArray(subtree) : subtree;
            }
        }
        return output;
    }

    function buildRecursiveFast(currentNode, path, relational, parentToChild) {
        if (! relational.Nodes[currentNode]) return undefined;

        var output = relational.Nodes[currentNode];

        var childNodes = parentToChild[currentNode];
        if (output && childNodes) {
            for (var i = 0; i < childNodes.length; i++) {
                var childNode = childNodes[i];
                var renderedKind = childNode.Kind;
                var subpath = path.concat(childNode.Kind); // path is always input path, not rendered

                var subtree = join(output[renderedKind],
                    (renderedKind) ? buildRecursiveFast(childNode.Child, subpath, relational, parentToChild) : undefined); // if the kind is removed by renderer, don't build the subtree
                if (!Array.isArray(relational.Nodes[currentNode]))
                if (subtree) output[renderedKind] = (childNode.IsArray) ? asArray(subtree) : subtree;
            }
        }
        return output;
    }

    function emptyRenderNodeFunc (node, path, id){return node;}
    function emptyRenderKindFunc (kind, path){return kind;}
    function renderFromRoot(renderNodeFunc, renderKindFunc, rootId, relational) {
        var builder = buildRecursive;
        if ( (!renderNodeFunc) && (!renderKindFunc) ) {
            builder = buildRecursiveFast;
        } else {
            renderNodeFunc = renderNodeFunc || emptyRenderNodeFunc;
            renderKindFunc = renderKindFunc || emptyRenderKindFunc;
        }

        var parentToChild = _.groupBy(relational.Relations, "Parent");
        
        var result = builder(rootId, [], relational, parentToChild, renderNodeFunc, renderKindFunc) || {};
        if (relational.RootArray) {
            result.length = Object.keys(result).length;
            return Array.prototype.slice.call(result);
        } else {
            return result;
        }
    }

    function asArray(element) {return [].concat.apply([], [element]); }

    function removeChildrenByParentsIds(relational, parentIds) {
        _.forEach(parentIds, function(p){
            _.remove(relational.Relations, function(v) {
                if (v.Parent == p) {
                    delete relational.Nodes[v.Child];
                    return true;
                }
            });
        });
    }

    function queueWorkerSync (queue, doWork) {
        while(queue.length > 0) {
            var work = queue.shift();
            doWork(work);
        }
    }

/* istanbul ignore next */ // `this` branch doesn't get followed
})(global || exports || this);

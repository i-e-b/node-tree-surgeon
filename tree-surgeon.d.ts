declare module "tree-surgeon" {

    export type RelationPredicate = (NodeRelation)=>boolean;
    export type RelationSelector = NodeRelation | string | RelationPredicate;

    /** NodeRelation can be decorated to contain any other properties */
    export interface NodeRelation /*extends any*/ {
        Parent?:any;
        Child?:any;
        Kind?:any;
        [index: string]: any;
    }

    export function decompose(obj:any):DecomposedTree;

    export interface DecomposedTree extends CallBoundObject {
        Root:number;
        RootArray:boolean;
        Nodes:any;
        Relations:Array<NodeRelation>;
    }

    interface CallBoundObject {
        // Functions that compose trees (can't be chained)
        compose():any;
        render(renderNodeFunc:(node:any, path:[string], id:string)=>any, renderKindFunc:(kind:string, path:[string])=>string):any;
        harvest(kind:RelationSelector,keySelector:(any)=>any):any;
        gatherByKind(kind:RelationSelector):[any];
        gatherByNode(nodePredicate:(any)=>boolean):[any];

        // Functions that manipulate the relational model (can be chained)
        normalise():DecomposedTree;
        flipRelationship(newChildKind:string, newParentKind:string, newParentHashFunc:(any)=>any):DecomposedTree;
        reverseByRelation(relationFilter:RelationSelector, groupPredicate:(r:NodeRelation)=>any):DecomposedTree;
        removeEmptyNodes():DecomposedTree;
        prune(kind:RelationSelector):DecomposedTree;
        pruneAfter(kind:RelationSelector):DecomposedTree;
        pruneAllBut(kinds:[string]):DecomposedTree;
        chopNodesByIds(ids:[string]):DecomposedTree;
        chop(filter:(node:any, id:number)=>boolean):DecomposedTree;
        chopAfter(filter:(node:any, id:number)=>boolean):DecomposedTree;
        chopChildless(filter:(node:any, id:number)=>boolean):DecomposedTree;
        chopByKind(kind:RelationSelector, filter:(node:any, id:number)=>boolean):DecomposedTree;
        chopNodesByData(dataKind:RelationSelector, targetKind:RelationSelector, victimKind:RelationSelector, selectorFunc:(node:any)=>boolean, victimFunc:(node:any)=>boolean):DecomposedTree;
        chopPathsByData(dataKind:RelationSelector, targetKind:RelationSelector, victimKind:RelationSelector, selectorFunc:(node:any)=>boolean, victimFunc:(node:any)=>boolean):DecomposedTree;
        mergeUpByKind(kind:RelationSelector):DecomposedTree;
        mergeUpByNode(nodePredicate:(any)=>boolean):DecomposedTree;
        mergeDownByKind(kind:RelationSelector):DecomposedTree;
        mergeDownByNode(nodePredicate:(any)=>boolean):DecomposedTree;
        fuseByNode(nodePredFunc:(any)=>boolean, pickForParentFunc:(any)=>any, pickForChildFunc:(any)=>any):DecomposedTree;
        fuseByKind(kind:RelationSelector, pickForParentFunc:(any)=>any, pickForChildFunc:(any)=>any):DecomposedTree;
        reduce(kind:string,propertyName:string):DecomposedTree;
        editByKind(kind:RelationSelector, filterFunc:(any)=>any):DecomposedTree;
        forEachByKind(kind:RelationSelector, actionFunc:(any)=>void):DecomposedTree;
        reverseTree(kind:string):DecomposedTree;

        // Special selector functions (can't be chained)
        getPathOf(nodeId:number):[string];
        getNode(nodeId:number):any;
        getChildrenOf(parentId:number):[number];
        getChildrenByKindOf(parentId:number, kind:RelationSelector):[number];
        parentIdOf(childId:number):number;
    }

}

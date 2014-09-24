declare module "tree-surgeon" {

    export interface NodeRelation {
        Parent:any;
        Child:any;
        Kind:any;
    };

    export interface DecomposedTree {
        Root:any;
        Nodes:any;
        Relations:Array<NodeRelation>;
    };

    export function decompose(obj:any):DecomposedTree;
}

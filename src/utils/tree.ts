/**
 * @description 树节点类型定义
 */
export type TreeNode = {
  id?: number | string;
  parentId?: number | string | null;
  pathList?: Array<number | string>;
  uniqueId?: number | string;
  children?: TreeNode[];
  [key: string]: unknown;
};

/**
 * @description 提取菜单树中的每一项uniqueId
 * @param tree 树
 * @returns 每一项uniqueId组成的数组
 */

export const extractPathList = (tree: TreeNode[]): Array<number | string> => {
  if (!Array.isArray(tree)) {
    console.warn("tree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  const expandedPaths: Array<number | string> = [];
  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      extractPathList(node.children);
    }
    if (node.uniqueId !== undefined) {
      expandedPaths.push(node.uniqueId);
    }
  }
  return expandedPaths;
};

/**
 * @description 如果父级下children的length为1，删除children并自动组建唯一uniqueId
 * @param tree 树
 * @param pathList 每一项的id组成的数组
 * @returns 组件唯一uniqueId后的树
 */
export const deleteChildren = (
  tree: TreeNode[],
  pathList: Array<number | string> = []
): TreeNode[] => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  for (const [key, node] of tree.entries()) {
    if (node.children && node.children.length === 1) delete node.children;
    node.id = key;
    node.parentId = pathList.length ? pathList[pathList.length - 1] : null;
    node.pathList = [...pathList, node.id];
    node.uniqueId =
      node.pathList.length > 1 ? node.pathList.join("-") : node.pathList[0];
    if (node.children && node.children.length > 0) {
      deleteChildren(node.children, node.pathList);
    }
  }
  return tree;
};

/**
 * @description 创建层级关系
 * @param tree 树
 * @param pathList 每一项的id组成的数组
 * @returns 创建层级关系后的树
 */
export const buildHierarchyTree = (
  tree: TreeNode[],
  pathList: Array<number | string> = []
): TreeNode[] => {
  if (!Array.isArray(tree)) {
    console.warn("tree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  for (const [key, node] of tree.entries()) {
    node.id = key;
    node.parentId = pathList.length ? pathList[pathList.length - 1] : null;
    node.pathList = [...pathList, node.id];
    if (node.children && node.children.length > 0) {
      buildHierarchyTree(node.children, node.pathList);
    }
  }
  return tree;
};

/**
 * @description 广度优先遍历，根据唯一uniqueId找当前节点信息
 * @param tree 树
 * @param uniqueId 唯一uniqueId
 * @returns 当前节点信息
 */
export const getNodeByUniqueId = (
  tree: TreeNode[],
  uniqueId: number | string
): TreeNode | undefined => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return undefined;
  }
  if (!tree || tree.length === 0) return undefined;
  const item = tree.find(node => node.uniqueId === uniqueId);
  if (item) return item;
  const childrenList = tree
    .filter(node => node.children)
    .map(i => i.children as TreeNode[])
    .flat(1);
  return getNodeByUniqueId(childrenList, uniqueId);
};

/**
 * @description 向当前唯一uniqueId节点中追加字段
 * @param tree 树
 * @param uniqueId 唯一uniqueId
 * @param fields 需要追加的字段
 * @returns 追加字段后的树
 */
export const appendFieldByUniqueId = (
  tree: TreeNode[],
  uniqueId: number | string,
  fields: Record<string, unknown>
): TreeNode[] => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  for (const node of tree) {
    const hasChildren = node.children && node.children.length > 0;
    if (
      node.uniqueId === uniqueId &&
      Object.prototype.toString.call(fields) === "[object Object]"
    )
      Object.assign(node, fields);
    if (hasChildren && node.children) {
      appendFieldByUniqueId(node.children, uniqueId, fields);
    }
  }
  return tree;
};

/**
 * @description 构造树型结构数据
 * @param data 数据源
 * @param id id字段 默认id
 * @param parentId 父节点字段，默认parentId
 * @param children 子节点字段，默认children
 * @returns 追加字段后的树
 */
export const handleTree = (
  data: TreeNode[],
  id?: string,
  parentId?: string,
  children?: string
): TreeNode[] => {
  if (!Array.isArray(data)) {
    console.warn("data must be an array");
    return [];
  }
  const idKey = id || "id";
  const parentIdKey = parentId || "parentId";
  const childrenKey = children || "children";

  const childrenListMap: Record<string, TreeNode[]> = {};
  const nodeIds: Record<string, TreeNode> = {};
  const tree: TreeNode[] = [];

  for (const d of data) {
    const pId = String(d[parentIdKey] ?? "");
    const nodeId = String(d[idKey] ?? "");
    if (childrenListMap[pId] == null) {
      childrenListMap[pId] = [];
    }
    nodeIds[nodeId] = d;
    childrenListMap[pId].push(d);
  }

  for (const d of data) {
    const pId = String(d[parentIdKey] ?? "");
    if (nodeIds[pId] == null) {
      tree.push(d);
    }
  }

  for (const t of tree) {
    adaptToChildrenList(t);
  }

  function adaptToChildrenList(o: TreeNode) {
    const nodeId = String(o[idKey] ?? "");
    if (childrenListMap[nodeId] !== null) {
      o[childrenKey] = childrenListMap[nodeId];
    }
    const nodeChildren = o[childrenKey];
    if (nodeChildren && Array.isArray(nodeChildren)) {
      for (const c of nodeChildren as TreeNode[]) {
        adaptToChildrenList(c);
      }
    }
  }
  return tree;
};

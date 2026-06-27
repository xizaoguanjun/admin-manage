import { shallowRef, type Ref } from "vue";
import { set } from "lodash-es";
import type { RePlusPage } from "yc-pro-components";

type HasChildren<Row> = Row & { children?: Row[] };

/**
 * 行必须包含 nodeKey，用于树形递归查找
 */
export interface EditableRowBase {
  nodeKey: string;
  [key: string]: unknown;
}

interface EditingState<Row> {
  isEditing: boolean;
  editType?: string;
  backup: Partial<Row>;
  draft?: Partial<Row>;
}

interface FormCell<Row> {
  prop: string;
  startCellEdit?: () => void;
  stopCellEdit?: () => void;
  elFormItem?: { formItem?: { model?: Row } };
}

interface UseEditableRowOptions<Row extends EditableRowBase> {
  plusPageRef: Ref<InstanceType<typeof RePlusPage> | undefined>;
  /** 需要开启/关闭编辑的字段列表 */
  editableFields: Array<keyof Row>;
  /** 开始编辑时需要备份的字段列表，用于取消恢复 */
  backupFields?: Array<keyof Row>;
  /** 控制编辑状态的字段名称（默认 isEditing） */
  editFlagKey?: keyof Row;
  /** 控制编辑类型/标签的字段名称（默认 editType） */
  editTypeKey?: keyof Row;
  /** 自定义校验，返回 false 则拦截保存 */
  onValidate?: (row: Row) => boolean;
  /** 行内变更后的回调，用于同步外部存储（平铺表格可用） */
  onRowChange?: (payload: {
    row: Row;
    index: number;
    prop: keyof Row & string;
    value: unknown;
  }) => void;
}

export const useEditablePartialPayment = <Row extends EditableRowBase>({
  plusPageRef,
  editableFields,
  backupFields = [],
  editFlagKey,
  editTypeKey,
  onValidate,
  onRowChange
}: UseEditableRowOptions<Row>) => {
  const editingRowsMap = shallowRef(new Map<string, EditingState<Row>>());

  const getTableData = () =>
    (
      plusPageRef.value?.tableInstance as
        | { data?: HasChildren<Row>[] }
        | undefined
    )?.data || [];

  const findNodeInTreeData = (
    nodes: HasChildren<Row>[],
    nodeKey: string
  ): Row | null => {
    for (const node of nodes) {
      if ((node as Row).nodeKey === nodeKey) return node as Row;
      if (Array.isArray(node.children)) {
        const found = findNodeInTreeData(node.children, nodeKey);
        if (found) return found;
      }
    }
    return null;
  };

  const getRowByKey = (nodeKey: string) =>
    findNodeInTreeData(getTableData(), nodeKey);

  const closeCells = (index: number) => {
    const formRefs = plusPageRef.value?.formRefs;
    if (!formRefs) return;
    const cellRefs = Reflect.get(formRefs, index) as
      | FormCell<Row>[]
      | undefined;
    if (!cellRefs?.length) return;
    cellRefs
      .filter(item => editableFields.includes(item.prop as keyof Row))
      .forEach(item => item.stopCellEdit?.());
  };

  const openCells = (index: number) => {
    const formRefs = plusPageRef.value?.formRefs;
    if (!formRefs) return;
    const cellRefs = Reflect.get(formRefs, index) as
      | FormCell<Row>[]
      | undefined;
    if (!cellRefs?.length) return;
    cellRefs
      .filter(item => editableFields.includes(item.prop as keyof Row))
      .forEach(item => item.startCellEdit?.());
  };

  const applyDraft = (row: Row, nodeKey: string) => {
    const draftState = editingRowsMap.value.get(nodeKey);
    if (draftState?.draft) {
      Object.entries(draftState.draft).forEach(([k, v]) => {
        set(row as Row, k, v);
      });
    }
  };

  const handleFormChange = ({
    value,
    prop,
    index,
    row
  }: {
    value: unknown;
    prop: keyof Row & string;
    index: number;
    row?: Row;
  }) => {
    const tableData = getTableData();
    let targetRow: Row | null = row ?? null;
    if (!targetRow && row?.nodeKey) {
      targetRow = findNodeInTreeData(tableData, row.nodeKey);
    }
    if (!targetRow && tableData[index]) {
      targetRow = tableData[index] as Row;
    }

    if (targetRow) {
      set(targetRow, prop, value);
      const draftState = editingRowsMap.value.get(targetRow.nodeKey);
      if (draftState) {
        draftState.draft = {
          ...(draftState.draft as object),
          [prop]: value
        } as Partial<Row>;
        editingRowsMap.value.set(targetRow.nodeKey, draftState);
      }

      if (onRowChange) {
        onRowChange({
          row: targetRow,
          index,
          prop,
          value
        });
      }
    }
  };

  const startEdit = (nodeKey: string, index: number, editType?: string) => {
    const tableData = getTableData();
    const row = findNodeInTreeData(tableData, nodeKey);
    if (!row) return;

    // 备份字段
    const backup: Partial<Row> = {};
    backupFields.forEach(k => {
      backup[k] = row[k];
    });

    // 标记编辑状态
    const flagKey = (editFlagKey || "isEditing") as keyof Row;
    set(row, flagKey as string, true);
    if (editTypeKey && editType) {
      set(row, editTypeKey as string, editType);
    }

    editingRowsMap.value.set(row.nodeKey, {
      isEditing: true,
      editType,
      backup
    });

    openCells(index);
  };

  const saveEdit = (nodeKey: string, index: number): Row | null => {
    // 优先取 formRefs model
    const formRefs = plusPageRef.value?.formRefs;
    const cellRefs = formRefs
      ? (Reflect.get(formRefs, index) as FormCell<Row>[] | undefined)
      : undefined;
    let latestRow: Row | null =
      (cellRefs && cellRefs[0]?.elFormItem?.formItem?.model) || null;

    if (!latestRow) {
      latestRow = getRowByKey(nodeKey);
    }
    if (!latestRow) return null;

    applyDraft(latestRow, nodeKey);

    // ✅ 验证失败时直接返回，保持编辑状态，不关闭单元格
    if (onValidate && !onValidate(latestRow)) return null;

    // ✅ 验证通过后才关闭单元格编辑（参考抄表管理的处理方式）
    closeCells(index);

    // 清理状态
    const flagKey = (editFlagKey || "isEditing") as keyof Row;
    set(latestRow, flagKey as string, false);
    if (editTypeKey) {
      set(latestRow, editTypeKey as string, undefined);
    }

    editingRowsMap.value.delete(nodeKey);
    return latestRow;
  };

  const cancelEdit = (nodeKey: string, index: number): Row | null => {
    const tableData = getTableData();
    let latestRow = findNodeInTreeData(tableData, nodeKey);
    if (!latestRow) return null;

    const editingState = editingRowsMap.value.get(nodeKey);
    if (editingState?.backup) {
      Object.entries(editingState.backup).forEach(([k, v]) => {
        set(latestRow as Row, k, v);
      });
    }

    closeCells(index);
    latestRow = getRowByKey(nodeKey);
    if (!latestRow) return null;

    const flagKey = (editFlagKey || "isEditing") as keyof Row;
    set(latestRow, flagKey as string, false);
    if (editTypeKey) {
      set(latestRow, editTypeKey as string, undefined);
    }

    editingRowsMap.value.delete(nodeKey);
    return latestRow;
  };

  return {
    startEdit,
    saveEdit,
    cancelEdit,
    handleFormChange,
    getRowByKey,
    editingRowsMap
  };
};

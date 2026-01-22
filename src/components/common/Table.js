import PropTypes from "prop-types";
import { useState, useEffect, useMemo } from "react";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

export default function Table({
  data,
  size = "Normal",
  enableCheckbox = false,
  isRowSelectable = () => true,
  onSelectionChange = () => {},
  onToggle = () => {},
  onCancel = () => {},
  onDelete = () => {},
  onDetail = () => {},
  onEdit = () => {},
  onApprove = () => {},
  onReject = () => {},
  onSent = () => {},
  onUpload = () => {},
  onFinal = () => {},
  onPrint = () => {},
  config = {},
  rowClassName,
}) {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [data]);

  useEffect(() => {
    onSelectionChange(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];

    const cols = Object.keys(data[0]).filter(
      (v) => v !== "Key" && v !== "Count" && v !== "Alignment" && v !== "id"
    );

    if (enableCheckbox) {
      return ["Check", ...cols];
    }
    return cols;
  }, [data, enableCheckbox]);

  if (!data || data.length === 0) return <p>Tidak ada data.</p>;

  const selectableItems = data.filter((item) => isRowSelectable(item));
  const isAllSelected =
    selectableItems.length > 0 && selectedIds.length === selectableItems.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = selectableItems.map((item) => item.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="table-responsive shadow-sm rounded-4">
      <table
        style={{ whiteSpace: "nowrap" }}
        className={`table table-hover table-borderless m-0 ${
          size === "Small" ? "table-sm small" : ""
        }`}
      >
        <TableHeader
          columns={columns}
          enableCheckbox={enableCheckbox}
          isAllSelected={isAllSelected}
          onSelectAll={handleSelectAll}
          config={config}
        />
        <tbody>
          {data.map((row) => (
            <TableRow
              key={row.Key || row.id}
              row={row}
              columns={columns}
              enableCheckbox={enableCheckbox}
              isRowSelectable={isRowSelectable}
              isSelected={selectedIds.includes(row.id)}
              onSelectRow={handleSelectRow}
              onToggle={onToggle}
              onCancel={onCancel}
              onDelete={onDelete}
              onDetail={onDetail}
              onEdit={onEdit}
              onApprove={onApprove}
              onReject={onReject}
              onSent={onSent}
              onUpload={onUpload}
              onFinal={onFinal}
              onPrint={onPrint}
              config={config}
              rowClassName={rowClassName}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

Table.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  size: PropTypes.oneOf(["Normal", "Small"]),
  enableCheckbox: PropTypes.bool,
  isRowSelectable: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onToggle: PropTypes.func,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
  onDetail: PropTypes.func,
  onEdit: PropTypes.func,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  onSent: PropTypes.func,
  onUpload: PropTypes.func,
  onFinal: PropTypes.func,
  onPrint: PropTypes.func,
  config: PropTypes.object,
  rowClassName: PropTypes.func,
};

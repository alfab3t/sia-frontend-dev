import PropTypes from "prop-types";

export default function TableHeader({
  columns,
  enableCheckbox,
  isAllSelected,
  onSelectAll,
  config,
}) {
  return (
    <thead className="h-100 bg-light align-middle">
      <tr>
        {columns.map((col, i) => {
          let width = "auto";

          if (config?.widths?.[col]) {
            width = config.widths[col];
          } else if (col === "Check") {
            width = "3%";
          }

          return (
            <th
              key={col + "-" + i}
              className="text-center align-middle pt-2 fw-bold text-primary small"
              style={{
                whiteSpace: "nowrap",
                width: width,
              }}
              title={col === "Check" ? "Pilih Semua" : col}
            >
              {enableCheckbox && col === "Check" ? (
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                col
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

TableHeader.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  enableCheckbox: PropTypes.bool,
  isAllSelected: PropTypes.bool,
  onSelectAll: PropTypes.func,
  config: PropTypes.object,
};

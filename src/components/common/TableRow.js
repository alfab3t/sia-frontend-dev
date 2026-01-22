"use client";

import Icon from "./Icon";
import Badge from "./Badge";
import DOMPurify from "isomorphic-dompurify";
import PropTypes from "prop-types";
import { useCallback } from "react";

export default function TableRow({
  row,
  columns,
  enableCheckbox,
  isSelected,
  isRowSelectable,
  onSelectRow,
  onToggle,
  onCancel,
  onDelete,
  onDetail,
  onEdit,
  onApprove,
  onReject,
  onSent,
  onUpload,
  onFinal,
  onPrint,
  config,
  rowClassName,
}) {
  const renderAction = useCallback(
    (actions, id, status) =>
      actions.map((action) => {
        switch (action) {
          case "Toggle": {
            if (status === "Aktif") {
              return (
                <Icon
                  key={`${id}-${action}`}
                  name="toggle-on"
                  type="Bold"
                  cssClass="btn px-1 py-0 text-primary"
                  title="Nonaktifkan"
                  onClick={() => onToggle(id)}
                />
              );
            } else if (status === "Tidak Aktif") {
              return (
                <Icon
                  key={`${id}-${action}`}
                  name="toggle-off"
                  type="Bold"
                  cssClass="btn px-1 py-0 text-secondary"
                  title="Aktifkan"
                  onClick={() => onToggle(id)}
                />
              );
            }
            return null;
          }

          case "Detail":
            return (
              <Icon
                key={`${id}-${action}`}
                name="eye"
                title="Lihat Detail"
                cssClass="text-primary btn px-1 py-0"
                onClick={() => onDetail(id)}
              />
            );
          case "Cancel":
            return (
              <Icon
                key={`${id}-${action}`}
                name="file-earmark-x"
                type="Bold"
                cssClass="btn px-1 py-0 text-danger"
                title="Batalkan"
                onClick={() => onCancel(id)}
              />
            );

          case "Edit":
            return (
              <Icon
                key={`${id}-${action}`}
                name="pencil-square"
                title="Ubah"
                cssClass="text-primary btn px-1 py-0"
                onClick={() => onEdit(id)}
              />
            );
          case "Delete":
            return (
              <Icon
                key={`${id}-${action}`}
                name="trash"
                title="Hapus"
                cssClass="text-danger btn px-1 py-0"
                onClick={() => onDelete(id)}
              />
            );
          case "Approve":
            return (
              <Icon
                key={`${id}-${action}`}
                name="check"
                type="Bold"
                cssClass="btn px-1 py-0 text-success"
                title="Setujui Pengajuan"
                onClick={() => onApprove(id)}
              />
            );
          case "Reject":
            return (
              <Icon
                key={`${id}-${action}`}
                name="x"
                type="Bold"
                cssClass="btn px-1 py-0 text-danger"
                title="Tolak Pengajuan"
                onClick={() => onReject(id)}
              />
            );
          case "Print":
            return (
              <Icon
                key={`${id}-${action}`}
                name="printer"
                title="Cetak"
                cssClass="text-primary btn px-1 py-0"
                onClick={() => onPrint(id)}
              />
            );
          case "Sent":
            return (
              <Icon
                key={`${id}-${action}`}
                name="send"
                title="Kirim"
                cssClass="text-primary btn px-1 py-0"
                onClick={() => onSent(id)}
              />
            );
          case "Upload":
            return (
              <Icon
                key={`${id}-${action}`}
                name="cloud-upload"
                type="Bold"
                cssClass="btn px-1 py-0 text-primary"
                title="Unggah Berkas"
                onClick={() => onUpload(id)}
              />
            );
          case "Final":
            return (
              <Icon
                key={`${id}-${action}`}
                name="hammer"
                type="Bold"
                cssClass="btn px-1 py-0 text-primary"
                title="Finalkan"
                onClick={() => onFinal(id)}
              />
            );
          default: {
            try {
              if (typeof action === "object") {
                return (
                  <Icon
                    key={row.id + "Custom" + action.IconName}
                    name={action.IconName}
                    type="Bold"
                    cssClass="btn px-1 py-0 text-primary"
                    title={action.Title}
                    onClick={action.Function}
                  />
                );
              }
              return null;
            } catch {
              return null;
            }
          }
        }
      }),
    [
      row.id,
      row.Status,
      onApprove,
      onCancel,
      onDelete,
      onDetail,
      onEdit,
      onFinal,
      onPrint,
      onReject,
      onSent,
      onToggle,
      onUpload,
    ]
  );

  const canSelect = isRowSelectable ? isRowSelectable(row) : true;
  const customRowClass = rowClassName ? rowClassName(row) : "";

  return (
    <tr
      className={`align-middle ${
        isSelected ? "table-active" : ""
      } ${customRowClass}`}
    >
      {columns.map((col, index) => {
        let cell;
        const isWrap = config?.isWrap?.[col] || false;

        if (enableCheckbox && col === "Check") {
          if (canSelect) {
            cell = (
              <input
                type="checkbox"
                className="form-check-input"
                checked={isSelected}
                onChange={() => onSelectRow(row.id)}
                style={{ cursor: "pointer" }}
              />
            );
          } else {
            cell = <span className="text-muted small"></span>;
          }
        } else if (col === "Status") {
          cell = <Badge status={row[col]} />;
        } else if (col === "Aksi") {
          cell = renderAction(row[col], row.id, row.Status);
        } else if (typeof row[col] === "string") {
          cell = (
            <div
              style={{ whiteSpace: isWrap ? "normal" : "nowrap" }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(row[col]),
              }}
            ></div>
          );
        } else {
          cell = row[col];
        }

        return (
          <td
            key={col + "-" + index}
            className="py-2 border-bottom"
            style={{
              textAlign: row.Alignment ? row.Alignment[index] : "center",
            }}
          >
            {cell}
          </td>
        );
      })}
    </tr>
  );
}

TableRow.propTypes = {
  row: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  enableCheckbox: PropTypes.bool,
  isSelected: PropTypes.bool,
  isRowSelectable: PropTypes.func,
  onSelectRow: PropTypes.func,
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

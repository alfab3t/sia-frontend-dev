import PropTypes from "prop-types";
import Button from "./Button";
import { useMemo } from "react";

export default function Paging({
  pageSize,
  pageCurrent,
  totalData,
  navigation,
}) {
  const totalPage = Math.ceil(totalData / pageSize);
  const startData = (pageCurrent - 1) * pageSize + 1;
  const endData = Math.min(pageCurrent * pageSize, totalData);

  const pageButtons = useMemo(() => {
    let buttons = [];

    buttons.push(
      <Button
        key="prev"
        classType="primary rounded-circle me-2"
        isDisabled={pageCurrent === 1}
        onClick={() => navigation(pageCurrent - 1)}
        style={{ width: 25, height: 25, padding: 0 }}
        cssIcon="text-white"
        iconName="chevron-left"
      />
    );

    const visiblePages = [1];
    if (pageCurrent > 2) visiblePages.push(pageCurrent - 1);
    if (pageCurrent !== 1 && pageCurrent !== totalPage)
      visiblePages.push(pageCurrent);
    if (pageCurrent < totalPage - 1) visiblePages.push(pageCurrent + 1);
    if (!visiblePages.includes(totalPage)) visiblePages.push(totalPage);

    const uniquePages = [...new Set(visiblePages)].sort((a, b) => a - b);
    let lastPage = 0;

    uniquePages.forEach((page) => {
      if (page - lastPage > 1) {
        buttons.push(
          <span key={`dots-${page}`} className="mx-1 text-secondary">
            ...
          </span>
        );
      }

      buttons.push(
        <Button
          key={page}
          classType={`sm ${
            page === pageCurrent ? "fw-bold text-primary" : "text-secondary"
          } bg-transparent border-0`}
          onClick={() => navigation(page)}
          label={page}
        />
      );

      lastPage = page;
    });

    buttons.push(
      <Button
        key="next"
        classType="btn btn-primary rounded-circle ms-2"
        isDisabled={pageCurrent === totalPage}
        onClick={() => navigation(pageCurrent + 1)}
        style={{ width: 25, height: 25, padding: 0 }}
        cssIcon="text-white"
        iconName="chevron-right"
      />
    );

    return buttons;
  }, [pageCurrent, totalPage, navigation]);

  return (
    <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
      <div className="d-flex align-items-center">{pageButtons}</div>
      <div className="text-secondary small">
        Menampilkan{" "}
        <span className="fw-semibold text-primary">
          {startData}-{endData}
        </span>{" "}
        dari <span className="fw-semibold text-primary">{totalData}</span> data
      </div>
    </div>
  );
}

Paging.propTypes = {
  pageSize: PropTypes.number.isRequired,
  pageCurrent: PropTypes.number.isRequired,
  totalData: PropTypes.number.isRequired,
  navigation: PropTypes.func.isRequired,
};

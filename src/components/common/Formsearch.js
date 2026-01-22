"use client";

import { useState, useCallback } from "react";
import Filter from "./Filter";
import PropTypes from "prop-types";

export default function Formsearch({
  onAdd,
  onSearch,
  onFilter,
  onExport,
  searchPlaceholder = "Pencarian",
  showAddButton = true,
  showSearchBar = true,
  showFilterButton = true,
  showExportButton = true,
  addButtonText = "Tambah",
  filterContent = null,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch(searchQuery);
    }
  }, [onSearch, searchQuery]);

  const handleAdd = useCallback(() => {
    if (onAdd) {
      onAdd();
    }
  }, [onAdd]);

  const handleFilterApply = useCallback(() => {
    if (onFilter) {
      onFilter();
    }
  }, [onFilter]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    }
  }, [onExport]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className="pt-1 pb-3">
      <div className="row g-2 align-items-center">
        {showAddButton && (
          <div className="col-12 col-md-auto">
            <button
              className="btn btn-primary w-100 w-md-auto d-flex align-items-center justify-content-center gap-2"
              onClick={handleAdd}
            >
              <span className="fw-bold">+</span>
              <span>{addButtonText}</span>
            </button>
          </div>
        )}

        {showSearchBar && (
          <div className="col-12 col-md">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button className="btn btn-primary" onClick={handleSearch}>
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
        )}

        {(showFilterButton || showExportButton) && (
          <div className="col-12 col-md-auto">
            <div className="d-flex gap-2">
              {showFilterButton && (
                <div className="btn-group">
                  <Filter onClick={handleFilterApply}>{filterContent}</Filter>
                </div>
              )}
              {showExportButton && (
                <button
                  className="btn btn-primary flex-fill flex-md-grow-0 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleExport}
                >
                  <i className="bi bi-box-arrow-up"></i>
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .input-group input {
          border-right: none;
        }

        .input-group .btn {
          border-left: none;
        }

        @media (min-width: 768px) {
          .w-md-auto {
            width: auto !important;
          }

          .flex-md-grow-0 {
            flex-grow: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

Formsearch.propTypes = {
  onAdd: PropTypes.func,
  onSearch: PropTypes.func,
  onFilter: PropTypes.func,
  onExport: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  showAddButton: PropTypes.bool,
  showSearchBar: PropTypes.bool,
  showFilterButton: PropTypes.bool,
  showExportButton: PropTypes.bool,
  addButtonText: PropTypes.string,
  filterContent: PropTypes.node,
};

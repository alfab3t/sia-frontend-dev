import DatePicker from "react-datepicker";
import { id } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Label from "./Label";
import PropTypes from "prop-types";

export default function Calendar({
  type = "single",
  label = "Pilih Tanggal",
  value,
  onChange,
  required = false,
  error = "",
  ...rest
}) {
  return (
    <div className="mb-2">
      <Label text={label} htmlFor={label} tooltip={label} required={required} />

      {type === "single" ? (
        <DatePicker
          selected={value || null}
          onChange={(val) => onChange?.(val)}
          dateFormat="dd MMMM yyyy"
          locale={id}
          className={`form-control rounded-5 ${error ? "is-invalid" : ""}`}
          style={{ fontSize: "1rem", color: "#212529" }}
          showYearDropdown={true}
          scrollableYearDropdown={true}
          yearDropdownItemNumber={50}
          {...rest}
        />
      ) : (
        <div className="d-flex flex-column gap-2">
          <DatePicker
            selectsRange={true}
            startDate={value?.[0] || null}
            endDate={value?.[1] || null}
            onChange={(update) => onChange?.(update)}
            dateFormat="dd MMMM yyyy"
            locale={id}
            className={`form-control rounded-5 ${error ? "is-invalid" : ""}`}
            showYearDropdown={true}
            scrollableYearDropdown={true}
            yearDropdownItemNumber={50}
            {...rest}
          />
        </div>
      )}

      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}

Calendar.propTypes = {
  type: PropTypes.oneOf(["single", "range"]),
  label: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  ]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
};

import { forwardRef } from "react";
import Label from "./Label";
import PropTypes from "prop-types";

const DropDown = (
  {
    arrData,
    type = "pilih",
    label = "",
    forInput,
    isRequired = false,
    isDisabled = false,
    errorMessage,
    showLabel = true,
    ...props
  },
  ref
) => {
  let placeholder = "";

  switch (type) {
    case "pilih":
      placeholder = (
        <option value="" disabled>
          {"-- Pilih " + label + " --"}
        </option>
      );
      break;
    case "semua":
      placeholder = <option value="">-- Semua --</option>;
      break;
    default:
      break;
  }

  return (
    <div className="mb-3">
      {showLabel && (
        <Label
          required={isRequired}
          text={label}
          htmlFor={forInput}
          tooltip={label}
        />
      )}
      <select
        className="form-select rounded-4 blue-element"
        id={forInput}
        name={forInput}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {placeholder}
        {arrData &&
          arrData.length > 0 &&
          arrData.map((data) => {
            return (
              <option key={data.Value} value={data.Value}>
                {data.Text}
              </option>
            );
          })}
      </select>
      {errorMessage ? (
        <span className="fw-normal text-danger"> {errorMessage}</span>
      ) : (
        ""
      )}
    </div>
  );
};

export default forwardRef(DropDown);

DropDown.propTypes = {
  arrData: PropTypes.arrayOf(
    PropTypes.shape({
      Value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      Text: PropTypes.string.isRequired,
    })
  ).isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  forInput: PropTypes.string,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool,
  errorMessage: PropTypes.string,
  showLabel: PropTypes.bool,
};

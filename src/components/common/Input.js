import PropTypes from "prop-types";
import Label from "./Label";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  name,
  id,
  disabled = false,
  required = false,
  className = "",
  error = "",
  helperText = "",
  size = "md",
  readOnly = false,
  autoComplete = "off",
  maxLength,
}) {
  const sizeClasses = {
    sm: "form-control-sm",
    md: "form-control",
    lg: "form-control-lg",
  };

  const sizeClass = sizeClasses[size] || "";

  return (
    <div className={`mb-2 ${className}`}>
      {label && (
        <Label
          htmlFor={id || name}
          text={label}
          tooltip={label}
          required={required}
        />
      )}

      <input
        type={type}
        className={`form-control rounded-5 ${sizeClass} ${
          error ? "is-invalid" : ""
        }`}
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        autoComplete={autoComplete}
        maxLength={maxLength}
      />

      {helperText && !error && <div className="form-text">{helperText}</div>}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  readOnly: PropTypes.bool,
  autoComplete: PropTypes.string,
  maxLength: PropTypes.number,
};

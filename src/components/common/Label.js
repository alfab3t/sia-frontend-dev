import PropTypes from "prop-types";

export default function Label({
  text,
  htmlFor,
  required = false,
  tooltip = "",
  className = "",
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`form-label fw-bold text-primary small mb-2 ${className}`}
      title={tooltip}
    >
      {text}
      {required && <span className="text-danger ms-1">*</span>}
    </label>
  );
}

Label.propTypes = {
  text: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  className: PropTypes.string,
};

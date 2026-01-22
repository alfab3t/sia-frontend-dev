import PropTypes from "prop-types";

export default function Icon({ name, cssClass = "", ...rest }) {
  return <i className={"bi bi-" + name + " " + cssClass} {...rest}></i>;
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  cssClass: PropTypes.string,
};

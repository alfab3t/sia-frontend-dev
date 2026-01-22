import PropTypes from "prop-types";
import React from "react";

const ValidationError = ({ message }) => {
  if (!message) return null;

  return <div className="invalid-feedback d-block">{message}</div>;
};

ValidationError.propTypes = {
  message: PropTypes.string,
};

export default ValidationError;

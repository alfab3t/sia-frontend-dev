import PropTypes from "prop-types";
import Icon from "./Icon";

export default function Button({
  classType,
  iconName,
  label = "",
  title = "",
  type = "button",
  isDisabled = false,
  cssIcon = "",
  iconOnly = false,
  ...rest
}) {
  return (
    <button
      type={type}
      className={iconOnly ? classType : "btn rounded-3 btn-" + classType}
      {...rest}
      title={title}
      disabled={isDisabled}
    >
      {iconName && (
        <Icon
          name={iconName}
          cssClass={label === "" ? cssIcon : "pe-2 " + cssIcon}
        />
      )}
      {label}
    </button>
  );
}

Button.propTypes = {
  classType: PropTypes.string,
  iconName: PropTypes.string,
  label: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  isDisabled: PropTypes.bool,
  cssIcon: PropTypes.string,
  iconOnly: PropTypes.bool,
};

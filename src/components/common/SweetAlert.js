import swal from "sweetalert";

const SweetAlert = ({
  title,
  text,
  icon,
  confirmText = "",
  inputType = null,
  placeholder = "",
}) => {
  if (confirmText === "") {
    swal({
      title: title,
      text: text,
      icon: icon,
    });
  } else {
    let textContent = "";
    const additional = {
      content: {
        element: inputType,
        attributes: {
          placeholder: placeholder,
          onchange: function () {
            textContent = this.value;
          },
        },
      },
    };

    return swal({
      title: title,
      text: text,
      icon: icon,
      buttons: {
        cancel: "Batal",
        confirm: {
          text: confirmText,
          value: true,
        },
      },
      dangerMode: icon === "warning",
      ...(inputType === null ? null : additional),
    }).then((value) => {
      if (inputType !== null && value)
        return textContent === "" ? "-" : textContent;
      return value;
    });
  }
};

export default SweetAlert;

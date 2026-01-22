import toast from "react-hot-toast";

const defaultOptions = {
  position: "top-right",
  style: {
    borderRadius: "12px",
    padding: "12px 16px",
  },
};

const Toast = {
  success: (message, position = "top-right") =>
    toast.success(message, {
      ...defaultOptions,
      position,
      style: {
        ...defaultOptions.style,
      },
    }),

  error: (message, position = "top-right") =>
    toast.error(message, {
      ...defaultOptions,
      position,
      style: {
        ...defaultOptions.style,
      },
    }),
};

export default Toast;

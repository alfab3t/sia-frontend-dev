import PropTypes from "prop-types";
import { BarLoader } from "react-spinners";

export default function Loading({
  loading = false,
  color = "#0d6efd",
  size = 60,
  message = "",
}) {
  if (!loading) return null;

  return (
    <div
      className="loading-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(5px)",
      }}
    >
      <BarLoader color={color} size={size} />
      {message && (
        <div className="mt-3 fw-semibold" style={{ fontSize: "0.95rem" }}>
          {message}
        </div>
      )}
    </div>
  );
}

Loading.propTypes = {
  loading: PropTypes.bool,
  color: PropTypes.string,
  size: PropTypes.number,
  message: PropTypes.string,
};

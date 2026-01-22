import { useState } from "react";
import PropTypes from "prop-types";

export default function Img({
  src,
  alt = "Image",
  width,
  height,
  className = "",
  style = {},
  fluid = false,
  rounded = false,
  circle = false,
  thumbnail = false,
  lazy = true,
  fallback = "/placeholder.jpg",
  onLoad,
  onError,
  objectFit = "cover",
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);

  let imgClassName = className;
  if (fluid) imgClassName += " img-fluid";
  if (rounded) imgClassName += " rounded";
  if (circle) imgClassName += " rounded-circle";
  if (thumbnail) imgClassName += " img-thumbnail";

  const imgStyle = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
    objectFit: objectFit,
    transition: "opacity 0.3s ease",
    opacity: 1,
    ...style,
  };

  const handleLoad = (e) => {
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    }
    if (onError) onError(e);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={imgClassName}
      style={imgStyle}
      loading={lazy ? "lazy" : "eager"}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
}

Img.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  style: PropTypes.object,
  fluid: PropTypes.bool,
  rounded: PropTypes.bool,
  circle: PropTypes.bool,
  thumbnail: PropTypes.bool,
  lazy: PropTypes.bool,
  fallback: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  objectFit: PropTypes.oneOf([
    "cover",
    "contain",
    "fill",
    "none",
    "scale-down",
  ]),
};

export function ImgWithPlaceholder({
  src,
  alt = "Image",
  width = 300,
  height = 200,
  className = "",
  placeholderColor = "#e9ecef",
  ...props
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div style={{ position: "relative", width, height }}>
      {isLoading && !hasError && (
        <output
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: placeholderColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: className.includes("rounded") ? "0.375rem" : 0,
          }}
          aria-label="Memuat gambar"
        >
          <div className="spinner-border text-secondary" aria-hidden="true" />
          <span className="visually-hidden">Loading...</span>
        </output>
      )}
      <Img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </div>
  );
}

ImgWithPlaceholder.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  placeholderColor: PropTypes.string,
};

export function Avatar({
  src,
  alt = "Avatar",
  size = 50,
  name,
  className = "",
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorFromName = (name) => {
    if (!name) return "#6c757d";
    const colors = [
      "#007bff",
      "#6610f2",
      "#6f42c1",
      "#e83e8c",
      "#dc3545",
      "#fd7e14",
      "#ffc107",
      "#28a745",
      "#20c997",
      "#17a2b8",
      "#6c757d",
      "#343a40",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (hasError || !src) {
    return (
      <div
        className={`rounded-circle d-flex align-items-center justify-content-center ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: getColorFromName(name),
          color: "white",
          fontSize: size * 0.4,
          fontWeight: "bold",
        }}
      >
        {getInitials(name || alt)}
      </div>
    );
  }

  return (
    <Img
      src={src}
      alt={alt}
      width={size}
      height={size}
      circle
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.number,
  name: PropTypes.string,
  className: PropTypes.string,
};

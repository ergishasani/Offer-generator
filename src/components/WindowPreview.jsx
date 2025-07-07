// src/components/WindowPreview.jsx
import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import { ReactComponent as DefaultWindow } from "../assets/window.svg";
import "../assets/styles/components/_windowPreview.scss";

const MM_TO_PX = 0.5;

const WindowPreview = forwardRef(function WindowPreview(
  { widthMm, heightMm, svgUrl },
  ref
) {
  const style = {
    width: `${Number(widthMm) * MM_TO_PX}px`,
    height: `${Number(heightMm) * MM_TO_PX}px`,
  };

  return (
    <div className="window-preview" style={style} ref={ref}>
      {svgUrl ? (
        <img
          src={svgUrl}
          alt="Custom window preview"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <DefaultWindow
          preserveAspectRatio="none"
          width="100%"
          height="100%"
        />
      )}
    </div>
  );
});

export default WindowPreview;

WindowPreview.propTypes = {
  widthMm:  PropTypes.number.isRequired,
  heightMm: PropTypes.number.isRequired,
  svgUrl:   PropTypes.string,
};

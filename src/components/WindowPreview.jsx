// src/components/WindowPreview.jsx
import React from "react";
import PropTypes from "prop-types";
import { ReactComponent as DefaultWindow } from "../assets/window.svg";
import "../assets/styles/components/_windowPreview.scss";

const MM_TO_PX = 0.5;

export default function WindowPreview({ widthMm, heightMm, svgUrl }) {
  const style = {
    width:  `${widthMm * MM_TO_PX}px`,
    height: `${heightMm * MM_TO_PX}px`,
  };

  return (
    <div className="window-preview" style={style}>
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
}

WindowPreview.propTypes = {
  widthMm:  PropTypes.number.isRequired,
  heightMm: PropTypes.number.isRequired,
  svgUrl:   PropTypes.string,
};

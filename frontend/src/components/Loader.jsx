import React from 'react';

const Loader = ({ message = "Analyzing document structure...", submessage = "Communicating with extraction engine..." }) => {
  return (
    <div className="loader-container">
      <div className="cyber-spinner">
        <div className="spinner-outer"></div>
        <div className="spinner-inner"></div>
      </div>
      <div className="loader-title">{message}</div>
      <div className="loader-subtitle">{submessage}</div>
    </div>
  );
};

export default Loader;

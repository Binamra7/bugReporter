import React from "react";
import "./Modal.css";

function Modal(props) {
  const toggle = (e) => {
    props.del(e.target.value);
    props.show(false);
  };

  return (
    <>
      <div className="modal">
        <div className="overlay" onClick={() => props.show(false)}></div>
        <div className="modal__content">
          <h2>{props.heading}</h2>
          {!props.submit && (
            <div className="delete__bug__info">
              <span>
                <h3>Title: </h3>
                {props.bug.bugTitle}
              </span>
              <span>
                <h3>Description: </h3>
                {props.bug.bugDescription}
              </span>
              <span>
                <h3>Severity: </h3>
                {props.bug.bugSeverity}
              </span>
            </div>
          )}
          <div className="modal__buttons">
            {!props.submit && (
              <>
                <button className="yes" value="true" onClick={toggle}>
                  Yes
                </button>
                <button className="no" value="false" onClick={toggle}>
                  No
                </button>
              </>
            )}
            {props.submit && (
              <button value="bugSubmit" onClick={() => props.show(false)}>
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;

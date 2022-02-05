import React, { useState } from "react";
import "./Modal.css";

function Modal(props) {
  //   const [modal, setModal] = useState(true);
  //   const toggle = () => setModal(!modal);

  const handleYes = (e) => {
    const ans = e.target.value;
    props.onShow(ans);
    console.log("Delete");
    console.log(ans);
  };

  const handleNo = (e) => {
    props.onShow(e.target.value);
    console.log("No");
  };

  return (
    <>
      <div className="overlay">
        <div className="modal">
          <h2>Are you sure you want to delete this bug?</h2>
          <div className="modal__buttons">
            <button className="yes" value="delete" onClick={handleYes}>
              Yes
            </button>
            <button className="no" value="dont delete" onClick={handleNo}>
              No
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;

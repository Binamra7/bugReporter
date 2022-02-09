import React, { useState, useEffect } from "react";
import "./Bug.css";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { RiDeleteBinLine } from "react-icons/ri";
import Modal from "./modal/Modal";

function Bug(props) {
  const [modal, setModal] = useState(false);
  const [delete1, setDelete1] = useState("");
  const [selectedBug, setSelectedBug] = useState({});

  const handleResolveClick = (bug) => {
    props.handleResolveRequest(bug);
  };

  const handleDeleteClick = (bug) => {
    setModal(true);
    setSelectedBug(bug);
  };

  const handleDelete = () => {
    setModal(false);
    props.handleDeleteRequest(selectedBug);
  };

  useEffect(() => {
    if (delete1 === "true") {
      handleDelete();
    }
  }, [delete1]);

  if (modal) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "scroll";
  }

  return (
    <>
      {modal && (
        <Modal
          heading="Are you sure you want to delete this bug?"
          show={setModal}
          del={setDelete1}
          bug={selectedBug}
        />
      )}
      <div className="bug__info" key={props.bugInfo._id}>
        <div
          className="bug__info__left"
          style={
            props.bugInfo.bugResolved
              ? { borderLeft: "1rem solid green" }
              : props.bugInfo.bugSeverity === "high"
              ? { borderLeft: "1rem solid red" }
              : props.bugInfo.bugSeverity === "medium"
              ? { borderLeft: "1rem solid #f16b05" }
              : { borderLeft: "1rem solid #ffff2d" }
          }
        >
          <h1 className="index">
            {props.i + 1}. {props.bugInfo.bugSeverity}
          </h1>

          <p>
            <div className="make__bold">Reported Date:&nbsp;</div>
            {props.bugInfo.createdAt === undefined
              ? ""
              : props.bugInfo.createdAt.substr(0, 10)}
          </p>
          <p>
            <div className="make__bold">Status:&nbsp;</div>
            {props.bugInfo.bugResolved === true ? "Resolved" : "Active"}
          </p>
          {props.bugInfo.bugResolved && (
            <p>
              <div className="make__bold">Resolved Date: &nbsp;</div>
              {props.bugInfo.updatedAt === undefined
                ? ""
                : props.bugInfo.updatedAt.substr(0, 10)}
            </p>
          )}
        </div>
        <div className="bug__info__right">
          <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>
            {props.bugInfo.bugTitle}
          </h1>
          <h2 style={{ fontSize: "16px" }}>{props.bugInfo.bugDescription}</h2>
        </div>
        <div className="bug__info__buttons">
          {!props.bugInfo.bugResolved && (
            <button
              className="bug__info__buttons__resolved"
              onClick={() => handleResolveClick(props.bugInfo)}
            >
              Send to
              {props.bugInfo.bugResolved !== true ? " Resolved" : " Active"}
            </button>
          )}
          <button
            className="bug__info__buttons__delete"
            onClick={() => handleDeleteClick(props.bugInfo)}
          >
            Delete
          </button>
          {/* {!props.bugInfo.bugResolved && (
            <div
              className="bug__info__buttons__resolved"
              onClick={() => handleResolveClick(props.bugInfo)}
            >
              <BsBoxArrowUpRight className="BsBoxArrowUpRight" />
              <p>
                Send to
                {props.bugInfo.bugResolved !== true ? " Resolved" : " Active"}
              </p>
            </div>
          )} */}
          {/* <div
            className="bug__info__buttons__delete"
            onClick={() => handleDeleteClick(props.bugInfo)}
          >
            <RiDeleteBinLine className="RiDeleteBinLine" />
            <p>Delete</p>
          </div> */}
        </div>
      </div>
    </>
  );
}

export default Bug;

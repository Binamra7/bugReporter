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
    console.log(bug);
  };

  const handleDeleteClick = (bug) => {
    console.log("delete", bug);
    setModal(true);
    setSelectedBug(bug);
  };

  const handleDelete = () => {
    setModal(false);
    props.handleDeleteRequest(selectedBug);
  };

  useEffect(() => {
    if (delete1 === "true") {
      console.log("delete confirmed");
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
      {modal && <Modal heading='Are you sure you want to delete this bug?' show={setModal} del={setDelete1} bug={selectedBug} />}
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
              : { borderLeft: "1rem solid #d5c013" }
          }
        >
          {props.i + 1}.<h1>{props.bugInfo.bugSeverity}</h1>
          <p>
            Reported Date:{" "}
            {props.bugInfo.createdAt === undefined
              ? ""
              : props.bugInfo.createdAt.substr(0, 10)}
          </p>
          <p>
            Status: {props.bugInfo.bugResolved === true ? "Resolved" : "Active"}
          </p>
          {props.bugInfo.bugResolved && (
            <p>
              Resolved Date:{" "}
              {props.bugInfo.updatedAt === undefined
                ? ""
                : props.bugInfo.updatedAt.substr(0, 10)}
            </p>
          )}
        </div>
        <div className="bug__info__right">
          <h1>{props.bugInfo.bugTitle}</h1>
          <h3>{props.bugInfo.bugDescription}</h3>
        </div>
        <div className="bug__info__buttons">
          {!props.bugInfo.bugResolved && (
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
          )}
          <div
            className="bug__info__buttons__delete"
            onClick={() => handleDeleteClick(props.bugInfo)}
          >
            <RiDeleteBinLine className="RiDeleteBinLine" />
            <p>Delete</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Bug;

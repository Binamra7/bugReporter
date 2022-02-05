import React, { useState } from "react";
import "./Bug.css";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { RiDeleteBinLine } from "react-icons/ri";
import Modal from "./modal/Modal";

function Bug(props) {
  const handleResolveClick = (bug) => {
    props.handleResolveRequest(bug);
    console.log(bug);
  };

  const handleDelete = (bug) => {
    // props.handleDeleteRequest(bug);
    console.log("delete", bug);

    setQuery(!query);
  };
  const handleQuery = (props) => {
    // handleDelete(props);
    setQuery(!query);
    console.log("handle query props", props);
    if (props === "delete") {
      setDelete1(true);
    } else setDelete1(false);
  };
  const handleClick = (props) => {
    console.log("from bugs", props);
    setQuery(!query);
    if (delete1) {
      console.log(props, "ready to be deleted");
    }
  };

  const [query, setQuery] = useState(false);
  const [delete1, setDelete1] = useState(false);

  return (
    <>
      {query && <Modal onShow={handleQuery} />}
      <div className="bug__info" key={props.bugInfo._id}>
        <div className="bug__info__left">
          <h1>
            {props.i + 1}. {props.bugInfo.bugSeverity}
          </h1>
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
          <div
            className="bug__info__buttons__delete"
            onClick={() => handleClick(props.bugInfo)}
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

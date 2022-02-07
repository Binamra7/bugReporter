import React, { useState, useEffect } from "react";
import Bug from "./Bug";
import "./ActiveBugs.css";

function ActiveBugs(props) {
  const [bugs, setBugs] = useState([]);

  useEffect(() => {
    setBugs(props.bugs);
  }, [props.bugs]);
  const [sort, setSort] = useState("Severity");

  const handleClick = (e) => {
    if (sort === "Severity") {
      setSort("Date Submitted");
      setBugs((prevState) =>
        prevState.sort((a, b) => {
          if (a.bugSeverity === b.bugSeverity) {
            return 0;
          } else if (a.bugSeverity === "high") {
            return -1;
          } else if (b.bugSeverity === "high") {
            return 1;
          } else if (a.bugSeverity === "medium") {
            return -1;
          } else if (b.bugSeverity === "medium") {
            return 1;
          } else if (a.bugSeverity === "low") {
            return -1;
          } else if (b.bugSeverity === "low") {
            return 1;
          }
          return 0;
        })
      );
    }
    if (sort === "Date Submitted") {
      setSort("Severity");
      setBugs((prevState) =>
        prevState.sort((a, b) => {
          if (a.createdAt < b.createdAt) {
            return -1;
          } else if (b.createdAt < a.createdAt) {
            return 1;
          }
          return 0;
        })
      );
    }
  };
  const onResolvedRequest = (bug) => {
    props.onUpdateBugs(bug);
  };
  const onDeleteBug = (bug) => {
    props.onDeleteFromActive(bug);
  };

  return (
    <>
      <h1 style={{ marginTop: "1rem" }}>{bugs.length} active bugs</h1>
      <button className="sort__button" onClick={handleClick}>
        Sort by {sort}
      </button>
      {bugs.length === 0 ? (
        <h1>No active bugs to display.</h1>
      ) : (
        bugs.map((bug, index) => (
          <Bug
            bugInfo={bug}
            i={index}
            key={bug._id}
            handleResolveRequest={onResolvedRequest}
            handleDeleteRequest={onDeleteBug}
          />
        ))
      )}
    </>
  );
}
export default ActiveBugs;

import React, { useState, useEffect } from "react";
import Bug from "./Bug";
import "./ActiveBugs.css";

function ActiveBugs(props) {
  const [bugs, setBugs] = useState([]);

  useEffect(() => {
    setBugs(props.bugs);
  }, [props.bugs]);
  console.log(bugs);
  //   console.log(props.bugs);
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
    console.log("This is the bug", bug);
    props.onUpdateBugs(bug);
  };
  const onDeleteBug = (bug) => {
    console.log("This is the bug", bug);
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
        bugs
          // .slice(0)
          // .reverse()
          .map((bug, index) => (
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

  /*
      const handleBugClick = (props) => {
        dummySubmit.findIndex((bug) => {
          //   if (bug.bugT()itle === props.bugTitle) {
          //     console.log(bug);
          //     // props.setBug(bug);
          //   }
        });
        console.log("Clicked");
        console.log(props);
      };
    
      return (
        <div className="active__bugs__container">
          <h1>ACTIVE BUGS</h1>
          <button onClick={handleClick} className="sort__button">
            Sort by {sort}
          </button>
          {dummySubmit
            .slice(0)
            .reverse()
            .map((bug, index) => (
              <div
                style={
                  bug.bugSeverity === "high"
                    ? { borderLeft: "3rem solid red" }
                    : bug.bugSeverity === "medium"
                    ? { borderLeft: "3rem solid #f16b05" }
                    : { borderLeft: "3rem solid #d5c013" }
                }
                className="bug__info"
                key={index}
                onClick={(index) => handleBugClick(bug)}
              >
                <h2 className="urgency">
                  {index + 1}. {bug.bugSeverity}
                </h2>
                <h2 className="title">{bug.bugTitle}</h2>
                <h2 key={index} className="description">
                  {bug.bugDescription}
                </h2>
                <p>
                  Reported date:{" "}
                  {bug.createdAt == undefined ? "" : bug.createdAt.substring(0, 10)}
                </p>
                <p>
                  Reported time:{" "}
                  {bug.createdAt == undefined
                    ? ""
                    : bug.createdAt.substring(11, 16)}{" "}
                  GMT{" "}
                </p>
              </div>
            ))}
        </div>
      );*/
}
export default ActiveBugs;

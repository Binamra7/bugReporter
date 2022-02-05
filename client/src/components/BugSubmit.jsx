import React, { useState, useEffect } from "react";
// import axios from "axios";
import "./BugSubmit.css";
import ActiveBugs from "./ActiveBugs";

function BugSubmit(props) {
  // useEffect(() => {
  //   axios.get("http://localhost:5000/bug/").then((res) => {
  //     console.log(res.data);
  //     setDummySubmit(res.data);
  //   });
  //   // const res = fetch("http://localhost:5000/bug/");
  //   // console.log(res.data);
  // }, []);

  // const [sort, setSort] = useState("Severity");

  // const [dummySubmit, setDummySubmit] = useState([
  //   {
  //     bugTitle: "Images not showing up",
  //     bugDescription: "Images disappear when I click on them",
  //     bugSeverity: "high",
  //   },
  //   {
  //     bugTitle: "Image not Loading",
  //     bugDescription: "The images does not load on home page",
  //     bugSeverity: "low",
  //   },
  //   {
  //     bugTitle: "App crashing",
  //     bugDescription: "App crashed when I clicked on the image",
  //     bugSeverity: "high",
  //   },
  //   {
  //     bugTitle: "Close button does not work",
  //     bugDescription:
  //       "when i click on the close button, the pop up doesn't close",
  //     bugSeverity: "medium",
  //   },
  // ]);

  // // const [originalArray, setOriginalArray] = useState([]);

  // const handleClick = (e) => {
  //   if (sort === "Severity") {
  //     // setOriginalArray(dummySubmit);
  //     setSort("Date Submitted");
  //     setDummySubmit((prevState) =>
  //       prevState.sort((a, b) => {
  //         if (a.bugSeverity === b.bugSeverity) {
  //           return 0;
  //         } else if (a.bugSeverity === "high") {
  //           return 1;
  //         } else if (b.bugSeverity === "high") {
  //           return -1;
  //         } else if (a.bugSeverity === "medium") {
  //           return 1;
  //         } else if (b.bugSeverity === "medium") {
  //           return -1;
  //         } else if (a.bugSeverity === "low") {
  //           return 1;
  //         } else if (b.bugSeverity === "low") {
  //           return -1;
  //         }
  //         return 0;
  //       })
  //     );
  //   }
  //   if (sort === "Date Submitted") {
  //     setSort("Severity");
  //     //sort array by date added
  //     console.log(dummySubmit);
  //     setDummySubmit((prevState) =>
  //       prevState.sort((a, b) => {
  //         if (a.createdAt < b.createdAt) {
  //           return -1;
  //         } else if (b.createdAt < a.createdAt) {
  //           return 1;
  //         }
  //         return 0;
  //       })
  //     );
  //   }
  // };
  // const handleBugClick = (props) => {
  //   dummySubmit.findIndex((bug) => {
  //     if (bug.bugTitle === props.bugTitle) {
  //       console.log(bug);
  //       // props.setBug(bug);
  //     }
  //   });
  //   console.log("Clicked");
  //   console.log(props);
  // };

  return (
    <>
      <h1>All bugs</h1>
      <div className="container">
        <ActiveBugs/>
        {/* <button onClick={handleClick} className="sort__button">
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
            </div>
          ))} */}
      </div>
    </>
  );
}

export default BugSubmit;

import React, { useState } from "react";
import "./BugSubmit.css";

function BugSubmit(props) {
  const [show, setShow] = useState(new Array().fill(false));

  const [dummySubmit, setDummySubmit] = useState([
    {
      bugTitle: "Images not showing up",
      bugDescription: "Images disappear when I click on them",
      bugSeverity: "high",
    },
    {
      bugTitle: "Image not Loading",
      bugDescription: "The images does not load on home page",
      bugSeverity: "low",
    },
    {
      bugTitle: "App crashing",
      bugDescription: "App crashed when I clicked on the image",
      bugSeverity: "high",
    },
    {
      bugTitle: "Close button does not work",
      bugDescription:
        "when i click on the close button, the pop up doesn't close",
      bugSeverity: "medium",
    },
  ]);

  const handleClick = (e) => {
    setDummySubmit((prevState) =>
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
      })
    );
  };

  return (
    <>
      <h1>All bugs</h1>
      <div className="container">
        <button onClick={handleClick}>Sort by severity</button>
        {dummySubmit.map((bug, index) => (
          <div className="bug__container" key={index}>
            {/* <div className="bug__title">{bug.bugTitle}</div> */}
            <div
              style={
                bug.bugSeverity === "high"
                  ? { backgroundColor: "rgb(229, 0, 0)" }
                  : bug.bugSeverity === "medium"
                  ? { backgroundColor: "rgb(181, 88, 9)" }
                  : { backgroundColor: "rgb(132, 141, 3)" }
              }
              className="bug__info"
              key={index}
              //   onClick={() => {
              //     setShow(
              //       show.map((element, i) => (i === index ? !element : false))
              //     );
              //   }}
            >
              <h2 className="urgency">{bug.bugSeverity}</h2>
              <h2 className="title">{bug.bugTitle}</h2>
              {/* {show[index] && */}
              <h2 key={index} className="description">
                {bug.bugDescription}
              </h2>
              {/* } */}
              {/* {bug.bugTitle} */}
            </div>
            {/* <div className="bug__severity">{bug.bugSeverity}</div> */}

            {/* <div className="bug__title">{bug.bugTitle}</div>
            <div className="bug__desc">{bug.bugDescription}</div>
            <div className="bug__severity">{bug.bugSeverity}</div> */}
          </div>
        ))}
      </div>
    </>
  );
}

export default BugSubmit;

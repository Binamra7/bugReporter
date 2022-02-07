import axios from "axios";
import React, { useState } from "react";
import Modal from "./modal/Modal";
import "./reportBug.css";

function ReportBug() {
  const [bug, setBug] = useState({
    bugSeverity: "",
    bugTitle: "",
    bugDescription: "",
  });

  const [modal, setModal] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [severity, setSeverity] = useState("");
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [check, setCheck] = useState(false);

  const handleTitleChange = (e) => {
    setBugTitle(e.target.value);
    setBug((prevBug) => ({
      bugTitle: e.target.value,
      bugDescription: prevBug.bugDescription,
      bugSeverity: prevBug.bugSeverity,
    }));
  };

  const handleDescriptionChange = (e) => {
    setBug((prevBug) => ({
      bugTitle: prevBug.bugTitle,
      bugDescription: e.target.value,
      bugSeverity: prevBug.bugSeverity,
    }));

    setBugDescription(e.target.value);
  };

  const handleRadioChange = (e) => {
    setCheck(true);
    setBug((prevBug) => ({
      bugTitle: prevBug.bugTitle,
      bugDescription: prevBug.bugDescription,
      bugSeverity: e.target.value,
    }));
    setSeverity(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !(
        bugTitle.trim().length > 0 &&
        bugDescription.trim().length > 0 &&
        severity.trim().length > 0
      )
    ) {
      setIsValid(false);
      console.log("Invalid entry");
      alert("Please fill all the fields properly");
    } else {
      setIsValid(true);
      console.log(bug);
      setBugDescription("");
      setBugTitle("");
      setModal(true);
      axios.post("http://localhost:5000/bug/add", bug);
      // .then((res) => {
      // console.log(res);
      // });
    }
  };

  return (
    <div className="report_bug">
      {modal && (
        <Modal
          heading="Bug Submitted Successfully!"
          show={setModal}
          submit={true}
        />
      )}
      <form onSubmit={handleSubmit}>
        <h1 style={{ justifyContent: "left", marginBottom: "2rem" }}>
          Report a bug
        </h1>

        {/*bug title and its description*/}
        <label className="bug__explanation">
          Bug Title:
          <br />
          <input
            style={!isValid ? { borderColor: "red" } : { borderColor: "black" }}
            value={bugTitle}
            type="text"
            name="bugName"
            className="bug__title"
            onChange={handleTitleChange}
          />
        </label>
        <label className="bug__explanation">
          Bug Description:
          <br />
          <textarea
            style={!isValid ? { borderColor: "red" } : { borderColor: "black" }}
            value={bugDescription}
            type="text"
            name="bugDescription"
            className="bug__desc"
            onChange={handleDescriptionChange}
          />
        </label>
        {/*bug severity*/}
        <div className="radio__container">
          <h2>How severe is it?</h2>
          <label style={{ color: "#e50000" }}>
            <input
              onChange={handleRadioChange}
              className="urgency__input"
              type="radio"
              name="severity"
              value="high"
              // checked={check}
            />
            High
          </label>
          <br />
          <label style={{ color: "#b55809" }}>
            <input
              onChange={handleRadioChange}
              className="urgency__input"
              type="radio"
              name="severity"
              value="medium"
              // checked={check}
            />
            Medium
          </label>
          <br />
          <label style={{ color: "#848d03" }}>
            <input
              onChange={handleRadioChange}
              className="urgency__input"
              type="radio"
              name="severity"
              value="low"
              // checked={check}
            />
            Low
          </label>
          <br />
        </div>
        <button
          style={
            !isValid ? { backgroundColor: "red" } : { backgroundColor: "black" }
          }
        >
          Submit
        </button>
      </form>
    </div>
  );
}
export default ReportBug;

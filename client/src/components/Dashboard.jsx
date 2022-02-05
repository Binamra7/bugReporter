import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";
import ActiveBugs from "./ActiveBugs";
import ResolvedBugs from "./ResolvedBugs";

function Dashboard() {
  const [bugs, setBugs] = useState({
    active: [],
    resolved: [],
  });

  useEffect(() => {
    axios.get("http://localhost:5000/bug/").then((res) => {
      //add those bugs which have bugResolved value of false to active and
      // others to resolved
      setBugs({
        active: res.data.filter((bug) => bug.bugResolved !== true),
        resolved: res.data.filter((bug) => bug.bugResolved === true),
      });
    });
  }, []);

  const [status, setStatus] = useState("active");

  const onResolvedRequest = (bug) => {
    console.log("This is the bug from dashboard", bug);
    axios
      .put(`http://localhost:5000/bug/update/${bug._id}`, {
        bugTitle: bug.bugTitle,
        bugDescription: bug.bugDescription,
        bugSeverity: bug.bugSeverity,
        bugResolved: true,
      })
      .then((res) => {
        console.log(res.data);
        setBugs({
          active: bugs.active.filter((b) => b._id !== bug._id),
          resolved: [...bugs.resolved, bug],
        });
      });
  };

  return (
    <div className="dashboard">
      <h1>Welcome to dashboard</h1>
      <div className="dashboard__navbar">
        <button
          style={status === "active" ? { opacity: "1" } : {}}
          onClick={() => setStatus("active")}
          className="active"
        >
          Active Bugs ({bugs.active.length})
        </button>
        <button
          style={status === "resolved" ? { opacity: "1" } : {}}
          onClick={() => setStatus("resolved")}
          className="resolved"
        >
          Resolved Bugs ({bugs.resolved.length})
        </button>
      </div>
      <div className="bug__container">
        {status === "active" ? (
          <ActiveBugs bugs={bugs.active} onUpdateBugs={onResolvedRequest} />
        ) : (
          <ResolvedBugs bugs={bugs.resolved} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;

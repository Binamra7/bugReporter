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
		axios.get("https://bug-reporter-api.herokuapp.com/bug/").then((res) => {
			//add those bugs which have bugResolved value of false to active and
			// others to resolved
			setBugs({
				active: res.data.filter((bug) => bug.bugResolved == false),
				resolved: res.data.filter((bug) => bug.bugResolved === true),
			});
		});
	}, []);

	const [status, setStatus] = useState("active");

	const onResolvedRequest = (bug) => {
		axios
			.put(`http://localhost:5000/bug/update/${bug._id}`, {
				bugTitle: bug.bugTitle,
				bugDescription: bug.bugDescription,
				bugSeverity: bug.bugSeverity,
				bugResolved: true,
			})
			.then((res) => {
				setBugs({
					active: bugs.active.filter((b) => b._id !== bug._id),
					resolved: [...bugs.resolved, bug],
				});
			});
	};

	const onDeleteBug = (bug) => {
		axios.delete(`http://localhost:5000/bug/${bug._id}`).then((res) => {
			setBugs({
				active: bugs.active.filter((b) => b._id !== bug._id),
				resolved: bugs.resolved.filter((b) => b._id !== bug._id),
			});
		});
	};

	return (
		<div className="dashboard">
			<h1 style={{ margin: "2rem 0" }}>Welcome to dashboard</h1>
			<div className="dashboard__navbar">
				<button
					style={
						status === "active"
							? {
									backgroundColor: "#ffbfbf",
									color: "black",
									border: "none",
							  }
							: { border: "none" }
					}
					onClick={() => setStatus("active")}
					className="active"
				>
					Active Bugs ({bugs.active.length})
				</button>
				<button
					style={
						status === "resolved"
							? {
									backgroundColor: "rgb(157 225 143)",
									color: "black",
									border: "none",
							  }
							: { border: "none" }
					}
					onClick={() => setStatus("resolved")}
					className="resolved"
				>
					Resolved Bugs ({bugs.resolved.length})
				</button>
			</div>
			<div
				className="bug__container"
				style={
					status === "resolved"
						? {
								backgroundColor: "rgb(157 225 143)",
						  }
						: { border: "none" }
				}
			>
				{status === "active" ? (
					<ActiveBugs
						bugs={bugs.active}
						onUpdateBugs={onResolvedRequest}
						onDeleteFromActive={onDeleteBug}
					/>
				) : (
					<ResolvedBugs
						bugs={bugs.resolved}
						onDeleteFromResolved={onDeleteBug}
					/>
				)}
			</div>
		</div>
	);
}

export default Dashboard;

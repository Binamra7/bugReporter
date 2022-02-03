import "./App.css";
import React from "react";
import ReportBug from "./components/ReportBug";
import { BrowserRouter as Router, Route,Routes,Link} from "react-router-dom";
import BugSubmit from "./components/BugSubmit";

function App() {

  return (
    <>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<ReportBug />} />
            <Route path="/submitted" element={<BugSubmit/>} />
          </Routes>
        </div>
      </Router>      
    </>
  );  
}

export default App;

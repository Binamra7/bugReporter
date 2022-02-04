const router = require('express').Router();
let Bug = require('../models/bug.model');

router.route('/').get((req, res) => {
  Bug.find()
    .then(bug => res.json(bug))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/add').post((req, res) => {
  const bugTitle = req.body.bugTitle;
  const bugDescription = req.body.bugDescription;
  const bugSeverity = req.body.bugSeverity;
  const date = Date.parse(req.body.date);

  const newBugReport = new Bug({
    bugTitle,
    bugDescription,
    bugSeverity,
    date,
  });

  newBugReport.save()
  .then(() => res.json('Bug added!'))
  .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').get((req, res) => {
  Bug.findById(req.params.id)
    .then(bug => res.json(bug))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req, res) => {
  Bug.findByIdAndDelete(req.params.id)
    .then(() => res.json('Bug deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// router.route('/update/:id').post((req, res) => {
//   Exercise.findById(req.params.id)
//     .then(exercise => {
//       exercise.username = req.body.username;
//       exercise.description = req.body.description;
//       exercise.duration = Number(req.body.duration);
//       exercise.date = Date.parse(req.body.date);

//       exercise.save()
//         .then(() => res.json('Exercise updated!'))
//         .catch(err => res.status(400).json('Error: ' + err));
//     })
//     .catch(err => res.status(400).json('Error: ' + err));
// });


module.exports = router;
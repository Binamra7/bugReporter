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
  const bugResolved = false;
  const date = Date.parse(req.body.date);

  const newBugReport = new Bug({
    bugTitle,
    bugDescription,
    bugSeverity,
    bugResolved,
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

router.route('/update/:id').put((req, res) => {
  Bug.findById(req.params.id)
    .then(Bug => {
      Bug.bugTitle = req.body.bugTitle;
      Bug.bugDescription = req.body.bugDescription;
      Bug.bugSeverity = req.body.bugSeverity;
      Bug.bugResolved = req.body.bugResolved;
      Bug.save()
        .then(() => res.json('Bug updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
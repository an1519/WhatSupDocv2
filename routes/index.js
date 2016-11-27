var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Doctor = mongoose.model('Doctor'),
    Patient = mongoose.model('Patient'),
    Medication = mongoose.model('Medication');

/* GET home page. */
router.get('/', function(req, res) {
  console.log('username: ' + req.session.username);
  res.render('index', {user: req.session.username});
});

router.get('/login', function(req, res) {
  res.render('login');
});

router.post('/login', function(req,res,next) {
  passport.authenticate('local', function(err,user) {
    if(user) {
      req.logIn(user, function(err) {
        req.session.username = req.body.username;
        res.redirect('/dashboard');
      });
    } else {
      res.render('login', {unsuccesful: true});
    }
  })(req, res, next);
});

router.get('/register', function(req, res) {
  res.render('register', {user:req.session.username});
});

router.post('/register', function(req, res) {
  req.session.username = req.body.username;
  User.findOne({username: req.session.username}, function(err, user, count) {
    if(!user) {
      var doctor = new Doctor({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        hospital: req.body.hospital,
        doctorType: req.body.speciality
      });
      doctor.save(function(err, doctor, count) {
        if(err) {
          console.log("Error saving user profile: " , err);
          res.render('register',{register:true});
        } else {
          //Authenticate
          User.register(new User({username:req.body.username}), req.body.password, function(err, user){
            if(err) {
              res.render('register', {register:true});
            } else {
              passport.authenticate('local')(req, res,function() {
                    res.redirect('/dashboard'); //success
              });
            }
          });
        }
      });
    }
  });
});

router.get('/dashboard', function(req, res){
  //Get the current user profile
  var user = req.session.username;
  if(!user) {
    res.redirect('/login');
  }
  Doctor.findOne({username:user}, function(err, doctor, count){
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
      console.log("where da slugs at : " , doctor);
      res.render('dashboard', {user:doctor});
    }
  });
});

router.get('/register-patient', function(req, res) {
  var user = req.session.username;
  if(!user) {
    res.redirect('/login');
  }
  res.render('register-patient');
});

router.post('/register-patient', function(req, res) {
  // create new patient object
  var meds = [];
  var med_names = [];
  var dosages = [];
  var freqs = [];

  med_names.push(req.body.med_name);
  dosages.push(req.body.dosage);
  freqs.push(req.body.frequency);

  for (var i = 0; i < med_names.length; i++) {
    var med = new Medication({
      name: med_names[i],
      dosage: dosages[i],
      frequency: freqs[i] // dropdown (day, week, ...)
    });
    meds.push(med);
  }

  var patient = new Patient({
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    condition: req.body.condition,
    age: req.body.age,
    weight: req.body.weight,
    height: req.body.height,
    gender: req.body.gender.toLowerCase(),
    medications: meds
  });

  patient.save(function(err, patient, count) {
    if(err) {
      console.log("Error saving new patient" , err);
      res.redirect('/dashboard');
    } else {
      console.log("patient's slug: " , patient.slug);
      // push it into the doctor's patients list
      Doctor.findOne({username:req.session.username}, function(err, doctor, count) {
        if(err) {
          console.log("Error finding doctor: ", err);
        } else {
          doctor.patients.push(patient);
          doctor.save(function(saveErr, saveDoc, saveCount) {
            if(saveErr) {
              console.log("Error saving doctor: ", saveErr);
            } else {
              res.redirect('/dashboard');
            }
          });
        }
      });
    }
  });
});

router.get('/patient/:slug', function(req, res) {
  console.log('in : ', req.params.slug);
  Patient.findOne({slug: req.params.slug}, function(err, patient, count) {
    res.render('patient', {patient:patient});
  });
});

router.get('/logout', function(req,res) {
  req.session.destroy();
  req.logout();
  res.redirect('/');
})

module.exports = router;
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Chance = require('chance');
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const app = express();
const chance = new Chance();
const config = functions.config().firebase;
config.databaseAuthVariableOverride = {
  uid: 'firebase-functions'
}

admin.initializeApp(config);

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = (req, res, next) => {
  // console.log('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !req.cookies.__session) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>',
        'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    // console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  }
  admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    // console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
  }).catch(error => {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
  });
};

app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);

app.post('/newplayer', (request, response) => {
  var uid = request.user.uid;
  var gameId = request.body.gameId

  if (gameId) {
    admin.database().ref(`gameModel/game/${gameId}/teams`).once('value', (data) => {
      if (data.exists()) {
        var teams = data.val();
        var minArray = []
        var min = -1;
        for (var i in teams) {
          if ((min < 0) || (teams[i] < min)) {
            min = teams[i];
            minArray = [i]
          } else if (teams[i] === min) {
            minArray.push(i)
          }
        }

        var team = minArray.length > 1 ? minArray[chance.integer({min: 0, max: minArray.length - 1})] : minArray[0]

        var updates = {}
        updates[`gameModel/gamePlayers/${gameId}/teams/${team}/${uid}`] = {
          score: 0,
          value: true
        }
        updates[`gameModel/gamePlayers/${gameId}/players/${uid}`] = { team }

        admin.database().ref().update(updates).then(() => {
          return admin.database().ref(`gameModel/game/${gameId}/teams/${team}`).transaction((currentTeamNumber) => {
            return currentTeamNumber + 1
          }).then(() => {
            response.status(200).json({ team })
          })
        }).catch((error) => {
          response.status(500).json(error)
        })
      } else {
        response.status(404).json({
          error: 'No game using ' + gameId
        })
      }
    })
  } else {
    response.status(404).json({
      error: 'No gameId given'
    })
  }
})

app.post('/getbubbles', (request, response) => {
  console.log(config)

  var uid = request.user.uid;
  var gameId = request.body.gameId

  if (gameId) {
    admin.database().ref(`gameModel/game/${gameId}/status`).once('value', (data) => {
      if (data.exists() && data.val() === 'active') {
        admin.database().ref('questionModel/question').once('value', (questionSnapshot) => {
          var questionsObj = questionSnapshot.val();
          var questions = []
          for (var i in questionsObj) {
            var question = {
              question: questionsObj[i].question,
              answers: []
            }
            for (var j in questionsObj[i].answers) {
              question.answers.push({
                $key: j,
                answer: questionsObj[i].answers[j].answer
              })
            }
            question.answers = question.answers.sort(() => {
              return chance.integer({min: -20, max: 20})
            })
            questions.push(question)
          }

          var questionsSorted = questions.sort(() => {
            return chance.integer({min: -20, max: 20})
          })

          var newQuestions = []

          for (var m = 0; m < 40; m++) {
            newQuestions.push(questionsSorted[m])
          }

          response.status(200).json({
            questions: newQuestions
          })
        })
      } else {
        response.status(404).json({
          error: 'gameId doesn\'t exist or not active'
        })
      }
    })
  } else {
    response.status(404).json({
      error: 'No gameId given'
    })
  }

})

app.get('/test', (request, response) => {
  response.status(200).json({
    hello: 'world'
  })
})


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.auth = functions.https.onRequest(app)

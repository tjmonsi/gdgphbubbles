var parse = require('csv-parse');
var fs = require('fs');
var firebase = require('firebase');
var input = fs.readFileSync('./questions.csv', 'utf8');
var questions = [];

var config = {
  apiKey: "AIzaSyBWrTmvpFsKGX3OjiVvTlmeC99cYRQ9vg4",
  authDomain: "gdgphbubbles.firebaseapp.com",
  databaseURL: "https://gdgphbubbles.firebaseio.com",
  projectId: "gdgphbubbles",
  storageBucket: "gdgphbubbles.appspot.com",
  messagingSenderId: "522135348069"
};
firebase.initializeApp(config);

parse(input, {comment: '#'}, (err, output) => {
  for (var i in output) {
    var q = output[i];
    var question = {
      answers: []
    };
    for (var j in q) {
      if (j == 0) {
        question.question = q[j];
      } else if (j == 1) {
        question.correct = q[j];
        question.answers.push(q[j])
      } else {
        question.answers.push(q[j])
      }
    }
    questions.push(question)
  }
  // console.log(questions)

  var updates = {}
  for (var k in questions) {
    var key = firebase.database().ref('questionModel/question').push().key

    updates[`questionModel/question/${key}/question`] = questions[k].question

    var correct = firebase.database().ref(`questionModel/question/${key}/answers`).push().key

    updates[`questionModel/question/${key}/correct`] = correct
    updates[`questionModel/question/${key}/answers/${correct}`] = {
      answer: questions[k].answers[0]
    }

    for (var l=1; l<questions[k].answers.length; l++) {
      var answer = firebase.database().ref(`questionModel/question/${key}/answers`).push().key
      updates[`questionModel/question/${key}/answers/${answer}`] = {
        answer: questions[k].answers[l]
      }
    }
  }

  firebase.database().ref().update(updates).then(()=>{
    console.log('done')
  })

  // firebase.database()
  // console.log(firebase)
  // fs.writeFileSync('questions.json', JSON.stringify(questions))
})

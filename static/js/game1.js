const question = document.getElementById("question");
const choices = Array.from(document.getElementsByClassName("choice-text"));
const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("score");
const progressBarFull = document.getElementById("progressBarFull");
const loader = document.getElementById("loader");
const game = document.getElementById("game");
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuesions = [];

var past_questions = [];
var past_id = 0;

let questions = [];

fetch(
  "/API/play"
)
  .then(res => {
    return res.json();
  })
  .then(loadedQuestions => {
    questions = loadedQuestions.map(loadedQuestion => { return loadedQuestion; });
    startGame();
  })
  .catch(err => {
    console.error(err);
  });

//CONSTANTS
const CORRECT_BONUS = 10;
var MAX_QUESTIONS = 3;
var interval;

startGame = () => {
  MAX_QUESTIONS = questions.length;
  questionCounter = 0;
  score = 0;
  availableQuesions = [...questions];
  getNewQuestion();
  game.classList.remove("hidden");
  loader.classList.add("hidden");
};

function score_submit(response){
  req = $.ajax({
    url: "/API/score" + "?score=" + score + "&uid=" + response,
    type: "post",
  });

  req.done(function (res, ts, jqXHR1){
    if(res == 0){
      console.log(res);
      window.location.assign("/history/" + response)
    }
  });
}

function send_json(){  
  request = $.ajax({
    url: "/API/history" ,//+ "?json=" + JSON.stringify(past_questions) + "&score=" + score,
    data: {
      json: past_questions,
      score: score
    },
    type: "post",
    // data: "json=" + JSON.stringify(past_questions)
  });

  // Callback handler that will be called on success
  request.done(function (response, textStatus, jqXHR) {
    // Log a message to the console
    // console.log(response);
    test_ajax = response;
    score_submit(response);
  });

  // Callback handler that will be called on failure
  request.fail(function (jqXHR, textStatus, errorThrown) {
    // Log the error to the console
    alert(
      "The following error occurred: " +
      textStatus, errorThrown
    );
  });

}

getNewQuestion = () => {
  if (availableQuesions.length === 0 || questionCounter >= MAX_QUESTIONS) {
    send_json();
  }
  else {
    document.getElementById('time').innerHTML = 10;

    questionCounter++;
    progressText.innerText = `Question ${questionCounter}/${MAX_QUESTIONS}`;
    //Update the progress bar
    progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;

    const questionIndex = Math.floor(Math.random() * availableQuesions.length);
    currentQuestion = availableQuesions[questionIndex];


    past_questions.push(currentQuestion);


    question.innerHTML = currentQuestion.question;
    // console.log(currentQuestion.question);

    choices.forEach(choice => {
      const number = choice.dataset["number"];
      choice.innerHTML = currentQuestion["choice" + number];
    });

    availableQuesions.splice(questionIndex, 1);
    acceptingAnswers = true;

    var count = 10;
    interval = setInterval(function () {

      count--;
      document.getElementById('time').innerHTML = count;
      if (count === 0) {
        setTimeout(function () {
          clearInterval(interval);
          // or...
          getNewQuestion();
        }, 750);
      }
    }, 1000);
  }

};

choices.forEach(choice => {
  choice.addEventListener("click", e => {
    if (!acceptingAnswers) return;

    clearInterval(interval);

    acceptingAnswers = false;

    const selectedChoice = e.target;

    const selectedAnswer = selectedChoice.dataset["number"];

    // console.log(selectedAnswer);
    past_questions[past_id++]["chosen"] = selectedAnswer;


    const classToApply =
      selectedAnswer == currentQuestion.answer ? "correct" : "incorrect";

    if (classToApply === "correct") {
      incrementScore(CORRECT_BONUS);
    }

    selectedChoice.parentElement.classList.add(classToApply);

    setTimeout(() => {
      selectedChoice.parentElement.classList.remove(classToApply);
      getNewQuestion();
    }, 1000);
  });
});

incrementScore = num => {
  score += num;
  scoreText.innerText = score;
};
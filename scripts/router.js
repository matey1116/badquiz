const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const Account = require("../models/Account");
const Daily = require("../models/Daily");
const Weekly = require("../models/Weekly");
const Monthly = require("../models/Monthly");
const bcrypt = require("bcryptjs");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const queryString = require("query-string");
const axios = require("axios");
const fs = require("fs");
const History = require("../models/History");
const GameHistory = require("../models/GameHistory");
const { timeStamp } = require("console");
const getScoreBoard = (schema) => {
    return new Promise((resolve, reject) => {
        let text = "<ol>";
        schema
            .find({})
            .sort("-score")
            .limit(5)
            .then(async (dailyArray) => {
                if (dailyArray) {
                    const userIDs = dailyArray.map((o) => o.userID);

                    let names = {};
                    await Account.find({ _id: userIDs })
                        .select("FName LName")
                        .then((results) => {
                            results.forEach((u) => {
                                names[u._id] = u.FName + " " + u.LName;
                            });
                        });

                    dailyArray.forEach((d) => {
                        //fetch FName and LName from Accounts
                        text += `<li><mark>${names[d.userID]}</mark><small>${d.score}</small></li>`;
                        // console.log();
                    });
                    text += "</ol>";
                    resolve(text);
                } else resolve("");
            })
            .catch((err) => {
                console.log(err);
                reject(err);
            });
    });
};

router.get("/", async (request, response) => {
    const dailyBoard = getScoreBoard(Daily);
    const weeklyBoard = getScoreBoard(Weekly);
    const monthlyBoard = getScoreBoard(Monthly);

    Promise.all([dailyBoard, weeklyBoard, monthlyBoard]).then((values) => {
        return response.render("../ejs/index.ejs", {
            logged: request.cookies.logged,
            daily: values[0],
            weekly: values[1],
            monthly: values[2],
        });
    });
});

router.get("/register", (request, response) => {
    if (request.cookies.logged === "true") {
        return response.redirect("/");
    }

    const stringifiedParams = queryString.stringify({
        client_id: 408349306420652,
        redirect_uri: "http://localhost:3000/API/facebook_helper",
        scope: "email", // comma seperated string
        response_type: "code",
        auth_type: "rerequest",
        display: "popup",
    });
    const facebookLoginUrl = `https://www.facebook.com/v4.0/dialog/oauth?${stringifiedParams}`;
    return response.render("../ejs/register.ejs", { facebookLoginUrl: facebookLoginUrl });
});

router.post("/API/register", (request, response) => {
    if (request.cookies.logged === "true") {
        return response.redirect("/");
    }

    if (request.body.fname && request.body.lname && request.body.email && request.body.password) {
        if (
            request.body.password[0] !== request.body.password[1] ||
            request.body.password[0].length < 8 ||
            !request.body.password[0].match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/g)
        ) {
            return response.send("password");
        }
        if (!request.body.fname.match(/[a-z]+/gim) || request.body.fname.length > 12) {
            return response.send("fname");
        }
        if (!request.body.lname.match(/[a-z]+/gim) || request.body.lname.length > 12) {
            return response.send("lname");
        }

        Account.findOne({ email: request.body.email })
            .then((res) => {
                if (res) return response.send("exists");
                else {
                    const newAccount = new Account({
                        _id: uuidv4(),
                        email: request.body.email,
                        password: bcrypt.hashSync(request.body.password[0], bcrypt.genSaltSync(12)),
                        FName: request.body.fname,
                        LName: request.body.lname,
                        lastOnline: Date.now(),
                    });

                    newAccount.save((err, newDoc) => {
                        if (!err) {
                            return response
                                .cookie("logged", newDoc._id, { expires: new Date(Date.now() + 2592000000), httpOnly: true })
                                .redirect("/");
                        } else {
                            return response.sendStatus(500);
                        }
                    });
                }
            })
            .catch((err) => response.sendStatus(500));
    }
});

router.get("/API/facebook_helper", async (request, response) => {
    axios
        .get(
            `https://graph.facebook.com/v4.0/oauth/access_token?client_id=408349306420652&client_secret=e6f1f092d272237b694136b4d4d78fe6&redirect_uri=http://localhost:3000/API/facebook_helper&code=${request.query.code}`
        )
        .then((res) => {
            axios.get(`https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=${res.data.access_token}`).then((resUser) => {
                console.log(resUser.data); //email, first_name, last_name
                Account.findOne({ email: resUser.data.email }).then((r) => {
                    if (r) {
                        //set JWT and LOGIN
                        console.log(r);
                        return response.cookie("logged", r._id, { expires: new Date(Date.now() + 2592000000), httpOnly: true }).redirect("/");
                    } else {
                        const newAccount = new Account({
                            _id: uuidv4(),
                            email: resUser.data.email,
                            password: bcrypt.hashSync("89qwey89qwnehcyaf89seyf7a8sdnycf78ayasdyuavnd7fas78dfnyva78", bcrypt.genSaltSync(12)),
                            FName: resUser.data.first_name,
                            LName: resUser.data.last_name,
                            lastOnline: Date.now(),
                        });

                        newAccount.save((err, newDoc) => {
                            if (!err) {
                                //send the JSON TOKENS
                                return response
                                    .cookie("logged", newDoc._id, { expires: new Date(Date.now() + 2592000000), httpOnly: true })
                                    .redirect("/");
                            } else {
                                return response.sendStatus(500);
                            }
                        });
                    }
                });
            });
        });
});

router.post("/API/google_sign", (request, response) => {
    const client = new OAuth2Client("820226875616-ae9qglnqgh31nnom4ml9ker1sqk2adn8.apps.googleusercontent.com");
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: request.body.idtoken,
            audience: "820226875616-ae9qglnqgh31nnom4ml9ker1sqk2adn8.apps.googleusercontent.com", // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        console.log(payload);
        const userid = payload["sub"];

        Account.findOne({ email: payload.email }).then((res) => {
            if (res) {
                //set JWT and LOGIN
                return response.cookie("logged", res._id, { expires: new Date(Date.now() + 2592000000), httpOnly: true }).redirect("/");
            } else {
                const newAccount = new Account({
                    _id: uuidv4(),
                    email: payload.email,
                    password: bcrypt.hashSync(payload.at_hash, bcrypt.genSaltSync(12)),
                    FName: payload.given_name,
                    LName: payload.family_name,
                    lastOnline: Date.now(),
                });

                newAccount.save((err, newDoc) => {
                    if (!err) {
                        //send the JSON TOKENS
                        return response.cookie("logged", newDoc._id, { expires: new Date(Date.now() + 2592000000), httpOnly: true }).redirect("/");
                    } else {
                        return response.sendStatus(500);
                    }
                });
            }
        });
    }
    verify().catch(console.error);
});

router.get("/login", (request, response) => {
    if (request.cookies.logged === "true") {
        return response.redirect("/");
    }
    const stringifiedParams = queryString.stringify({
        client_id: 408349306420652,
        redirect_uri: "http://localhost:3000/API/facebook_helper",
        scope: "email", // comma seperated string
        response_type: "code",
        auth_type: "rerequest",
        display: "popup",
    });
    const facebookLoginUrl = `https://www.facebook.com/v4.0/dialog/oauth?${stringifiedParams}`;
    return response.render("../ejs/login.ejs", { facebookLoginUrl: facebookLoginUrl });
});

router.post("/API/login", (request, response) => {
    if (request.body.email && request.body.password) {
        Account.findOne({ email: request.body.email }).then((acc) => {
            if (acc) {
                if (bcrypt.compareSync(request.body.password, acc.password)) {
                    return response.cookie("logged", acc._id, { expires: new Date(Date.now() + 2592000000), httpOnly: true }).send("1");
                } else {
                    return response.send("pass");
                }
            } else {
                return response.send("user");
            }
        });
    }
});

router.post("/API/logout", (request, response) => {
    response.clearCookie("logged").send("0");
});

router.get("/play", (request, response) => {
    return response.render("../ejs/play.ejs");
});

router.get("/API/play", (request, response) => {
    var templates = [
        "When was the movie {{0}} released?",
        "How much money in US dollars has {{0}} grossed?",
        "How much barrels of oil does {{0}} have?",
        "When was the book {{0}} released?",
        "Who is the author of {{0}}?",
        "In what language was {{0}} originally written in?",
        "Which book was originally written in {{1}}?",
        "How many goals has {{0}} scored in European Cup and UEFA Championhip?",
        "For which clubs {{0}} played?",
        "Who played for {{1}}?",
        "How many points has {{0}} scored during his NBA career?",
        "How many games has {{0}} played during his NBA career?",
        "When and where has {{0}} won his first race?",
        "Who won his first race in the {{1}}?",
        "When and where has {{0}} won his last race?",
        "Who won his last race in the {{1}}?",
        "What is the country calling code of {{0}}?",
        "Which country has {{1}} as its country calling code?",
        "What is the capital of {{0}}?",
        "{{1}} is the capital of which country?",
        "Which country has {{1}} as its country code domain?",
        "In which country {{1}} is the life expectancy?",
        "Which country has {{1}} as its national dish?",
        "What is the national dish of {{0}}?",
        "Which country is in {{1}}?",
        "What is the population of {{0}}?",
        "Which country has the population of {{1}}?",
        "Which country is the only one in {{1}}?",
        "What continent is {{0}} located in?",
    ];
    var files = [
        "movie_year.json",
        "movie_gross_amount.json",
        "countries_by_oil.json",
        "book_release.json",
        "book_authors.json",
        "book_language.json",
        "book_language.json",
        "uefa_top_scorers.json",
        "uefa_clubs.json",
        "uefa_clubs.json",
        "nba_top_scorers.json",
        "nba_total_games.json",
        "f1_first_win.json",
        "f1_first_win.json",
        "f1_last_win.json",
        "f1_last_win.json",
        "country-by-calling-code.json",
        "country-by-calling-code.json",
        "country-by-capital-city.json",
        "country-by-capital-city.json",
        "country-by-domain-tld.json",
        "country-by-life-expectancy.json",
        "country-by-national-dish.json",
        "country-by-national-dish.json",
        "country-by-region-in-world.json",
        "country-by-population.json",
        "country-by-population.json",
        "country-by-continent.json",
        "country-by-continent.json",
    ];

    var final = [];
    let user_question_templates = templates;
    let user_files = files;
    let n_of_questions = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < n_of_questions; i++) {
        // for (let i = 0; i < rand(5,15); i++) {
        final.push(select_random());
    }
    return response.json(final);
    function select_random() {
        if (user_question_templates.length) {
            user_question_templates = templates;
            user_files = files;
        }

        var question_select_id = Math.floor(Math.random() * user_question_templates.length);
        var template = user_question_templates[question_select_id];
        var data = user_files[question_select_id];
        var question_data_path = data;

        var data_array = JSON.parse(fs.readFileSync(__dirname + "/data/" + question_data_path)); //     SOFTWIRED :)

        user_question_templates.splice(question_select_id, 1);
        user_files.splice(question_select_id, 1);
        let correct_id = Math.floor(Math.random() * data_array.length);
        let correct = data_array[correct_id];
        data_array.splice(correct_id, 1);

        let choice1, choice2, choice3, choice4;
        if (template.match(/\{\{0\}\}/)) {
            template = template.replace(/\{\{0\}\}/, correct.name);

            choice1 = correct.data;
            let answers = [choice1];

            do {
                let choice2_id = Math.floor(Math.random() * data_array.length);
                choice2 = data_array[choice2_id]["data"];
                data_array.splice(choice2_id, 1);
            } while (answers.includes(choice2));
            answers.push(choice2);

            do {
                let choice3_id = Math.floor(Math.random() * data_array.length);
                choice3 = data_array[choice3_id]["data"];
                data_array.splice(choice3_id, 1);
            } while (answers.includes(choice3));
            answers.push(choice3);

            do {
                let choice4_id = Math.floor(Math.random() * data_array.length);
                choice4 = data_array[choice4_id]["data"];
                data_array.splice(choice4_id, 1);
            } while (answers.includes(choice4));
            answers.push(choice4);
        } else if (template.match(/\{\{1\}\}/)) {
            let correct_id = Math.floor(Math.random() * data_array.length);
            let correct = data_array[correct_id];

            template = template.replace(/\{\{1\}\}/, correct.data);

            choice1 = correct.name;
            var choice1Data = correct["data"];
            var answers = [choice1Data];

            do {
                let choice2_id = Math.floor(Math.random() * data_array.length);
                choice2 = data_array[choice2_id]["name"];
                var choice2Data = data_array[choice2_id]["data"];
                data_array.splice(choice2_id, 1);
            } while (answers.includes(choice2Data));
            answers.push(choice2Data);

            do {
                let choice3_id = Math.floor(Math.random() * data_array.length);
                choice3 = data_array[choice3_id]["name"];
                var choice3Data = data_array[choice3_id]["data"];
                data_array.splice(choice3_id, 1);
            } while (answers.includes(choice3Data));
            answers.push(choice3Data);

            do {
                let choice4_id = Math.floor(Math.random() * data_array.length);
                choice4 = data_array[choice4_id]["name"];
                var choice4Data = data_array[choice4_id]["data"];
                data_array.splice(choice4_id, 1);
            } while (answers.includes(choice4Data));
            answers.push(choice4Data);
        }
        let changeCorrect = Math.floor(Math.random() * 4) + 1;
        let temp = choice1;

        if (changeCorrect === 2) {
            choice1 = choice2;
            choice2 = temp;
        } else if (changeCorrect === 3) {
            choice1 = choice3;
            choice3 = temp;
        } else if (changeCorrect === 4) {
            choice1 = choice4;
            choice4 = temp;
        }

        return {
            question: template,
            choice1: choice1,
            choice2: choice2,
            choice3: choice3,
            choice4: choice4,
            answer: changeCorrect,
        };
    }
});

const scoreUpdate = (uid, score, userID, schema) => {
    return new Promise(async (resolve, reject) => {
        schema
            .findOne({ userID: userID })
            .then((doc) => {
                if (doc) {
                    doc.score += parseInt(score);
                    doc.save((err, updated) => {
                        if (updated) {
                            resolve(1);
                        } else {
                            resolve(-1);
                        }
                    });
                } else {
                    const newDoc = new schema({
                        _id: uuidv4(),
                        userID: userID,
                        score: parseInt(score),
                    });
                    newDoc.save((err, savedDoc) => {
                        if (savedDoc) {
                            resolve(1);
                        } else {
                            resolve(-1);
                        }
                    });
                }
            })
            .catch((err) => reject(err));
    });
};

router.post("/API/score", (request, response) => {
    if (request.query.score && request.query.uid && request.cookies.logged) {
        const dailyPromise = scoreUpdate(request.query.uid, request.query.score, request.cookies.logged, Daily);
        const weeklyPromise = scoreUpdate(request.query.uid, request.query.score, request.cookies.logged, Weekly);
        const monthlyPromise = scoreUpdate(request.query.uid, request.query.score, request.cookies.logged, Monthly);

        const gameHistory = new Promise((resolve, reject) => {
            new GameHistory({
                _id: uuidv4(),
                userID: request.cookies.logged,
                gameID: request.query.uid,
                gameDate: Date.now(),
                points: request.query.score,
            }).save((err, saved) => (saved ? resolve(1) : reject(-1)));
        });

        Promise.all([dailyPromise, weeklyPromise, monthlyPromise, gameHistory]).then((values) => {
            if (values.every((val) => val === 1)) {
                return response.send("0");
            }
        });
    } else {
        new GameHistory({
            _id: uuidv4(),
            userID: request.cookies.logged,
            gameID: request.query.uid,
            gameDate: Date.now(),
            points: request.query.score,
        }).save((err, saved) => {
            if(saved){
                return response.send("0")
            }
            else{
                return response.sendStatus(500)
            }
        })
    }
});

router.post("/API/history", (request, response) => {
    //request.query.json //request.query.score

    if (request.body.json && request.body.score) {
        // const parsedJSON = JSON.parse(request.query.json);
        // console.log(parsedJSON);
        // let finalArray = [];

        // parsedJSON.forEach(question => {
        //     finalArray.push({

        //     })
        // })

        let history = new History({
            _id: uuidv4(),
            answers: request.body.json,
            score: request.body.score,
        });

        console.log(history);

        history.save((err, newHistory) => {
            if (newHistory) {
                return response.send(newHistory._id);
            }
        });
    }
});

router.get("/history", (request, response) => {
    if (!request.cookies.logged) {
        return response.redirect("/");
    }
    let table = "";
    GameHistory.find({ userID: request.cookies.logged })
        .sort("-gameDate")
        .then((gameHistoryArray) => {
            if (gameHistoryArray) {
                gameHistoryArray.forEach((history) => {
                    table += `<div data-url="${history.gameID}" class="row">
                <div class="cell" >${history.gameID}
                </div>
                <div class="cell">${history.points}
                </div>
                <div class="cell"> ${stampToFormat(history.gameDate)}
                </div>
            </div>`;
                });

                return response.render("../ejs/history.ejs", { gameTable: table });
            }
        });
});

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const stampToFormat = (d1) => {
    let d = new Date(d1);
    let day = days[d.getDay()];
    let hr = d.getHours();
    let min = d.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    let ampm = "am";
    if (hr > 12) {
        hr -= 12;
        ampm = "pm";
    }
    let date = d.getDate();
    let month = months[d.getMonth()];
    let year = d.getFullYear();
    return `${date}${date % 10 === 1 ? "st" : date % 10 === 2 ? "nd" : date % 10 === 3 ? "rd" : "th"} of ${month} ${year} at ${hr}:$${min} ${ampm}`;
};

router.get("/history/:gameID", (request, response) => {
    History.findById(request.params.gameID).then((game) => {
        if (game) {
            let inline = `<div id="hud" style="flex-direction: row-reverse;">
            <div id="hud-item">
                <p class="hud-prefix">
                    Score
                </p>
                <h1 id="score" class="hud-main-text" style="margin-bottom: 0;">${game.score}
                </h1>
            </div>
        </div>`;

            let i = 0;
            game.answers.forEach((question) => {
                if (question.chosen == question.answer) correct = true;
                else correct = false;

                inline += `<div id="hud">
                <div id="hud-item">
                    <p id="progressText" class="hud-prefix" style="color: #14006C; font-weight: bold; margin-top: 1rem;"> Question ${i++}
                    </p>
                </div>
            </div>`;

                let a1 = question.answer == 1 ? "correct" : question.chosen == 1 && correct == false ? "incorrect" : "";
                let a2 = question.answer == 2 ? "correct" : question.chosen == 2 && correct == false ? "incorrect" : "";
                let a3 = question.answer == 3 ? "correct" : question.chosen == 3 && correct == false ? "incorrect" : "";
                let a4 = question.answer == 4 ? "correct" : question.chosen == 4 && correct == false ? "incorrect" : "";

                inline += `<h2 id="question" style="font-size: 30px; margin-bottom: 2rem;">${question.question}</h2>
            <div class="choice-container ${a1}">
                <p class="choice-prefix">A</p>
                <p class="choice-text" data-number="1">${question.choice1}</p>
            </div>
            <div class="choice-container ${a2}">
                <p class="choice-prefix">B</p>
                <p class="choice-text" data-number="2">${question.choice2}</p>
            </div>
            <div class="choice-container ${a3}">
                <p class="choice-prefix">C</p>
                <p class="choice-text" data-number="3">${question.choice3}</p>
            </div>
            <div class="choice-container ${a4}">
                <p class="choice-prefix">D</p>
                <p class="choice-text" data-number="4">${question.choice4}</p>
            </div>
            </br>`;
            });

            return response.render("../ejs/historyID.ejs", { inline: inline });
        } else {
            //game not found
        }
    });
});

return (module.exports = router);

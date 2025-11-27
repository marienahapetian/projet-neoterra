// -------------------- VARIABLES -------------------- //
// List of question to fetch
let questions = [];
let themes = [];

// Booleans of user results
let user_responses = [];

// Current question id
let current_question_id = 0;

let current_theme_id = 0; //display questions by theme

// Delay before timeout in question
const response_delay = 20;
// Intervals/Timeouts declaration
let timer_start;
let timer_interval;
let timer_timeout;

// -------------------- FUNCTIONS -------------------- //

// ---------- HTML CREATION ---------- //

// Create question layout and adds it to the DOM
function create_question_layout(id) {
	// Clear body
	document.body.innerHTML = "";

	const q = get_question(id);

	// Main container
	const question_container = document.createElement("div");
	question_container.id = "question_container";

	// Question
	const question = document.createElement("div");
	const question_nav = document.createElement("p");
	question_nav.textContent = `Question ${user_responses.length + 1}/${questions.length}`;
	const question_text = document.createElement("p");
	question_text.textContent = q["q"];
	const question_timer = document.createElement("p");
	question_timer.id = "question_timer";

	// Response
	const response = document.createElement("div");
	const responses = Array.from(q["r"]);

	// Shuffle responses order
	shuffle(responses);

	// For each response, creates and add a new element
	for (const r of responses) {
		response.appendChild(create_response_element(r, q["id"]));
	}

	question.append(question_nav, question_text, question_timer);
	question_container.append(question, response);
	document.body.appendChild(question_container);

	// Get current time
	timer_start = Date.now();

	// Update timer element
	update_response_timer();

	// Set interval to update timer element
	timer_interval = globalThis.setInterval(update_response_timer, 1000);

	// Set timeout for response
	timer_timeout = globalThis.setTimeout(create_result_layout, response_delay * 1000);
}

// Creates response element and returns it
function create_response_element(r, q_id) {
	const response_layout = document.createElement("div");
	response_layout.classList.add("response");

	const response = document.createElement("div");
	response.textContent = r;
	response.dataset["question_id"] = q_id;
	add_response_listener(response);

	response_layout.appendChild(response);

	return response_layout;
}

// Creates result layout and adds it to the DOM
function create_result_layout(result = false, expected = "", given = "") {
	// Adds user response result to the list
	user_responses.push(result);

	// Increment current question
	current_question_id++;
	save_progress();

	// Clear question/response interval and timeout
	globalThis.clearInterval(timer_interval);
	globalThis.clearTimeout(timer_timeout);

	// Clear body
	document.body.innerHTML = "";

	// Result container
	const result_container = document.createElement("div");
	result_container.id = "result_container";

	// Text display result
	const result_text = document.createElement("p");
	if (result) {
		result_text.textContent = `Bravo ! La réponse était bien "${given}" !`;
	} else if (given != "") {
		result_text.textContent = `Vous avez répondu "${given}" quand la bonne réponse était "${expected}", dommage !`;
	} else {
		result_text.textContent = "Vous avez été trop lent !";
	}

	// Text display good responses count
	const result_count = document.createElement("p");
	result_count.textContent = `Total de bonnes réponses : ${get_total_points()}`;

	// Next question button
	const result_button = document.createElement("button");
	result_button.textContent = "Question suivante";
	add_next_button_listener(result_button);

	result_container.append(result_text, result_count, result_button);
	document.body.appendChild(result_container);
}

// Creates bilan container and adds it to the DOM
function create_bilan_container() {
	// Clear body
	document.body.innerHTML = "";

	// Bilan container
	const bilan_container = document.createElement("div");
	bilan_container.id = "bilan_container";

	const bilan_left = document.createElement("div");

	// Bilan text with results
	const bilan_text = document.createElement("p");
	bilan_text.textContent = `Quizz terminé ! Bilan final : ${get_total_points()}/${user_responses.length}`;

	// Restart button
	const restart_button = document.createElement("button");
	restart_button.textContent = "Réessayer";
	add_restart_button_listener(restart_button);

	const last_score = get_score();
	if (last_score != null) {
		//Display last score
		const last_score_text = document.createElement("p");
		last_score_text.textContent = `Précédent score : ${last_score}/${user_responses.length}`;
		bilan_left.append(bilan_text, last_score_text, restart_button);
	} else {
		bilan_left.append(bilan_text, restart_button);
	}

	save_score(get_total_points());
	bilan_container.append(bilan_left);
	document.body.appendChild(bilan_container);
}

// ---------- LISTENERS ---------- //

// Add event listener to response element
function add_response_listener(r) {
	r.addEventListener("click", (e) => {
		const question_id = e.originalTarget.dataset["question_id"];
		const question = get_question(question_id);
		const good_response = question["r"][0];
		const response = e.originalTarget.textContent;

		// Create display result
		create_result_layout(good_response == response, good_response, response);
	});
}

// Add event listener for next question button
function add_next_button_listener(b) {
	b.addEventListener("click", (e) => {
		// If no more question display bilan
		if (current_question_id >= questions.length) {
			create_bilan_container();
			return;
		}

		// Else display next question
		create_question_layout(current_question_id);
	});
}

// Add event listener for restart button
function add_restart_button_listener(b) {
	b.addEventListener("click", (e) => {
		start_game();
	});
}

// ---------- GAME MANAGEMENT ---------- //

// Resets game values and open first question
function init_game() {
	current_question_id = 0;
	shuffle(questions);
	user_responses = [];
	create_question_layout(current_question_id);
}

// Handles game start timer and timeout the start of the game
function start_game() {
	get_questions_data().then((result) => {
		questions = result;
		init_game();
	});
}

// Handle game state from session saves
function handle_session() {
	// Try to load from sessionStorage
	load_progress();

	// If success
	if (questions) {
		// If the game wasn't arleady over
		if (current_question_id < questions.length) {
			// Continue game
			create_question_layout(current_question_id);
			return;
		}
	}

	// Else, start game
	start_game();
}

// ---------- INTERVAL CALLBACK ---------- //

// Save progress in session
function save_progress() {
	sessionStorage.setItem("current_question_id", JSON.stringify(current_question_id));
	sessionStorage.setItem("questions", JSON.stringify(questions));
	sessionStorage.setItem("user_responses", JSON.stringify(user_responses));
}

// Load progress from session
function load_progress() {
	current_question_id = JSON.parse(sessionStorage.getItem("current_question_id"));
	questions = JSON.parse(sessionStorage.getItem("questions"));
	user_responses = JSON.parse(sessionStorage.getItem("user_responses"));
}

// Called to update response timer display
function update_response_timer() {
	const timer = document.getElementById("question_timer");
	const time_left = response_delay - Math.floor((Date.now() - timer_start) / 1000);

	timer.textContent = `Temps restant : ${time_left}s`;
}

// ---------- UTILS ---------- //

function create_pie_data() {
	const data = {
		labels: ["Red", "Blue", "Yellow"],
		datasets: [
			{
				label: "My First Dataset",
				data: [300, 50, 100],
				backgroundColor: ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(255, 205, 86)"],
				hoverOffset: 4,
			},
		],
	};
	return data;
}

// Save last score to session
function save_score(score) {
	sessionStorage.setItem("last_score", JSON.stringify(score));
}

// Get last score from session
function get_score() {
	return JSON.parse(sessionStorage.getItem("last_score"));
}

// Return promise containing json data ( questions )
async function get_questions_data() {
	const json_file = "./questions.json";
	const data = await fetch(json_file);
	const data_json = await data.json();

	let dataToReturn = [];

	for (let theme in data_json) {
		themes.push(theme);
		dataToReturn.push(...data_json[theme]);
	}

	console.log(dataToReturn);

	// dataToReturn.shuffle();
	let toReturn = dataToReturn.map((question, i) => {
		question.id = i;
		return question;
	});

	// console.log(themes, toReturn);

	// return;

	return toReturn;
}

// Shuffle an array in-place
function shuffle(array) {
	let currentIndex = array.length;

	// While there remain elements to shuffle
	while (currentIndex != 0) {
		// Pick a remaining element
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// Swap it with the current element
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
}

// Return question by id
function get_question(id) {
	return questions.find((q) => q["id"] == id);
}

// Return user current score
function get_total_points() {
	// Filter(Boolean) filters falsy values
	return user_responses.filter(Boolean).length;
}

// -------------------- EXECUTION -------------------- //

handle_session();

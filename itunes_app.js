var pg = require('pg');
var inquirer = require('inquirer');

var dbUrl = {
	user: process.argv.POSTGRES_USER,
	password: process.argv.POSTGRES_PASSWORD,
	database: 'testdb',
	host: "localhost",
	port: 5432,
};

var pgClient = new pg.Client(dbUrl);

pgClient.connect();

/* <------------------------------------------------------------------> */
console.log('Welcome to itunes!');

var signUp = () => {
	inquirer.prompt([
		{
			type: 'list',
			message: 'Sign Up/Sign In',
			choices: ['Sign Up', 'Sign In'],
			name: 'sign_choice',
		},
	]).then((sign) => {
		if (sign.sign_choice === "Sign Up") {
			console.log("Welcome to iTunes");
			inquirer.prompt([
				{
					type: 'input',
					message: 'Whats your name?',
					name: 'name',
				},
				{
					type: 'input',
					message: 'Whats your username?',
					name: 'username',
				},
				{
					type: 'password',
					message: 'What your password?',
					name: 'password',
				}
			]).then((signup) => {
				pgClient.query('INSERT INTO users (name, username, password) VALUES ($2, $3)', [signup.name, signup.username, signup.password], (err, result) => {
					console.log('Thank you for signing up. Please sign in now');
					signUp();
				});
			});
		} else {
			inquirer.prompt([
				{
					type: "input",
					message: "Whatsyour username?",
					name: "username",
				},
				{
					type: "password",
					message: "Whats password?",
					name: "password",
				},
			]).then((res) => {
		var runSignIn = () =>	{
			pgClient.query(`SELECT * FROM users WHERE username='${res.username}'`, (err, result) => {
				if (result.rows.length > 0) {
					if (result.rows[0].password === res.password) {
						console.log('Welcome to iTunes ' + result.rows[0].name);
						var goBack = () => {
							inquirer.prompt([
								{
									type: 'list',
									message: 'Please Choose?',
									choices: ['View Songs In Your Itunes', 'Buy More Songs'],
									name: 'selection',
								},
							]).then(function(resTwo) {
								if (resTwo.selection === 'View Songs In Your Itunes') {
									console.log('Welcome ' + result.rows[0].name + '. Here are your purchased songs!');
									pgClient.query('SELECT songs.song_name FROM songs INNER JOIN bought_songs ON bought_songs.song_id=songs.id WHERE bought_songs.user_id=' + result.rows[0].id, (error, queryResTwo) => {
										if (queryResTwo.rows.length > 0) {
											for (var i = 0; i < queryResTwo.rows.length; i++) {
											console.log((i + 1) + ". " + queryResTwo.rows[i].song_name);
											}
											goBack();
										} else {
											console.log("You havent bought any songs yet!");
											goBack();
										}
									});
								} else {
									pgClient.query('SELECT * FROM songs', (errorThree, queryResThree) => {
										var songs = [];
										queryResThree.rows.forEach((songList) => {
											songs.push(songList.id + ". " + songList.song_name + " - " + songList.song_artist);
										});
										inquirer.prompt([
											{
												type: 'list',
												message: 'Please choose a song',
												choices: songs,
												name: 'song',
											},
										]).then((songs_list) => {
												var song_id;
												queryResThree.rows.forEach((songList) => {
													if (songList.song_name === songs_list.song_name) {
														song_id = songList.id;
														console.log(song_id);
													}
												});
												pgClient.query("INSERT INTO bought_songs (song_id, user_id) VALUES ($1, $2)", [result.rows[1].id, song_id], (errFour, resFour) => {
													console.log("You bought a song!");
										    	goBack();
												});
										});
									});
								}
							});
						};
						goBack();
					} else {
						console.log('Wrong Password!');
						signUp();
					}
				} else {
					console.log('username does not exist!');
					signUp();
				}
			 });
			};
		 	runSignIn();
		 });
		}
	});
};
signUp();
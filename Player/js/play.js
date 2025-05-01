window.addEventListener("load", function(){
			
	$("textarea").popover({selector:"#viewport", animation:false, trigger:"manual", placement:"top", content:"تم النسخ", html:true});
});

angular.module("application", []).controller("controller", 

	function($scope, $http, $timeout){
		
		$scope.alert = {class:"alert-warning", message:"يرجى الانتظار"};
		
		$scope.role = null;
		
		$scope.userId = null;
		
		$scope.member = localStorage.getItem("member") != null ? JSON.parse(localStorage.getItem("member")) : new Object();
		
		$scope.team = localStorage.getItem("team");
		
		$scope.userName = localStorage.getItem("userName");
		
		$scope.login = false;
		
		$scope.seconds = 10;
		
		$scope.loginResult = null;
		
		$scope.teamsNames = {"green":"الأخضر", "red":"الأحمر"};
		
		$scope.timerStared = false;
		
		$scope.previous = null;
		
		$scope.questionIndex = 0;
		
		$scope.reviewed = false;
		
		$scope.comment = new Object();
		$scope.comment.id = moment().valueOf();
		$scope.comment.rating = 0;
		
		$scope.updateMember = function(){
			
			localStorage.setItem("member", JSON.stringify($scope.member));
		}
		
		if($scope.member.team == null && $scope.team != null){
			
			$scope.member.team = $scope.team;
			
			$scope.updateMember();
		}
		
		if($scope.member.name == null && $scope.userName != null){
			
			$scope.member.name = $scope.userName;
			
			$scope.updateMember();
		}
		
		if(window.location.search != null
				&& (window.location.search.startsWith("?view=")
					|| window.location.search.startsWith("?user=")
					|| window.location.search.startsWith("?admin="))){
			
			var equalIndex = window.location.search.indexOf("=");
			
			$scope.role = window.location.search.substring(1, equalIndex);
			$scope.userId = window.location.search.substring(equalIndex + 1);
			
			if($scope.role == "admin"){
				
				localStorage.setItem("user", $scope.userId);
			}
			
		}else{
			
			$scope.role = "admin";
		}
		
		$scope.signInAsGuest = function(){
			
			var user = firebase.database().ref("users").push().key;
			
			$scope.comment.user = user;
			
			localStorage.setItem("user", user);
			
			$scope.updateUserCompetition(user);
		}
		
		$scope.loginUser = function(){
			
			$scope.login = true;
			
			$scope.member.date = moment().format("YYYY-MM-DD");
			$scope.member.time = moment().format("YYYY-MM-DD HH:mm:ss");
			
			$scope.comment.user = $scope.member.name;
			
			firebase.database().ref("users").child($scope.user.id).child("members").child($scope.member.time).set($scope.member);
		}
		
		$scope.selectLetters = function(){
			
			$scope.user.letters = new Array();
			
			$scope.user.letters = Object.keys($scope.questions).sort(function() {
								return 0.5 - Math.random();
							 }).slice(0, 25).map(function(letter){
								return {name:letter, color:"default"};
							 });
			
			console.log($scope.user.letters);
			
			firebase.database().ref("users").child($scope.user.id).child("letters").set($scope.user.letters);
		}
		
		$scope.removeUsedQuestions = function(){
			
			if($scope.user != null && $scope.user.usedQuestions != null){
				
				Object.entries($scope.questions).forEach(function([letter, letterQuestions]){
					
					Object.keys(letterQuestions).forEach(function(id){
						
						if($scope.user.usedQuestions[id] != null){
							
							delete letterQuestions[id];
						}
					});
					
					if(Object.keys(letterQuestions).length == 0){
						
						delete $scope.questions[letter];
					}
				});
			}
		}
		
		$scope.randomizeLettersQuestions = function(){
			
			Object.entries($scope.questions).forEach(function([letter, letterQuestions]){
				
				var questions = Object.values(letterQuestions);
				
				questions.sort(function() {
					return 0.5 - Math.random();
				});
				
				$scope.questions[letter] = questions;
			});
		}
		
		$scope.updateUserCompetition = function(userId){
			
			firebase.database().ref("users").child(userId).once("value").then(function(snapshot){
				
				$scope.alert = {class:"d-none", message:null};
				
				$scope.user = snapshot.val();
				
				if($scope.role == "admin"){
					
					$("#linksModal").modal("show");
						
					if($scope.user == null){
					
						$scope.user = new Object();
						$scope.user.letters = new Array();
						$scope.user.state = new Object();
						$scope.user.rounds = new Object();
			
						if($scope.loginResult != null){
							$scope.user.id = $scope.loginResult.user.uid;
							$scope.user.email = $scope.loginResult.user.email;
						}else{
							$scope.user.id = userId;
						}
						
						$scope.user.date = moment().format("YYYY-MM-DD");
						$scope.user.time = moment().format("YYYY-MM-DD HH:mm:ss");
						
						$scope.user.state.userName = null;
						$scope.user.state.team = null;
						$scope.user.state.name = "NEW_ROUND";
						$scope.user.state.letter = null;
						$scope.user.state.letterIndex = null;
						$scope.user.state.question = new Object();
						$scope.user.usedQuestions = new Object();
						$scope.user.activeSubscription = false;
						
						$scope.questionIndex = 0;
						
						firebase.database().ref("users").child($scope.user.id).set($scope.user).then(function(){
							
							$scope.toNewRound();
							
							$scope.$digest();
						});
						
					}else {
							
						$scope.user.date = moment().format("YYYY-MM-DD");
						$scope.user.time = moment().format("YYYY-MM-DD HH:mm:ss");
						
						firebase.database().ref("users").child($scope.user.id).update({date:$scope.user.date, time:$scope.user.time});
						
						if($scope.user.usedQuestions == null){
							
							$scope.user.usedQuestions = new Object();
						}
						
						if($scope.user.question != null){
							
							$scope.questionIndex = -1;
						}
						
						if($scope.user.subscription != null){
							
							let startDate = moment($scope.user.subscription.startDate, "DD-MM-YYYY");
							let endDate = moment($scope.user.subscription.endDate, "DD-MM-YYYY");
							let today = moment();
							
							$scope.user.activeSubscription = today.isBetween(startDate, endDate);
							
							if($scope.user.activeSubscription
								&& $scope.user.subscription.details != null
								&& $scope.user.subscription.details.payer != null
								&& $scope.user.subscription.details.payer.name != null
								&& $scope.user.subscription.details.payer.name.given_name != null){
								
								$scope.user.name = $scope.user.subscription.details.payer.name.given_name;
							}

						}else{
							
							$scope.user.activeSubscription = false;
						}
						
						if($scope.user.activeSubscription && $scope.user.questions != null){

							$scope.questions = $scope.user.questions ?? new Object();

							$scope.removeUsedQuestions();

							$scope.randomizeLettersQuestions();

							$scope.$digest();
							
						}else if(localStorage.getItem("questions") != null){
							
							$scope.questions = JSON.parse(localStorage.getItem("questions"));
							
							$scope.removeUsedQuestions();

							$scope.randomizeLettersQuestions();

							$scope.$digest();
							
						}else {
							
							firebase.database().ref("questions").once("value").then(function(snapshot){
							
								$scope.questions = snapshot.val() ?? new Object();
								
								localStorage.setItem("questions", JSON.stringify($scope.questions));
								
								$scope.removeUsedQuestions();

								$scope.randomizeLettersQuestions();

								$scope.$digest();
							});
						}
					}
				}
				
				$scope.$digest();
			});
			
			firebase.database().ref("users").child(userId).child("letters").on("child_added", function(data){
					
				$scope.user.letters[data.key] = data.val();
				
				$scope.$digest();
			});
			
			firebase.database().ref("users").child(userId).child("letters").on("child_changed", function(data){
				
				$scope.user.letters[data.key] = data.val();
				
				$scope.$digest();
			});
			
			firebase.database().ref("users").child(userId).child("state").on("child_added", function(data){
				
				console.log("child_added ++ " + data.key + " ++ " + data.val());
				
				if(data.key == "name"){
					
					$scope.previous = $scope.user.state.name;
					
					console.log("previous == " + $scope.previous);
				}
				
				$scope.user.state[data.key] = data.val();
				
				if(data.key == "name"){
					
					$scope.updateState();
				}
				
				$scope.$digest();
			});
			
			firebase.database().ref("users").child(userId).child("state").on("child_changed", function(data){
				
				console.log("child_changed ++ " + data.key + " ++ " + data.val());
				
				if(data.key == "name"){
					
					$scope.previous = $scope.user.state.name;
					
					console.log("previous == " + $scope.previous);
				}
				
				if($scope.role == "admin"
					&& $scope.user.state.name == "FIRST_ANSWER"
					&& data.key == "team"
					&& $scope.user.state.team != null
					&& $scope.user.state.team != data.val()){
					
					console.log("ignore team");
					
					firebase.database().ref("users").child($scope.user.id).child("state").child("team").set($scope.user.state.team);
					
					return;
				}
				
				if($scope.role == "admin"
					&& $scope.user.state.name == "FIRST_ANSWER"
					&& data.key == "userName"
					&& $scope.user.state.userName != null
					&& $scope.user.state.userName != data.val()){
					
					console.log("ignore userName");
					
					firebase.database().ref("users").child($scope.user.id).child("state").child("userName").set($scope.user.state.userName);
					
					return;
				}
				
				$scope.user.state[data.key] = data.val();
				
				console.log("update " + data.key + " ++ " + data.val());
				
				if(data.key == "name"){
					
					$scope.updateState();
				}
				
				$scope.$digest();
			});
			
			firebase.database().ref("users").child(userId).child("state").on("child_removed", function(data){
				
				console.log("child_removed ++ " + data.key + " ++ " + data.val());
				
				delete $scope.user.state[data.key];
				
				$scope.$digest();
			});
		}
		
		$scope.updateState = function(){
			
			if($scope.user.state.name == "NEW_ROUND"
				|| $scope.user.state.name == "COLOR_ANSWER"){
				
				$("#letters").collapse("show");
			}
			
			console.log("updateState previous == " + $scope.previous);
			
			//if($scope.previous != $scope.user.state.name){
				
				if($scope.user.state.name == "LETTER_SELECTED"){
					
					if($scope.previous == "SECOND_ANSWER"){
						
						console.log("wrong");
						
						$("#wrong").get(0).play();
						
					}else{
						
						console.log("letter");
						
						$("#letter").get(0).play();
					}
				}
				
				if($scope.user.state.name == "REDIRECT_QUESTION"){
					
					console.log("wrong");
					
					$("#wrong").get(0).play();
				}
				
				if($scope.user.state.name == "COLOR_ANSWER"){
					
					console.log("correct");
					
					$("#correct").get(0).play();
				}
			//}
			
			if($scope.user.state.name == "FIRST_ANSWER"
				|| $scope.user.state.name == "SECOND_ANSWER"){
				
				if($scope.role == "view"){
					
					$("#timerModal").modal("show");
				}
				
				if(!$scope.timerStared){
					
					$scope.seconds = 10;
				
					$scope.timerStared = true;

					$scope.timer = $timeout($scope.runTimer, 1000);
				}
				
			}else {
				
				if($scope.role == "view"){
					
					$("#timerModal").modal("hide");
				}
				
				$scope.timerStared = false;
				
				$timeout.cancel($scope.timer);
			}
		}
		
		$scope.runTimer = function(){
			
			$scope.seconds--;

			if($scope.seconds != 0){
				
				console.log("timer");
				
				$("#timer").get(0).currentTime = 0;
				$("#timer").get(0).play();
				
				$scope.timer = $timeout($scope.runTimer, 1000);
			
			}else {
				
				console.log("finish");
				
				$("#finish").get(0).play();
				
				$scope.timerStared = false;
				
				if($scope.role == "view"){
					
					$timeout(function(){
						
						$("#timerModal").modal("hide");
						
					}, 1000);
				}
			}
		}
		
		$scope.formatSeconds = function(time){
			
			var formattedTime = null;
			
			var minutes = String(Math.floor(time/60));
			
			var seconds = String(time%60);
			
			var formattedMinutes = "00".substr(minutes.length) + minutes;
			
			var formattedSeconds = "00".substr(seconds.length) + seconds;
			
			formattedTime = formattedMinutes + ":" + formattedSeconds;
			
			return formattedTime;
		}
		
		firebase.auth().signInAnonymously().then(function(credential){
			
			if($scope.role == "admin"){
				
				if(localStorage.getItem("user") != null){
					
					let user = localStorage.getItem("user");
					
					$scope.comment.user = user;
					
					$scope.updateUserCompetition(user);
					
				}else{

					$scope.signInAsGuest();
				}
				
				$scope.$digest();
				
			}else{
		
				$scope.updateUserCompetition($scope.userId);
			}
		});
		
		$scope.selectLetter = function(letter, index){
			
			window.scrollTo(0, 0);
			
			$("#letters").collapse("hide");
			
			if($scope.user.state.letter != null 
				&& $scope.user.state.letterIndex != null 
				&& $scope.user.letters[$scope.user.state.letterIndex].color == "selected"){
				
				$scope.user.letters[$scope.user.state.letterIndex].color = "default";
				
				firebase.database().ref("users").child($scope.user.id).child("letters").child($scope.user.state.letterIndex).child("color").set($scope.user.letters[$scope.user.state.letterIndex].color);
			}
			
			$scope.user.state.name = "LETTER_SELECTED";
			$scope.user.state.letter = letter;
			$scope.user.state.letterIndex = index;
			$scope.user.state.team = null;
			$scope.user.state.userName = null;
			
			$scope.questionIndex = 0;
			
			var questions = Object.values($scope.questions[$scope.user.state.letter]);
			
			$scope.user.state.question = questions[$scope.questionIndex];
			
			firebase.database().ref("users").child($scope.user.id).child("state").update($scope.user.state);
			
			$scope.user.letters[$scope.user.state.letterIndex].color = "selected";
			
			firebase.database().ref("users").child($scope.user.id).child("letters").child(index).child("color").set($scope.user.letters[$scope.user.state.letterIndex].color);
			
			$scope.user.usedQuestions[$scope.user.state.question.id] = {date:moment().format("YYYY-MM-DD"), time:moment().format("YYYY-MM-DD HH:mm:ss"), round:$scope.user.state.round};
			
			firebase.database().ref("users").child($scope.user.id).child("usedQuestions").child($scope.user.state.question.id).set($scope.user.usedQuestions[$scope.user.state.question.id]);
			
			$scope.user.date = moment().format("YYYY-MM-DD");
			$scope.user.time = moment().format("YYYY-MM-DD HH:mm:ss");

			firebase.database().ref("users").child($scope.user.id).update({date:$scope.user.date, time:$scope.user.time});
		}
		
		$scope.updateAnswerFirst = function(){
			
			if($scope.user.state.name == "LETTER_SELECTED"){
				
				firebase.database().ref("users").child($scope.user.id).child("state").update({name:"FIRST_ANSWER", team:$scope.user.state.team, userName:null});
			}
		}
		
		$scope.correctAnswer = function(){
			
			$("#letters").collapse("show");
			
			$scope.user.letters[$scope.user.state.letterIndex].color = $scope.user.state.team;
			
			firebase.database().ref("users").child($scope.user.id).child("letters").child($scope.user.state.letterIndex).child("color").set($scope.user.letters[$scope.user.state.letterIndex].color);
			
			$scope.user.usedQuestions[$scope.user.state.question.id].team = $scope.user.state.team;
			
			firebase.database().ref("users").child($scope.user.id).child("usedQuestions").child($scope.user.state.question.id).child("team").set($scope.user.state.team);
			
			$scope.questionIndex = 0;
			
			$scope.user.state.question = new Object();
			$scope.user.state.letterIndex = null;
			$scope.user.state.team = null;
			$scope.user.state.userName = null;
			$scope.user.state.name = "COLOR_ANSWER";
			
			firebase.database().ref("users").child($scope.user.id).child("state").update($scope.user.state);
		}
		
		$scope.redirectQuestion = function(){
			
			$scope.user.state.name = "REDIRECT_QUESTION";
			$scope.user.state.team = $scope.user.state.team == "red" ? "green" : "red";
			$scope.user.state.userName = null;
			
			firebase.database().ref("users").child($scope.user.id).child("state").update($scope.user.state);
		}
		
		$scope.toStartSecond = function(){
			
			$scope.user.state.name = "SECOND_ANSWER";
			
			firebase.database().ref("users").child($scope.user.id).child("state").child("name").set($scope.user.state.name);
		}
		
		$scope.toNewQuestion = function(){
			
			$scope.questionIndex++;
			
			$scope.user.state.name = "LETTER_SELECTED";
			$scope.user.state.team = null;
			$scope.user.state.userName = null;
			
			var questions = Object.values($scope.questions[$scope.user.state.letter]);
			
			$scope.user.state.question = questions[$scope.questionIndex];
			
			firebase.database().ref("users").child($scope.user.id).child("state").update($scope.user.state);
			
			$scope.user.usedQuestions[$scope.user.state.question.id] = {date:moment().format("YYYY-MM-DD"), time:moment().format("YYYY-MM-DD HH:mm:ss"), round:$scope.user.state.round};
			
			firebase.database().ref("users").child($scope.user.id).child("usedQuestions").child($scope.user.state.question.id).set($scope.user.usedQuestions[$scope.user.state.question.id]);
			
			$scope.user.date = moment().format("YYYY-MM-DD");
			$scope.user.time = moment().format("YYYY-MM-DD HH:mm:ss");

			firebase.database().ref("users").child($scope.user.id).update({date:$scope.user.date, time:$scope.user.time});
		}
		
		$scope.updateLetterColor = function(letter, index){
			
			$scope.questionIndex = 0;
			
			$scope.user.state.question = new Object();
			$scope.user.state.letterIndex = null;
			$scope.user.state.letter = null;
			$scope.user.state.team = null;
			$scope.user.state.userName = null;
			$scope.user.state.name = "COLOR_ANSWER";
			
			firebase.database().ref("users").child($scope.user.id).child("state").update($scope.user.state);
			
			firebase.database().ref("users").child($scope.user.id).child("letters").child(index).child("color").set(letter.color);
		}
		
		$scope.toNewRound = function(){
			
			window.scrollTo(0, 0);
			
			$scope.user.state.round = firebase.database().ref("users").child($scope.user.id).child("rounds").push().key;
			
			if($scope.user.rounds == null){
				$scope.user.rounds = new Object();
			}
			
			$scope.user.rounds[$scope.user.state.round] = moment().format("YYYY-MM-DD HH:mm:ss");
			
			firebase.database().ref("users").child($scope.user.id).child("rounds").child($scope.user.state.round).set($scope.user.rounds[$scope.user.state.round]);
			
			$scope.user.date = moment().format("YYYY-MM-DD");
			$scope.user.time = moment().format("YYYY-MM-DD HH:mm:ss");

			firebase.database().ref("users").child($scope.user.id).update({date:$scope.user.date, time:$scope.user.time});
			
			$scope.questionIndex = 0;
			
			$scope.user.state.question = new Object();
			$scope.user.state.name = "NEW_ROUND";
			$scope.user.state.letter = null;
			$scope.user.state.letterIndex = null;
			$scope.user.state.team = null;
			$scope.user.state.userName = null;
			
			firebase.database().ref("users").child($scope.user.id).child("state").update($scope.user.state);
			
			if($scope.user.activeSubscription && $scope.user.questions != null){

				$scope.questions = $scope.user.questions ?? new Object();

				$scope.removeUsedQuestions();

				$scope.randomizeLettersQuestions();
				
				$scope.selectLetters();
				
				$scope.$digest();
			
			}else if(localStorage.getItem("questions") != null){
				
				$scope.questions = JSON.parse(localStorage.getItem("questions"));
				
				$scope.removeUsedQuestions();

				$scope.randomizeLettersQuestions();
				
				$scope.selectLetters();
				
				$scope.$digest();
				
			}else{
							
				firebase.database().ref("questions").once("value").then(function(snapshot){
					
					$scope.questions = snapshot.val() ?? new Object();
					
					localStorage.setItem("questions", JSON.stringify($scope.questions));

					$scope.removeUsedQuestions();
					
					$scope.randomizeLettersQuestions();

					$scope.selectLetters();

					$scope.$digest();
				});
			}
		}
		
		$scope.answerFirst = function(){
			
			if($scope.user.state.name == "LETTER_SELECTED"){
				
				firebase.database().ref("users").child($scope.user.id).child("state").update({name:"FIRST_ANSWER", team:$scope.member.team, userName:$scope.member.name});
			}
		}
		
		$scope.copyLink = function(id){
			
			$("#" + id).select();
			
			document.execCommand("copy");
			
			$("#" + id).popover("show");
			
			$timeout(function(){
				
				$("#" + id).popover("hide");
				
			}, 2000);
		}
		
		$scope.setRating = function(rating){
			
			$scope.comment.rating = rating;
		}
		
		$scope.saveComment = function(){
			
			$scope.reviewed = true;

			localStorage.setItem("reviewed", true);
			
			$scope.comment.time = moment().format("DD-MM-YYYY HH:mm:ss");
			
			firebase.database().ref("comments").child($scope.comment.id).set($scope.comment);
		}
	}
);
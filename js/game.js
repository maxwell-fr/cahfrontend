//set the base url for the various endpoints
//all API calls will start with this URL, e.g., `${CONFIG_BASEURL}/v1/games/getGame`
//https://dencah-deviler151532041.codeanyapp.com
//http://localhost:3000
const CONFIG_BASEURL = "http://localhost:3000";

$(document).ready(function(){
    try {
        $.ajax({
            url: `${CONFIG_BASEURL}/v1/games/getAllSets`,
            method: "GET",
            data: {
                //gameID: gameID
            },
            success: function( result ) {
                var sets = result.data;
                sets.forEach(function(set){
                    $("#options").append(`
                        <div class="custom-control custom-switch">
                            <input type="checkbox" class="set_switch custom-control-input" id="${set.id}" checked>
                            <label class="custom-control-label" for="${set.id}">${set.name} <span class="badge badge-dark">${set.blackCardCount}</span> <span class="badge badge-light">${set.whiteCardCount}</span></label>
                        </div>`);
                })
            },
            statusCode: {
                502: function() {
                    $("#nameError").removeClass("d-none");
                    $("#nameError").html("<i class='fas fa-plug'></i> Looks like the server is down... The game might not work.");
                }
            }
        });
    } catch(err) {
        $("#nameError").removeClass("d-none");
        $("#nameError").html("<i class='fas fa-plug'></i> Looks like the server is down... The game might not work.");
    }
    var gameID = getGameID();
    if(!gameID || getGameOver()){
        clearData();
    } else {
        localStorage.setItem("lastcahgameid", gameID);
        localStorage.removeItem("cahgameid");
        $("#nameForm").addClass("d-none");
        $("#continueGameForm").removeClass("d-none");
        $("#displayPlayerName").html(localStorage.getItem("cahplayername"));
        $("#namerow").html("Your name is <strong>"+localStorage.getItem("cahplayername")+"</strong>. "+namearray[Math.floor(Math.random()*namearray.length)]);
    }
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    if(vars.id){
        $("#openJoinButton").removeClass("collapsed");
        $("#collapseTwo").addClass("show");
        $("#gameID").val(vars.id);
        $.ajax({
            url: `${CONFIG_BASEURL}/v1/games/getGame`,
            method: "POST",
            data: {
                gameID: vars.id
            },
            success: function( result ) {
                $("#joinGameText").html("You've been invited to a game called "+result.data.name+". Lucky you!");
            }
        });
    }
    
});

$(".copyGameID").on('click', function() {
    /* Get the text field */
    var copyText = document.getElementById("gameIDlink");
    
    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    navigator.clipboard.writeText(copyText.value);

    /* Alert the copied text */
    $(this).attr('title','Copied!');
    $(this).tooltip('show');
});

var namearray = [
    "Sweet!",
    "That's cool I guess!",
    "Your FBI agent says hi!",
    "What's up?",
    "Are you having fun yet?",
    "Cool!",
    "Will you be my friend?",
    "I'm sure you're very nice!"
];

setInterval(function(){
    var gameID = getGameID();
    if(gameID){
        $("#gameDetails").removeClass("d-none");
        if(!getRound()){
            $.ajax({
                url: `${CONFIG_BASEURL}/v1/games/getGame`,
                method: "POST",
                data: {
                    gameID: gameID
                },
                success: function( result ) {
                    updatePlayers(result.data.players, null);
                    if(result.data.rounds.length > 0){
                        getLatestRound(gameID);
                    }
                }
            });
        } else {
            getLatestRound(gameID);
        }
    } else {
        $("#selectionButtons").addClass("d-none");
        $("#mobileSelectionButtons").addClass("d-none");
        $("#playerList").html("");
        $("#mobilePlayerList").html("");
    }
}, 1000);

$("#menuIcon").on('click', function(){
    if($('#mobileInfoRow').hasClass("d-none")){
        $('#mobileInfoRow').removeClass("d-none");
        $('#mobilePlayerList').addClass("d-none");
    } else {
        $('#mobileInfoRow').addClass("d-none");
    }
});

$("#playersIcon").on('click', function(){
    if($('#mobilePlayerList').hasClass("d-none")){
        $('#mobilePlayerList').removeClass("d-none");
        $('#mobileInfoRow').addClass("d-none");
    } else {
        $('#mobilePlayerList').addClass("d-none");
    }
});

$("#nameButton").on('click', function(){
    var name = $("#playerName").val().trim();
    if(name.length < 2){
        $("#nameError").removeClass("d-none");
        $("#nameError").html("Your name is too short. Sometimes size does matter...");
    } else if(name.length > 30){
        $("#nameError").removeClass("d-none");
        $("#nameError").html("Your name is too long. We're gonna need you to make that a little shorter mmkay?");
    } else {
        localStorage.setItem("cahplayername",name);
        $("#nameForm").addClass("d-none");
        $("#nameError").addClass("d-none");
        $("#newGameForm").removeClass("d-none");
        $("#displayPlayerName").html(localStorage.getItem("cahplayername"));
        $("#namerow").html("Your name is <strong>"+localStorage.getItem("cahplayername")+"</strong>. "+namearray[Math.floor(Math.random()*namearray.length)]);
        $("#game_name").val(name+"'s DeNCAH game");
    }
});

$("#set_toggle_off").on('click', function(){
    $(".set_switch").each(function() {
        $(this).prop("checked",false);
    });
});
$("#set_toggle_on").on('click', function(){
    $(".set_switch").each(function() {
        $(this).prop("checked",true);
    });
});

$("#newGame").on('click', function(){
    if(!$(this).hasClass("disabled")){
        $(this).addClass("disabled");
        $(this).html("Starting Game <i class='fas fa-spinner fa-spin'></i>")
        var sets = [];
        $(".set_switch").each(function() {
            if($(this).is(":checked")){
                sets.push($(this).prop("id"));
            }
        });

        var time_limit = $("#time_limit").val();
        var score_limit = $("#score_limit").val();
        var game_name = $("#game_name").val();
        var hand_size = $("#hand_size").val();
        $("#whiteHand").html("");
        var playerName = localStorage.getItem("cahplayername");
        if(playerName.length == 0){
            addToConsole("Player Name is required.");
        } else {
            $.ajax({
                url: `${CONFIG_BASEURL}/v1/games/new`,
                method: "POST",
                data: {
                    player: playerName,
                    sets: sets,
                    time_limit: time_limit,
                    score_limit: score_limit,
                    name: game_name,
                    handSize: hand_size
                },
                success: function( result ) {
                    setGameID(result.data.gameID);
                    setPlayerID(result.data.playerID);
                    setGUID(result.data.guid);
                    updatePlayers(result.data.players, null);
                    $(".gameIDtag").each(function (){
                        $(this).html("Game Link:");
                        $(".gameIDlink").each(function (){
                            $(this).val(window.location.href+"?id="+result.data.gameID);
                        });
                        $(".gameIDgroup").removeClass("d-none");
                    });
                    $("#nextRound").html("Start Game");
                    $("#nextRound").removeClass("d-none");
                    $("#mobileNextRound").removeClass("d-none");
                    $("#splash").addClass("d-none");
                    $("#game").removeClass("d-none");
                    $("#blackCardHolder").html(
                        `<div class="float-right mb-4 mt-4">
                            <div class="playerCard card text-white bg-dark border border-light">
                                <div class="card-body">
                                    <p class="card-text">Share the game ID below with your friends (if you have any). Press Next Round when you\'re ready to start.</p>
                                </div>
                            </div>
                        </div>`);
                    setOwnerID(result.data.owner);
                }
            });
        }
    }
});

$("#resetGame").on('click', function(){
    clearData();
    $("#continueGameForm").addClass("d-none");
    $("#nameForm").removeClass("d-none");
    $("#selectionButtons").addClass("d-none");
    $("#mobileSelectionButtons").addClass("d-none");
    $("#playerList").html("");
    $("#mobilePlayerList").html("");
});

$("#continueGame").on('click', function(){
    $("#whiteHand").html("");
    $("#gameBoard").html("");
    $("#splash").addClass("d-none");
    $("#continueGameForm").addClass("d-none");
    $("#game").removeClass("d-none");
    $("#blackCardHolder").html(
        `<div class="float-right mb-4 mt-4">
            <div class="playerCard card text-white bg-dark border border-light">
                <div class="card-body">
                    <p class="card-text">Just waiting for the next round to start. . . I wish they\'d hurry the fuck up!</p>
                </div>
            </div>
        </div>`);
    var gameID = localStorage.getItem("lastcahgameid");
    localStorage.setItem("cahgameid",gameID);
    localStorage.removeItem("cahround");
    localStorage.removeItem("lastcahgameid");
    getLatestRound(gameID);
});

$("#joinGame").on('click', function(){
    var playerName = localStorage.getItem("cahplayername");
    var gameID = $("#gameID").val().trim();
    $.ajax({
        url: `${CONFIG_BASEURL}/v1/games/join`,
        method: "POST",
        data: {
            player: playerName,
            gameID: gameID
        },
        success: function( result ) {
            $("#whiteHand").html("");
            $("#gameBoard").html("");
            setGameID(result.data.gameID);
            setPlayerID(result.data.playerID);
            setGUID(result.data.guid);
            updatePlayers(result.data.players, null);
            localStorage.removeItem("round");
            $(".gameIDtag").each(function (){
                $(this).html("Game Link:");
                /* 
                    If they joined via a gameID link we want to grab the URL up the the '?' 
                    then add the gameID to avoid the gameID being added on twice.
                */
                if(window.location.href.indexOf("?") > 0){
                    $(".gameIDlink").each(function () {
                        $(this).val(window.location.href.substr(0,window.location.href.indexOf("?"))+"?id="+result.data.gameID);
                    });
                } else {
                    $(".gameIDlink").each(function () {
                        $(this).val(window.location.href+"?id="+result.data.gameID);
                    });
                }
                $(".gameIDgroup").removeClass("d-none");
            });
            $("#splash").addClass("d-none");
            $("#game").removeClass("d-none");
            $("#blackCardHolder").html(
                `<div class="float-right mb-4 mt-4">
                    <div class="playerCard card text-white bg-dark border border-light">
                        <div class="card-body">
                            <p class="card-text">Just waiting for the next round to start. . . I wish they'd hurry the fuck up!</p>
                        </div>
                    </div>
                </div>`);
            setOwnerID(result.data.owner);
        }
    });
});

$(".nextRound").on('click', function(){
    var gameID = getGameID();
    $.ajax({
        url: `${CONFIG_BASEURL}/v1/games/startRound`,
        method: "POST",
        data: {
            gameID: gameID
        },
        success: function( result ) {
            doGameUpdate(result.data);
            $("#nextRound").html("<i class='fas fa-angle-double-right'></i> Next Round <i class='fas fa-angle-double-right'></i>");
            $("#nextRound").addClass("d-none");
            $("#mobileNextRound").addClass("d-none");
        }
    });
    
});

$("#mulliganConfirm").on('click', function(){
    var playerID = getPlayerID();
    var gameID = getGameID();
    var guid = getGuid();

    $.ajax({
        url: `${CONFIG_BASEURL}/v1/games/mulligan`,
        method: "POST",
        data: {
            playerID: playerID,
            gameID: gameID,
            guid: guid
        },
        success: function( result ) {
            console.log(result.data);
            if(result.data.mulligans == 0){
                console.log("should remove?");
                $("#mulliganButton").addClass('d-none');
            } else {
                console.log("wrong mulligans = "+result.data.mulligans);
            }
            $('#mulliganModal').modal('hide');
            getHand();
        }
    });
});

$(".clearSelection").on('click', function(){
    clearSelection();
});

$(".confirmSelection").on('click', function(){
    submitWhiteCards();
});

$("#toggleFS").on('click', function(e){
    toggleFullscreen(e);
});

$("#kickButton").on('click', function(e){
    console.log("kick",$(this).attr('data-id'));
    var playerID = $(this).attr('data-id');
    var gameID = getGameID();
    $.ajax({
        url: `${CONFIG_BASEURL}/v1/games/removePlayer`,
        method: "POST",
        data: {
            gameID: gameID,
            playerID: playerID
        },
        success: function( result ) {
            console.log("kicked player");
            $('#playerOptions').modal('hide');        
        }
    });
});

function playerMenu(id,name) {
    $("#playerOptionsName").html(name);
    $("#kickButton").attr("data-id",id);
    $('#playerOptions').modal('show');
}

function toggleFullscreen(event) {
    var element = document.documentElement;

    if (event instanceof HTMLElement) {
        element = event;
    }

    var isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

    element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
    document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };

    if(isFullscreen){
        document.cancelFullScreen();
        $("#toggleFS").html('<i class="fas fa-expand-alt"></i>');
    } else {
        element.requestFullScreen();
        $("#toggleFS").html('<i class="fas fa-compress-alt"></i>');
    }
}

function queueWhiteCard(cardID, blankCard){
    var cards = getSubmitCards();
    var localRound = getRound();
    if(localRound.czar != getPlayerID()){
        if(!cards || (cards.length < localRound.blackCard.pick && !cards.some(card => card.cardID == cardID))){
            $("#wc"+cardID).removeClass("bg-white");
            $("#wc"+cardID).removeClass("border-primary");
            $("#wc"+cardID).addClass("bg-primary");
            $("#wc"+cardID).addClass("border-white");
            if(blankCard == 'true'){
                $("#blankCardID").val(cardID);
                $('#blankCardModal').modal('show');
            } else {
                setSubmitCards(cardID);
            }
        }
        enableConfirm();
    }
}

function queueCustomText(){
    var cardID = $("#blankCardID").val();
    var cardText = $("#blankCard").val();
    setSubmitCards(cardID, cardText);
    $('#blankCardModal').modal('hide');
    $("#blankCardID").val("");
    $("#blankCard").val("");
    enableConfirm();
}

function enableConfirm(){
    var localRound = getRound();
    var cards = getSubmitCards();
    if(cards.length == localRound.blackCard.pick){
        $("#confirmSelection").attr("disabled",false);
        $("#mobileConfirmSelection").attr("disabled",false);
    } else if(cards.length > localRound.blackCard.pick) { 
        clearSelection();
    }
}

function submitWhiteCards(){
    $("#selectionButtons").addClass("d-none");
    $("#mobileSelectionButtons").addClass("d-none");
    var playerID = localStorage.getItem("cahplayerid");
    var gameID = getGameID();
    var localRound = getRound();
    var cards = getSubmitCards();
    var roundID = localRound._id;
    var guid = getGuid();
    if(localRound.czar != playerID){
        $.ajax({
            url: `${CONFIG_BASEURL}/v1/games/submitWhiteCard`,
            method: "POST",
            data: {
                roundID: roundID,
                whiteCards: cards,
                playerID: playerID,
                guid: guid
            },
            success: function( result ) {
                doGameUpdate(result.data);
                getHand();
            }
        });
    } else {
        var czarCard = getCzarCard();
        if(czarCard){
            $.ajax({
                url: `${CONFIG_BASEURL}/v1/games/selectCandidateCard`,
                method: "POST",
                data: {
                    roundID: localRound._id,
                    player: czarCard,
                    playerID: playerID,
                    guid: guid
                },
                success: function( result ) {
                    updatePlayers(result.data.players, result.data.czar);
                    $("#czarBox").addClass("d-none");
                    $("#mobileCzarBox").addClass("d-none");
                    $("#nextRound").removeClass("d-none");
                    $("#mobileNextRound").removeClass("d-none");
                }
            });
        }
    }
    clearSelection();
}

function getHand(){
    var playerID = getPlayerID();
    var guid = getGuid();
    $.ajax({
        url: `${CONFIG_BASEURL}/v1/games/getHand`,
        method: "POST",
        data: {
            playerID: playerID,
            guid: guid
        },
        success: function( result ) {
            $("#whiteHand").html("");
            var whiteHand = "";
            result.data.hand.forEach(function(card){
                whiteHand = whiteHand + 
                    `<div class="mb-1 mt-1 mr-2 float-left wc_wrapper">
                        <div id="wc${card._id}" class="playerCard card bg-white whiteCard border border-primary" onClick="queueWhiteCard('${card._id}','${card.blankCard}')">
                            <div class="card-body">
                                <p class="card-text">${card.text}</p>
                                <span style="position: absolute; font-size:9px; bottom:5px; right:10px;"><i class="fas fa-layer-group"></i> ${card.set.name}</span>
                            </div>
                        </div>
                    </div>`;
            });
            $("#whiteHand").html(whiteHand);
            if(result.data.mulligans > 0){
                $("#mulliganButton").removeClass('d-none');
            }
        }
    });
}

function addToConsole(text){
    console.log(text);
}

function getLatestRound(gameID){
    $.ajax({
        url: `${CONFIG_BASEURL}/v1/games/getLatestRound`,
        method: "POST",
        data: {
            gameID: gameID
        },
        success: function( result ) {
            doGameUpdate(result.data);
            //console.log(result.data);
        }
    });
}

function updatePlayers(players, czar){
    $("#playerList").html("");
    $("#mobilePlayerList").html("");
    var playerList = "";
    var playerID = getPlayerID();
    var owner = getOwnerID();
    players.forEach(function(player){
        if(player._id == czar){
            playerList += '<li class="player list-group-item active" '+(playerID == owner && player._id != owner ? 'onClick="playerMenu(\''+player._id+'\',\''+player.name+'\')"' : '')+'>'+player.name+(player._id == owner ? '<i class="fas fa-crown ml-1"></i>' : '')+' <span class="badge badge-light float-right mr-1">'+player.points+'</span><span class="badge badge-info float-right mr-1"><i class="fas fa-gavel"></i></span></li>';
        } else {
            playerList += '<li class="player list-group-item" '+(playerID == owner && player._id != owner ? 'onClick="playerMenu(\''+player._id+'\',\''+player.name+'\')"' : '')+'>'+player.name+(!player.active ? '<i class="fas fa-user-clock"></i>' : '')+(player._id == owner ? '<i class="fas fa-crown ml-1"></i>' : '')+' <span class="badge badge-primary float-right">'+player.points+'</span></li>';
        }
    });
    $("#playerList").html(playerList);
    $("#mobilePlayerList").html(playerList);
    $("#playerCount").html(players.length);
}

function updateGameBoard(blackCard, whiteCards, status, winner = null){
    var blackCardText = blackCard.text.toString();
    var blackCardHtml = 
        `<div class="float-right mb-4 mt-4">
            <div class="playerCard card text-white bg-dark border border-light">
                <div class="card-body">
                    <p class="card-text">${blackCardText}</p>
                    <span style="position: absolute; font-size:9px; bottom:5px; right:10px;"><i class="fas fa-layer-group"></i> ${blackCard.set.name}</span>
                </div>
            </div>
        </div>`;
    var candidateCardsHtml = "";
    whiteCards.forEach(function(candidateCard){
        candidateCardsHtml += '<div class="mb-4 mt-4 float-left candidateCardHolder"><div class="playerCard card bg-white whiteCard '+(status == 'submit' ? 'whitePaper' : '')+' border border-primary" '+(status == 'submit' ? '' : 'onClick="selectCandidateCard(\''+candidateCard.player+'\')")')+'><div class="card-body candidateCard" id="candidateCard'+candidateCard.player+'">';
        var cardNum = 1;
        candidateCard.cards.forEach(function(card){
            candidateCardsHtml += '<p class="card-text">'+((status == 'submit') ? '<span style="position: absolute; font-size:20px; bottom:10px; right:10px;"><i class="fas fa-clone"></i> DeNCAH</span>' : (candidateCard.cards.length > 1 ? '<span class="badge badge-secondary mr-1">'+cardNum+'</span>':'')+card+(candidateCard.cards.length > 1 && candidateCard.cards.length > cardNum ? '<hr/>':''))+'</p>';
            cardNum++;
        });
        candidateCardsHtml += ((candidateCard.winner) ? ' <span class="badge badge-success"><i class="fas fa-award fa-lg"></i> &nbsp;'+winner+'</span>' : '')+'</div></div></div>';
    });
    $("#blackCardHolder").html(blackCardHtml);
    $("#gameBoard").html(candidateCardsHtml);
    var localRound = getRound();
    $("#candidateCount").html(whiteCards.length.toString()+"/"+(localRound.players.length - 1).toString());
}

function selectCandidateCard(player){
    var localRound = getRound();
    var playerID = getPlayerID();
    if(localRound.czar == playerID){
        if(!getCzarCard()){
            addToConsole("Selected Candidate Card.");
            $("#czarBox").addClass("d-none");
            $("#mobileCzarBox").addClass("d-none");
            $("#selectionButtons").removeClass("d-none");
            $("#mobileSelectionButtons").removeClass("d-none");
            $("#candidateCard"+player).removeClass("bg-white");
            $("#candidateCard"+player).removeClass("border-primary");
            $("#candidateCard"+player).addClass("bg-primary");
            $("#candidateCard"+player).addClass("border-white");
            $("#confirmSelection").attr("disabled",false);
            $("#mobileConfirmSelection").attr("disabled",false);
            setCzarCard(player);
        }
    }
}

function shootConfetti()
{
    confetti({
        particleCount: 100,
        startVelocity: 30,
        spread: 360,
        origin: {
            x: Math.random(),
            // since they fall down, start a bit higher than random
            y: Math.random() - 0.2
        }
    });
}

function gameOver(name){
    setGameOver();
    $("#gameDetails").html(name+" HAS WON THE GAME!");
    $("#nextRound").addClass("d-none");
    $("#mobileNextRound").addClass("d-none");
    $("#selectionButtons").addClass("d-none");
    $("#mobileSelectionButtons").addClass("d-none");
    $("#winnerDisplay").removeClass("d-none");
    $("#winnerDisplay").html('<i class="fas fa-trophy"></i> '+name+" HAS WON THE GAME! "+'<i class="fas fa-trophy"></i>');
    $("#mobileWinnerDisplay").removeClass("d-none");
    $("#mobileWinnerDisplay").html('<i class="fas fa-trophy"></i> '+name+" HAS WON THE GAME! "+'<i class="fas fa-trophy"></i>');
}

function doGameUpdate(round){
    var playerID = getPlayerID();
    var gameID = getGameID();
    var localRound = getRound();
    if(round.game.winner){
        updateGameBoard(round.blackCard, round.candidateCards, round.status, round.winner.name || null);
        console.log("Game winner",round.game.winner.name);
        gameOver(round.game.winner.name);
    } else {
        if(localRound){
            $(".whiteCardCount").each(function(){
                $(this).html("<span class='badge badge-light border' style='background-color: #fff;'><i class='fas fa-layer-group'></i> "+round.game.whiteRemaining+"</span>");
            });
            $(".blackCardCount").each(function(){
                $(this).html("<span class='badge badge-dark border'><i class='fas fa-layer-group'></i> "+round.game.blackRemaining+"</span>");
            });
        }
        var changed = false;
        if(!localRound){
            console.log("Game started");
            setRound(round);
            updateGameBoard(round.blackCard, round.candidateCards, round.status);
            getHand();
            updatePlayers(round.players, round.czar);
            if(round.czar != playerID){
                $("#selectionButtons").removeClass("d-none");
                $("#mobileSelectionButtons").removeClass("d-none");
            } else {
                $("#selectionButtons").addClass("d-none");
                $("#mobileSelectionButtons").addClass("d-none");
            }
            return;
        }
        if(localRound._id != round._id){
            //new round
            updateGameBoard(round.blackCard, round.candidateCards, round.status);
            getHand();
            clearSelection();
            if(round.czar != playerID){
                $("#selectionButtons").removeClass("d-none");
                $("#mobileSelectionButtons").removeClass("d-none");
                $("#confirmSelection").attr("disabled",true);
                $("#mobileConfirmSelection").attr("disabled",true);
                $("#czarBox").addClass("d-none");
                $("#mobileCzarBox").addClass("d-none");
            } else {
                $("#selectionButtons").addClass("d-none");
                $("#mobileSelectionButtons").addClass("d-none");
                $("#czarBox").html("You are the Czar!");
                $("#czarBox").removeClass("d-none");
                $("#mobileCzarBox").html("You are the Czar!");
                $("#mobileCzarBox").removeClass("d-none");
                updatePlayers(round.players, round.czar);
            }
            changed = true;
        }
        if(localRound.status != round.status){
            //New round status
            console.log("new round status "+round.status);
            if(round.winner){
                updateGameBoard(round.blackCard, round.candidateCards, round.status, round.winner.name || null);
            } else {
                updateGameBoard(round.blackCard, round.candidateCards, round.status);
            }
            changed = true;
            if(round.czar == playerID){
                if(round.status == "select"){
                    $("#czarBox").html("Pick a winner!");
                    $("#mobileCzarBox").html("Pick a winner!");
                }
            }
        }
        if(localRound.candidateCards.length != round.candidateCards.length){
            //New candidate cards
            console.log("new candidate cards");
            updateGameBoard(round.blackCard, round.candidateCards, round.status);
            changed = true;
        }
        if(changed){
            console.log("change... updating localStorage");
            setRound(round);
            updatePlayers(round.players, round.czar);
        }
    }
}

function clearSelection(){
    $(".whiteCard").each(function(){
        $(this).removeClass("bg-primary");
        $(this).removeClass("border-white");
        //$(this).removeClass("bluePaper");
        $(this).addClass("bg-white");
        //$(this).addClass("whitePaper");
        $(this).addClass("border-primary");
    });
    $(".candidateCard").each(function(){
        $(this).removeClass("bg-primary");
        $(this).removeClass("border-white");
        //$(this).removeClass("bluePaper");
        $(this).addClass("bg-white");
        //$(this).addClass("whitePaper");
        $(this).addClass("border-primary");
    });
    $("#confirmSelection").attr("disabled",true);
    $("#mobileConfirmSelection").attr("disabled",true);
    localStorage.removeItem("cahsubmitcards");
    localStorage.removeItem("cahczarselection");
}

function getGameID(){
    return localStorage.getItem("cahgameid");
}

function getOwnerID(){
    return localStorage.getItem("cahownerid");
}

function getPlayerID(){
    return localStorage.getItem("cahplayerid");
}

function getGuid(){
    return localStorage.getItem("cahguid");
}

function getMulligans(){
    return localStorage.getItem("cahmulligans");
}

function getRound(){
    return JSON.parse(localStorage.getItem("cahround"));
}

function getSubmitCards(){
    return JSON.parse(localStorage.getItem("cahsubmitcards"));
}

function getGameOver(){
    return localStorage.getItem("cahgameover");
}

function setGameID(gameID){
    localStorage.setItem("cahgameid", gameID);
}

function setPlayerID(playerID){
    localStorage.setItem("cahplayerid", playerID);
}

function setGUID(guid){
    localStorage.setItem("cahguid", guid);
}

function setMulligans(mulligans){
    localStorage.setItem("cahmulligans", mulligans);
}

function setOwnerID(playerID){
    localStorage.setItem("cahownerid", playerID);
}

function setRound(round){
    localStorage.setItem("cahround",JSON.stringify(round));
}

function setGameOver(){
    localStorage.setItem("cahgameover",true);
}

function setSubmitCards(cardID, cardText = ''){
    var cards = getSubmitCards();
    if(!cards){
        cards = [
            {
                cardID: cardID,
                cardText: cardText
            }
        ];
    } else {
        cards.push({
            cardID: cardID,
            cardText: cardText
        });
    }
    localStorage.setItem("cahsubmitcards",JSON.stringify(cards));
}

function setCzarCard(card){
    localStorage.setItem("cahczarselection",card);
}

function getCzarCard(){
    return localStorage.getItem("cahczarselection");
}

function clearData()
{
    localStorage.removeItem("cahplayerid");
    localStorage.removeItem("cahguid");
    localStorage.removeItem("cahmulligans");
    localStorage.removeItem("cahgameid");
    localStorage.removeItem("cahround");
    localStorage.removeItem("cahplayername");
    localStorage.removeItem("cahsubmitcards");
    localStorage.removeItem("cahgameover");
    localStorage.removeItem("cahczarselection");
}
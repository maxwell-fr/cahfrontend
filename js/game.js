import {GameStorage} from "./modules/gamestorage.js";
import {CONFIG_WSURL, expectedApiVersion} from "./config.js";


let cah_ws = null;
let storage = new GameStorage();

startTalking();

$(document).ready(function(){
    $("#newGame").html("Waiting for card sets to load...");
    $("#newGame").attr("disabled",true);
    sendWsMessage("getAllSetsRequest", {please: "pretty please"});

    let gameID = storage.getGameID();
    if(!gameID || storage.getGameOver()){
        storage.clearData();
    } else {
        storage.setLastGameID(gameID);
        storage.delGameID("cahgameid");
        $("#nameForm").addClass("d-none");
        $("#continueGameForm").removeClass("d-none");
        $("#displayPlayerName").html(storage.getPlayerName());
        $("#namerow").html("Your name is <strong>" + storage.getPlayerName() + "</strong>. "+namearray[Math.floor(Math.random()*namearray.length)]);
    }
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    if(vars.id){
        sendWsMessage("getGameRequest", {gameID: vars.id});
        $("#openJoinButton").removeClass("collapsed");
        $("#collapseTwo").addClass("show");
        $("#gameID").val(vars.id);
    }

});

function wsAllSets(sets) {
    sets.forEach(function(set){
        $("#options").append(`
                        <div class="custom-control custom-switch">
                            <input type="checkbox" class="set_switch custom-control-input" id="${set.id}" checked>
                            <label class="custom-control-label" for="${set.id}">${set.name} <span class="badge badge-dark">${set.blackCardCount}</span> <span class="badge badge-light">${set.whiteCardCount}</span></label>
                        </div>`);
    });
    if(sets.length > 0){
        $("#newGame").html("Start it up!");
    }
    else {
        $("#newGame").html("No sets available. Can't play without cards!");
    }
    $("#newGame").attr("disabled",false);
}

$(".copyGameID").on('click', function() {
    /* Get the text field */
    var copyText = document.getElementById("gameIDlink");
    
    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");

    /* Alert the copied text */
    console.log("Copied the text: " + copyText.value);
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
        storage.setPlayerName(name);
        $("#nameForm").addClass("d-none");
        $("#nameError").addClass("d-none");
        $("#newGameForm").removeClass("d-none");
        $("#displayPlayerName").html(storage.getPlayerName());
        $("#namerow").html("Your name is <strong>"+storage.getPlayerName()+"</strong>. "+namearray[Math.floor(Math.random()*namearray.length)]);
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
    if(!$(this).hasClass("disabled")) {
        $(this).addClass("disabled");
        $(this).html("Starting Game <i class='fas fa-spinner fa-spin'></i>")
        var sets = [];
        $(".set_switch").each(function () {
            if ($(this).is(":checked")) {
                sets.push($(this).prop("id"));
            }
        });

        var time_limit = $("#time_limit").val();
        var score_limit = $("#score_limit").val();
        var game_name = $("#game_name").val();
        var playerName = storage.getPlayerName();
        if (playerName.length == 0) {
            addToConsole("Player Name is required.");
        } else {
            sendWsMessage("createRequest",
                {
                    player: playerName,
                    sets: sets,
                    time_limit: time_limit,
                    score_limit: score_limit,
                    name: game_name
                });
        }
    }
});
function wsCreate(create_data) {
    $("#whiteHand").html("");
    //$("#gameBoard").html("");

    addToConsole("Started new game: "+create_data.gameID);
    storage.setGameID(create_data.gameID);
    addToConsole("Your player ID: "+create_data.players[0].id);//TODO: ID handling still seems problematic
    storage.setPlayerID(create_data.players[0].id);
    updatePlayers(create_data.players, null);
    $(".gameIDtag").each(function (){
        $(this).html("Game Link:");
        $(".gameIDlink").each(function (){
            $(this).val(window.location.href+"?id="+create_data.gameID);
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
    storage.setOwnerID(create_data.ownerID);
}

$("#resetGame").on('click', function(){
    storage.clearData();
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
    var gameID = storage.getLastGameID();
    var playerID = storage.getPlayerID();
    storage.setGameID(gameID);
    storage.delRound();
    storage.delLastGameID();

    sendWsMessage("rejoinRequest", { gameID: gameID, playerID: playerID });
});

$("#joinGame").on('click', function(){
    let playerName = storage.getPlayerName();
    let gameID = $("#gameID").val().trim();
    sendWsMessage("joinRequest", {gameID: gameID, playerName: playerName});
});

function wsJoin(join_data) {
    $("#whiteHand").html("");
    $("#gameBoard").html("");
    addToConsole("Joined game ID: "+join_data.gameID);
    storage.setGameID(join_data.gameID);
    updatePlayers(join_data.players, null);
    storage.delRound();
    $(".gameIDtag").each(function (){
        $(this).html("Game Link:");
        /*
            If they joined via a gameID link we want to grab the URL up the the '?'
            then add the gameID to avoid the gameID being added on twice.
        */
        if(window.location.href.indexOf("?") > 0){
            $(".gameIDlink").each(function () {
                $(this).val(window.location.href.substr(0,window.location.href.indexOf("?"))+"?id="+join_data.gameID);
            });
        } else {
            $(".gameIDlink").each(function () {
                $(this).val(window.location.href+"?id="+join_data.gameID);
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
    storage.setOwnerID(join_data.owner);
}

$(".nextRound").on('click', function(){
    var gameID = storage.getGameID();
    sendWsMessage("startRound", { gameID: gameID });
    $("#nextRound").html("<i class='fas fa-angle-double-right'></i> Next Round <i class='fas fa-angle-double-right'></i>");
    $("#nextRound").addClass("d-none");
    $("#mobileNextRound").addClass("d-none");
});

$("#mulliganConfirm").on('click', function() {
    var playerID = storage.getPlayerID();
    var gameID = storage.getGameID();
    sendWsMessage("mulligan", {
        playerID: playerID,
        gameID: gameID
    });

    $('#mulliganModal').modal('hide');
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
    var gameID = storage.getGameID();
    sendWsMessage("kickRequest",{
            gameID: gameID,
            kickeeID: playerID
        });
        console.log("kicked player");
        $('#playerOptions').modal('hide');
});

$("#kickedSucksButton").on('click', function(e){
    console.log("Total bummer, got kicked");
    $('#playerOptions').modal('hide');
    const baseurl = window.location.origin+window.location.pathname;
    location.href=baseurl;
});

$("#errorSucksButton").on('click', function(e){
    console.log("Fine, just ignore the error then.");
    $('#errorbox').modal('hide');
});
$("#infoWhateverButton").on('click', function(e){
    console.log("Pff. As if.");
    $('#infobox').modal('hide');
});


function playerMenu(id,name) {
    console.log(`You clicked on ${name}. That's harassment.`);
    if(storage.getPlayerID() === storage.getOwnerID()) {
        $("#playerOptionsName").html(name);
        $("#kickButton").attr("data-id", id);
        $('#playerOptions').modal('show');
    }
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

export function queueWhiteCard(cardID, blankCard){
    var cards = storage.getSubmitCards();
    var localRound = storage.getRound();
    if(localRound.czar !== storage.getPlayerID()){
        if(!cards || (cards.length < localRound.blackCard.pick && !cards.some(card => card == cardID))){
            $("#wc"+cardID).removeClass("bg-white");
            $("#wc"+cardID).removeClass("border-primary");
            $("#wc"+cardID).addClass("bg-primary");
            $("#wc"+cardID).addClass("border-white");
            if(blankCard == 'true'){
                $("#blankCardID").val(cardID);
                $('#blankCardModal').modal('show');
            } else {
                storage.setSubmitCards(cardID);
            }
        }
        enableConfirm();
    }
}

function queueCustomText(){
    var cardID = $("#blankCardID").val();
    var cardText = $("#blankCard").val();
    storage.setSubmitCards(cardID, cardText);
    $('#blankCardModal').modal('hide');
    $("#blankCardID").val("");
    $("#blankCard").val("");
    enableConfirm();
}

function enableConfirm(){
    var localRound = storage.getRound();
    var cards = storage.getSubmitCards();
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
    var playerID = storage.getPlayerID();
    var gameID = storage.getGameID();
    var localRound = storage.getRound();
    var cards = storage.getSubmitCards();
    var roundID = localRound.id;
    //var czar = storage.getItem("cahczar");
    if(localRound.czar != playerID) {
        sendWsMessage("submitWhite", {
            gameID: gameID,
            roundID: roundID,
            whiteCards: cards,
            playerID: playerID
        });
    }
    clearSelection();
}

function wsHand(data)
{
    addToConsole("Acquired your hand.");
    $("#whiteHand").html("");
    data.hand.forEach(function(card){
        let whiteCard =
            `<div class="col-sm-6 col-md-4 col-lg-3 mb-4">
                        <div id="wc${card.id}" class="playerCard card bg-white whiteCard border border-primary" >
                            <div class="card-body">
                                <p class="card-text">${card.text}</p>
                                <span style="position: absolute; font-size:9px; bottom:5px; right:10px;"><i class="fas fa-layer-group"></i> ${card.set.name}</span>
                            </div>
                        </div>
                    </div>`;
        $("#whiteHand").append(whiteCard);
        document.getElementById(`wc${card.id}`).addEventListener('click', function() {queueWhiteCard(card.id, card.blankCard)});
    });

    if(data.mulligans > 0){
         $("#mulliganButton").removeClass('d-none');
    }
    else {
        $("#mulliganButton").addClass('d-none');
    }

}

function addToConsole(text){
    console.log(text);
}


function updatePlayers(players, czar){
    $("#playerList").html("");
    $("#mobilePlayerList").html("");
    var playerList = "";
    var playerID = storage.getPlayerID();
    var owner = storage.getOwnerID();

    players.forEach(function(player){
        let playerListEntry = "";
        if(player.id === czar){
            playerListEntry = '<li class="player list-group-item active playerEntry' + player.id + '">'
                    + player.name
                    + (player.id === owner ? '<i class="fas fa-crown ml-1"></i>' : '')
                    + ' <span class="badge badge-light float-right mr-1">'
                    + player.points
                    + '</span><span class="badge badge-info float-right mr-1"><i class="fas fa-gavel"></i></span></li>';

        }
        else {
            playerListEntry = '<li class="player list-group-item playerEntry' + player.id + '">'
                    + player.name
                    + (!player.active ? '<i class="fas fa-user-clock"></i>' : '')
                    + (player.id === owner ? '<i class="fas fa-crown ml-1"></i>' : '')
                    + ' <span class="badge badge-primary float-right">' + player.points + '</span></li>';
        }
        $("#playerList").append(playerListEntry);
        $("#mobilePlayerList").append(playerListEntry);

        //we use class instead of ID because the list is duplicated in the mobile and non-mobile sections
        let entries = document.getElementsByClassName(`playerEntry${player.id}`);
        for(let e of entries) {
            e.addEventListener('click', function() {playerMenu(player.id, player.name)});
        }
    });

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
    $("#gameBoard").html("");
    let candidateCardsHtml = "";
    whiteCards.forEach(function(candidateCard){
        candidateCardsHtml += '<div class="mb-4 mt-4 float-left candidateCardHolder">'
                    + '<div class="playerCard card bg-white whiteCard '
                    + (status == 'submit' ? 'whitePaper' : '') + ' border border-primary" '
                    + 'id="playercard' + candidateCard.id + '"'
                    + '><div class="card-body candidateCard" id="candidateCard'+candidateCard.player+'">';
        let cardNum = 1;
        candidateCard.cards.forEach(function(card){
            candidateCardsHtml += '<p class="card-text">'
                    + ((status == 'submit') ? '<span style="position: absolute; font-size:20px; bottom:10px; right:10px;"><i class="fas fa-clone"></i> DeNCAH</span>'
                        : (candidateCard.cards.length > 1
                        ? '<span class="badge badge-secondary mr-1">'+cardNum+'</span>':'')
                    + card + (candidateCard.cards.length > 1 && candidateCard.cards.length > cardNum ? '<hr/>':''))+'</p>';
            cardNum++;
        });
        candidateCardsHtml += ((candidateCard.winner) ? ' <span class="badge badge-success"><i class="fas fa-award fa-lg"></i> &nbsp;'+winner+'</span>' : '')+'</div></div></div>';
    });
    $("#blackCardHolder").html(blackCardHtml);
    $("#gameBoard").html(candidateCardsHtml);
    whiteCards.forEach(function(candidateCard) {
        document.getElementById(`playercard${candidateCard.id}`).addEventListener('click', function () {
            selectCandidateCard(candidateCard.player)
        });
    });

    var localRound = storage.getRound();
    $("#candidateCount").html(whiteCards.length.toString()+"/"+(localRound.players.length - 1).toString());
}

function selectCandidateCard(player){
    var localRound = storage.getRound();
    var playerID = storage.getPlayerID();
    let gameID = storage.getGameID();
    if(localRound.czar == playerID){
        addToConsole("Selected Candidate Card.");
        sendWsMessage("selectCandidate", {
                gameID: gameID,
                roundID: localRound.id,
                playerID: player
            });
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
    storage.setGameOver();
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
    var playerID = storage.getPlayerID();
    var gameID = storage.getGameID();
    var localRound = storage.getRound();
    if(round.game.winner){
        updateGameBoard(round.blackCard, round.candidateCards, round.status, round.winner.name || null);
        console.log("Game winner",round.game.winner.name);
        gameOver(round.game.winner.name);
    } else {
        if(localRound){
            $(".whiteCardCount").each(function(){
                $(this).html("<span class='badge badge-light border' style='background-color: #fff;'><i class='fas fa-layer-group'></i> "+round.game.whiteCards.length+"</span>");
            });
            $(".blackCardCount").each(function(){
                $(this).html("<span class='badge badge-dark border'><i class='fas fa-layer-group'></i> "+round.game.blackCards.length+"</span>");
            });
        }
        var changed = false;
        if(!localRound){
            console.log("Game started");
            storage.setRound(round);
            updateGameBoard(round.blackCard, round.candidateCards, round.status);
            updatePlayers(round.players, round.czar);
            if(round.czar != playerID){
                $("#selectionButtons").removeClass("d-none");
                $("#mobileSelectionButtons").removeClass("d-none");
                $("#czarBox").addClass("d-none");
            } else {
                $("#czarBox").html("You are the Czar!");
                $("#czarBox").removeClass("d-none");
                $("#selectionButtons").addClass("d-none");
                $("#mobileSelectionButtons").addClass("d-none");
            }
            return;
        }
        if(localRound.id != round.id){
            //new round
            updateGameBoard(round.blackCard, round.candidateCards, round.status);
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
                    $("#czarBox").removeClass("d-none");
                    $("#mobileCzarBox").html("Pick a winner!");
                    $("#mobileCzarBox").removeClass("d-none");
                }
                if(round.status == "closed") {
                    $("#nextRound").removeClass("d-none");
                    $("#czarBox").addClass("d-none");
                    $("#mobileCzarBox").html("Pick a winner!");
                    $("#mobileCzarBox").addClass("d-none");
                }
            }
            else {
                $("#nextRound").addClass("d-none");
            }
        }
        if(localRound.candidateCards.length != round.candidateCards.length){
            //New candidate cards
            console.log("new candidate cards");
            updateGameBoard(round.blackCard, round.candidateCards, round.status);
            changed = true;
        }
        if(changed){
            console.log("change... updating storage");
            storage.setRound(round);
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
    storage.delSubmitCards();
    storage.delCzarCard();
}


function startTalking() {
        $("#connectionText").html("Connecting to server...");
        $("#conn_icon_trying").removeClass("d-none");
        cah_ws = new WebSocket(CONFIG_WSURL);
        cah_ws.onopen = function () {
            $("#conn_icon_link").removeClass("d-none");
            $("#conn_icon_error").addClass("d-none");
            $("#conn_icon_offline").addClass("d-none");
            $("#connectionText").html("Server connected");
            console.log("Connection opened.");
            $("#connectionbox").modal("hide");
            cah_ws.onmessage = handleWsMessage;
        }

        cah_ws.onclose = function() {
            $("#conn_icon_link").addClass("d-none");
            $("#conn_icon_error").addClass("d-none");
            $("#conn_icon_offline").removeClass("d-none");
            $("#connectionText").html("Server disconnected");
            console.log("Connection closed.");
            $("#connectionbox").modal("show");
            setTimeout(startTalking, 2000);
        };

        cah_ws.onerror = function() {
            $("#conn_icon_link").addClass("d-none");
            $("#conn_icon_error").removeClass("d-none");
            $("#conn_icon_offline").removeClass("d-none");
            $("#connectionText").html("Connection error");
            console.log("Connection error.");
            $("#connectionbox").modal("show");
            setTimeout(startTalking, 2000);
        };
}


function sendWsMessage(action, payload) {
    if(cah_ws.readyState !== 1) {
        setTimeout(function(){
            sendWsMessage(action, payload, true)
        }, 1000);
        console.log(`Network not ready. Retrying ${action} in 1000ms.`);
        return;
    }
    console.log(`Sending ${action}.`);
    cah_ws.send(JSON.stringify({apiversion: expectedApiVersion, action: action, playerID: storage.getPlayerID(), payload: payload}));
}

function handleWsMessage(incoming) {
    try {
        const data = JSON.parse(incoming.data);
        if(data.action === undefined) {
            console.log("Actionless server message: " + incoming.data);
        }
        else {
            switch(data.action) {
                case "info" :
                    console.log("Server says: " + JSON.stringify(data.payload));
                    $("#infotext").html(data.payload);
                    $("#infobox").modal("show");
                    break;
                case "error":
                    console.log("Error: " + JSON.stringify(data.payload));
                    $("#errortext").html(data.payload);
                    $("#errorbox").modal("show");
                    break;
                case "getAllSetsResponse":
                    console.log("All sets message:" + JSON.stringify(data.payload));
                    wsAllSets(data.payload);
                    break;
                case "getGameResponse":
                    console.log("Get game message: " + JSON.stringify(data.payload));
                    $("#joinGameText").html("You've been invited to a game called "+data.payload.name+". Lucky you!");
                    break;
                case "createResponse" :
                    console.log("Create message: " + JSON.stringify(data.payload));
                    wsCreate(data.payload);
                    break;
                case "round" :
                    console.log("Round message: " + JSON.stringify(data.payload));
                    doGameUpdate(data.payload);
                    sendWsMessage("handRequest", {playerID: storage.getPlayerID(), gameID: storage.getGameID()});
                    break;
                case "joinResponse" :
                    console.log("Join message: " + JSON.stringify(data.payload));
                    storage.setPlayerID(data.playerID);
                    wsJoin(data.payload);
                    break;
                case "update":
                    console.log("Update message: " + JSON.stringify(data.payload));
                    updatePlayers(data.payload.players);
                    break;
                case "handResponse":
                    console.log("Hand message: " + JSON.stringify(data.payload));
                    wsHand(data.payload);
                    break;
                case "kickMessage":
                    console.log("Player kicked!");
                    updatePlayers(data.payload.players);
                    if(data.payload.kickeeID === storage.getPlayerID()) {
                        $('#gotKicked').modal('show');
                    }
                    break;
                default:
                    console.log("Other message:" + JSON.stringify(data));
            }
        }
    }
    catch (e) {
        console.log("ws message handler caught something: " + e);
    }
}
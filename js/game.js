
//set the base url for the various endpoints
//all API calls will start with this URL, e.g., `${CONFIG_BASEURL}/v1/games/getGame`
const CONFIG_API_HOST = "localhost";
const CONFIG_BASEURL = `http://${CONFIG_API_HOST}:3000`;
const CONFIG_WSURL = `ws://${CONFIG_API_HOST}:38080`;

let cah_ws = null;
start_talking();

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
            url: "https://dencah-deviler151532041.codeanyapp.com/v1/games/getGame",
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

// setInterval(function(){
//     var gameID = getGameID();
//     if(gameID){
//         $("#gameDetails").removeClass("d-none");
//         if(!getRound()){
//             $.ajax({
//                 url: `${CONFIG_BASEURL}/v1/games/getGame`,
//                 method: "POST",
//                 data: {
//                     gameID: gameID
//                 },
//                 success: function( result ) {
//                     updatePlayers(result.data.players, null);
//                     //console.log(result.data.winner);
//                     if(result.data.rounds.length > 0){
//                         getLatestRound(gameID);
//                     }
//                 }
//             });
//         } else {
//             getLatestRound(gameID);
//         }
//     } else {
//         $("#selectionButtons").addClass("d-none");
//         $("#mobileSelectionButtons").addClass("d-none");
//         $("#playerList").html("");
//         $("#mobilePlayerList").html("");
//     }
// }, 1000);

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
        var playerName = localStorage.getItem("cahplayername");
        if (playerName.length == 0) {
            addToConsole("Player Name is required.");
        } else {
            send_ws_message("create",
                {
                    gameID: null,
                    player: playerName,
                    sets: sets,
                    time_limit: time_limit,
                    score_limit: score_limit,
                    name: game_name
                });
        }
    }
});
function ws_create(create_data) {
    $("#whiteHand").html("");
    //$("#gameBoard").html("");

    addToConsole("Started new game: "+create_data.gameID);
    setGameID(create_data.gameID);
    addToConsole("Your player ID: "+create_data.players[0]._id);//todo: ID handling still seems problematic
    setPlayerID(create_data.players[0]._id);
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
    setOwnerID(create_data.owner);
}

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
    //getLatestRound(gameID);
    //send_ws_message("start_round", { gameID: gameID });
});

$("#joinGame").on('click', function(){
    var playerName = localStorage.getItem("cahplayername");
    var gameID = $("#gameID").val().trim();
    send_ws_message("join", {gameID: gameID, player: playerName});
});

function ws_join(join_data) {
    $("#whiteHand").html("");
    $("#gameBoard").html("");
    addToConsole("Joined game ID: "+join_data.gameID);
    setGameID(join_data.gameID);
    //addToConsole("player ID: "+join_data.players[result.data.players.length-1]._id);
    //setPlayerID(result.data.players[result.data.players.length-1]._id);
    updatePlayers(join_data.players, null);
    localStorage.removeItem("round");
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
    setOwnerID(join_data.owner);
}

$(".nextRound").on('click', function(){
    var gameID = getGameID();
    send_ws_message("start_round", { gameID: gameID });
    //$("#nextRound").html("<i class='fas fa-angle-double-right'></i> Next Round <i class='fas fa-angle-double-right'></i>");
    //$("#nextRound").addClass("d-none");
    //$("#mobileNextRound").addClass("d-none");
});

$("#mulliganConfirm").on('click', function(){
    var playerID = getPlayerID();
    var gameID = getGameID();
    $.ajax({
        url: "https://dencah-deviler151532041.codeanyapp.com/v1/games/mulligan",
        method: "POST",
        data: {
            playerID: playerID,
            gameID: gameID
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
    send_ws_message("kick",{
            gameID: gameID,
            playerID: playerID
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
        if(!cards || (cards.length < localRound.blackCard.pick && !cards.some(card => card == cardID))){
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
    //var czar = localStorage.getItem("cahczar");
    if(localRound.czar != playerID) {
        send_ws_message("submit_white", {
            gameID: gameID,
            roundID: roundID,
            whiteCards: cards,
            playerID: playerID
        });
    }
    clearSelection();
}

function ws_hand(hand)
{
    addToConsole("Acquired your hand.");
    $("#whiteHand").html("");
    var whiteHand = "";
    hand.forEach(function(card){
        whiteHand = whiteHand +
            `<div class="col-sm-6 col-md-4 col-lg-3 mb-4">
                        <div id="wc${card._id}" class="playerCard card bg-white whiteCard border border-primary" onClick="queueWhiteCard('${card._id}','${card.blankCard}')">
                            <div class="card-body">
                                <p class="card-text">${card.text}</p>
                                <span style="position: absolute; font-size:9px; bottom:5px; right:10px;"><i class="fas fa-layer-group"></i> ${card.set.name}</span>
                            </div>
                        </div>
                    </div>`;
    });
    $("#whiteHand").html(whiteHand);
    // if(hand.data.mulligans > 0){
    //     $("#mulliganButton").removeClass('d-none');
    // }
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
    let gameID = getGameID();
    if(localRound.czar == playerID){
        addToConsole("Selected Candidate Card.");
        send_ws_message("select_candidate", {
                gameID: gameID,
                roundID: localRound._id,
                player: player
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
                $(this).html("<span class='badge badge-light border' style='background-color: #fff;'><i class='fas fa-layer-group'></i> "+round.game.whiteCards.length+"</span>");
            });
            $(".blackCardCount").each(function(){
                $(this).html("<span class='badge badge-dark border'><i class='fas fa-layer-group'></i> "+round.game.blackCards.length+"</span>");
            });
        }
        var changed = false;
        if(!localRound){
            console.log("Game started");
            setRound(round);
            updateGameBoard(round.blackCard, round.candidateCards, round.status);
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
    localStorage.removeItem("cahmulligans");
    localStorage.removeItem("cahgameid");
    localStorage.removeItem("cahround");
    localStorage.removeItem("cahplayername");
    localStorage.removeItem("cahsubmitcards");
    localStorage.removeItem("cahgameover");
    localStorage.removeItem("cahczarselection");
}

function start_talking() {
        cah_ws = new WebSocket(CONFIG_WSURL);
        cah_ws.onopen = function () {
            cah_ws.onmessage = handle_ws_message;
        }
}


function send_ws_message(action, payload) {
    cah_ws.send(JSON.stringify({action: action, player_id: getPlayerID(), payload: payload}));
}

function handle_ws_message(incoming) {
    try {
        const data = JSON.parse(incoming.data);
        if(data.action === undefined) {
            console.log("Actionless server message: " + incoming.data);
        }
        else {
            switch(data.action) {
                case "info" :
                    console.log("Server says: " + JSON.stringify(data.payload));
                    break;
                case "create" :
                    console.log("Create message: " + JSON.stringify(data.payload));
                    ws_create(data.payload);
                    break;
                case "round" :
                    console.log("Round message: " + JSON.stringify(data.payload));
                    doGameUpdate(data.payload);
                    send_ws_message("hand", {playerID: getPlayerID()});
                    break;
                case "join" :
                    console.log("Join message: " + JSON.stringify(data.payload));
                    setPlayerID(data.playerID);
                    ws_join(data.payload);
                    break;
                case "update":
                    console.log("Update message: " + JSON.stringify(data.payload));
                    updatePlayers(data.payload.players);
                    break;
                case "hand":
                    console.log("Hand message: " + JSON.stringify(data.payload));
                    ws_hand(data.payload.hand);
                    break;
                case "kick":
                    console.log("Player kicked!");
                    updatePlayers(data.payload.players);
                    //todo: handle case where this player was kicked
                    if(data.payload.players.find(p => p._id == getPlayerID()) === undefined) {
                        $('#gotKicked').modal('show');
                    }
                    break;
                default:
                    console.log("Other message:" + data);
            }
        }
    }
    catch (e) {
        console.log("ws message handler caught something: " + e);
    }
}
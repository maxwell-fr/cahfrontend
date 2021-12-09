import {GameStorage} from "./modules/gamestorage.js";
import {WS_Client} from "./modules/ws_client.js";
import {uiInterface} from "./modules/ui_interface.js";


let storage = new GameStorage();
let uii = new uiInterface(storage);
let wsc = new WS_Client(storage, uii);

$(document).ready(function(){
    $("#newGame").html("Waiting for card sets to load...");
    $("#newGame").attr("disabled",true);
    wsc.sendWsMessage("getAllSetsRequest", {please: "pretty please"});

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
        wsc.sendWsMessage("getGameRequest", {gameID: vars.id});
        $("#openJoinButton").removeClass("collapsed");
        $("#collapseTwo").addClass("show");
        $("#gameID").val(vars.id);
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
            console.log("Player Name is required.");
        } else {
            wsc.sendWsMessage("createRequest",
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

    wsc.sendWsMessage("rejoinRequest", { gameID: gameID, playerID: playerID });
});

$("#joinGame").on('click', function(){
    let playerName = storage.getPlayerName();
    let gameID = $("#gameID").val().trim();
    wsc.sendWsMessage("joinRequest", {gameID: gameID, playerName: playerName});
});

$(".nextRound").on('click', function(){
    var gameID = storage.getGameID();
    wsc.sendWsMessage("startRound", { gameID: gameID });
    $("#nextRound").html("<i class='fas fa-angle-double-right'></i> Next Round <i class='fas fa-angle-double-right'></i>");
    $("#nextRound").addClass("d-none");
    $("#mobileNextRound").addClass("d-none");
});

$("#czarBox").on('click', function(){
    let localRound = storage.getRound();
    let playerID = storage.getPlayerID();
    let gameID = storage.getGameID();
    let selected = storage.getCzarCard()
    if (localRound.czar === playerID) {
        console.log("Sending Candidate Card.");

        wsc.sendWsMessage("selectCandidate", {
            gameID: gameID,
            roundID: localRound.id,
            playerID: selected
        });

        $("#czarBox").addClass("d-none")
                    .attr("disabled", true);
        $("#mobileCzarBox").addClass("d-none");
    }
});

$("#mulliganConfirm").on('click', function() {
    var playerID = storage.getPlayerID();
    var gameID = storage.getGameID();
    wsc.sendWsMessage("mulligan", {
        playerID: playerID,
        gameID: gameID
    });

    $('#mulliganModal').modal('hide');
});

$(".clearSelection").on('click', function(){
    uii.clearSelection();
});

$(".confirmSelection").on('click', function(){
    wsc.submitWhiteCards();
    uui.hideSelectionButtons();
    uui.clearSelection();
});

$("#toggleFS").on('click', function(e){
    uii.toggleFullscreen(e);
});

$("#kickButton").on('click', function(e){
    console.log("kick",$(this).attr('data-id'));
    var playerID = $(this).attr('data-id');
    var gameID = storage.getGameID();
    wsc.sendWsMessage("kickRequest",{
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

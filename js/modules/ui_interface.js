

export class uiInterface {
    constructor(storage) {
        this.storage = storage;        

    }

    /* uui stands for "update user interface*, in case you're wondering */

    uuiCreate(gameID) {
        $("#whiteHand").html("");
        //$("#gameBoard").html("");
        $(".gameIDtag").each(function () {
            $(this).html("Game Link:");
            $(".gameIDlink").each(function () {
                $(this).val(window.location.href + "?id=" + gameID);
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
    }


    uuiAllSets(sets) {
        sets.forEach(function (set) {
            $("#options").append(`
                        <div class="custom-control custom-switch">
                            <input type="checkbox" class="set_switch custom-control-input" id="${set.id}" checked>
                            <label class="custom-control-label" for="${set.id}">${set.name} <span class="badge badge-dark">${set.blackCardCount}</span> <span class="badge badge-light">${set.whiteCardCount}</span></label>
                        </div>`);
        });
        if (sets.length > 0) {
            $("#newGame").html("Start it up!");
        } else {
            $("#newGame").html("No sets available. Can't play without cards!");
        }
        $("#newGame").attr("disabled", false);
    }


    uuiJoin(gameID) {
        $("#whiteHand").html("");
        $("#gameBoard").html("");
        $(".gameIDtag").each(function () {
            $(this).html("Game Link:");
            /*
                If they joined via a gameID link we want to grab the URL up the the '?'
                then add the gameID to avoid the gameID being added on twice.
            */
            if (window.location.href.indexOf("?") > 0) {
                $(".gameIDlink").each(function () {
                    $(this).val(window.location.href.substr(0, window.location.href.indexOf("?")) + "?id=" + gameID);
                });
            } else {
                $(".gameIDlink").each(function () {
                    $(this).val(window.location.href + "?id=" + gameID);
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
    }


    uuiInfo(infoData) {
        $("#infotext").html(infoData);
        $("#infobox").modal("show");
    }


    uuiError(errorData) {
        $("#errortext").html(errorData);
        $("#errorbox").modal("show");
    }


    uuiGameResponse(gameName) {
        $("#joinGameText").html("You've been invited to a game called " + gameName + ". Lucky you!");
    }


    uuiWsStartup() {
        $("#connectionText").html("Connecting to server...");
        $("#conn_icon_trying").removeClass("d-none");
    }


    uuiWsOpen() {
        $("#conn_icon_link").removeClass("d-none");
        $("#conn_icon_error").addClass("d-none");
        $("#conn_icon_offline").addClass("d-none");
        $("#connectionText").html("Server connected");
        $("#connectionbox").modal("hide");
    }


    uuiWsClose() {
        $("#conn_icon_link").addClass("d-none");
        $("#conn_icon_error").addClass("d-none");
        $("#conn_icon_offline").removeClass("d-none");
        $("#connectionText").html("Server disconnected");
        $("#connectionbox").modal("show");
    }


    uuiWsError() {
        $("#conn_icon_link").addClass("d-none");
        $("#conn_icon_error").removeClass("d-none");
        $("#conn_icon_offline").removeClass("d-none");
        $("#connectionText").html("Connection error");
        $("#connectionbox").modal("show");
    }

    uuiHand(data) {
        console.log("Acquired your hand.");
        $("#whiteHand").html("");
        const myself = this;
        data.hand.forEach(function (card) {
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
            document.getElementById(`wc${card.id}`).addEventListener('click', function () {
                myself.queueWhiteCard(card.id, card.blankCard)
            });
        });

        if (data.mulligans > 0) {
            $("#mulliganButton").removeClass('d-none');
        } else {
            $("#mulliganButton").addClass('d-none');
        }
    }

    uuiKick(kicked) {
        if (kicked) {
            $('#gotKicked').modal('show');
        }
    }

    updatePlayers(players, czar = null) {
        $("#playerList").html("");
        $("#mobilePlayerList").html("");
        var playerList = "";
        var playerID = this.storage.getPlayerID();
        var owner = this.storage.getOwnerID();
        const myself = this;

        players.forEach(function (player) {
            let playerListEntry = "";
            if (player.id === czar) {
                playerListEntry = '<li class="player list-group-item active playerEntry' + player.id + '">'
                    + player.name
                    + (player.id === owner ? '<i class="fas fa-crown ml-1"></i>' : '')
                    + ' <span class="badge badge-light float-right mr-1">'
                    + player.points
                    + '</span><span class="badge badge-info float-right mr-1"><i class="fas fa-gavel"></i></span></li>';

            } else {
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
            for (let e of entries) {
                e.addEventListener('click', function () {
                    myself.playerMenu(player.id, player.name)
                });
            }
        });

        $("#playerCount").html(players.length);
    }

    doGameUpdate(round) {
        var playerID = this.storage.getPlayerID();
        var gameID = this.storage.getGameID();
        var localRound = this.storage.getRound();
        if (round.game.winner) {
            this.updateGameBoard(round.blackCard, round.candidateCards, round.status, round.winner.name || null);
            console.log("Game winner", round.game.winner.name);
            this.gameOver(round.game.winner.name);
        } else {
            if (localRound) {
                $(".whiteCardCount").each(function () {
                    $(this).html("<span class='badge badge-light border' style='background-color: #fff;'><i class='fas fa-layer-group'></i> " + round.game.whiteCards.length + "</span>");
                });
                $(".blackCardCount").each(function () {
                    $(this).html("<span class='badge badge-dark border'><i class='fas fa-layer-group'></i> " + round.game.blackCards.length + "</span>");
                });
            }
            var changed = false;
            if (!localRound) {
                console.log("Game started");
                this.storage.setRound(round);
                this.updateGameBoard(round.blackCard, round.candidateCards, round.status);
                this.updatePlayers(round.players, round.czar);
                if (round.czar != playerID) {
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
            if (localRound.id != round.id) {
                //new round
                this.updateGameBoard(round.blackCard, round.candidateCards, round.status);
                this.clearSelection();
                if (round.czar != playerID) {
                    $("#selectionButtons").removeClass("d-none");
                    $("#mobileSelectionButtons").removeClass("d-none");
                    $("#confirmSelection").attr("disabled", true);
                    $("#mobileConfirmSelection").attr("disabled", true);
                    $("#czarBox").addClass("d-none");
                    $("#mobileCzarBox").addClass("d-none");
                } else {
                    $("#selectionButtons").addClass("d-none");
                    $("#mobileSelectionButtons").addClass("d-none");
                    $("#czarBox").html("You are the Czar!");
                    $("#czarBox").removeClass("d-none");
                    $("#mobileCzarBox").html("You are the Czar!");
                    $("#mobileCzarBox").removeClass("d-none");
                    this.updatePlayers(round.players, round.czar);
                }
                changed = true;
            }
            if (localRound.status != round.status) {
                //New round status
                console.log("new round status " + round.status);
                if (round.winner) {
                    this.updateGameBoard(round.blackCard, round.candidateCards, round.status, round.winner.name || null);
                } else {
                    this.updateGameBoard(round.blackCard, round.candidateCards, round.status);
                }
                changed = true;
                if (round.czar == playerID) {
                    if (round.status == "select") {
                        $("#czarBox").html("Pick a winner!");
                        $("#czarBox").removeClass("d-none");
                        $("#mobileCzarBox").html("Pick a winner!");
                        $("#mobileCzarBox").removeClass("d-none");
                    }
                    if (round.status == "closed") {
                        $("#nextRound").removeClass("d-none");
                        $("#czarBox").addClass("d-none");
                        $("#mobileCzarBox").html("Pick a winner!");
                        $("#mobileCzarBox").addClass("d-none");
                    }
                } else {
                    $("#nextRound").addClass("d-none");
                }
            }
            if (localRound.candidateCards.length != round.candidateCards.length) {
                //New candidate cards
                console.log("new candidate cards");
                this.updateGameBoard(round.blackCard, round.candidateCards, round.status);
                changed = true;
            }
            if (changed) {
                console.log("change... updating storage");
                this.storage.setRound(round);
                this.updatePlayers(round.players, round.czar);
            }
        }
    }


    playerMenu(id, name) {
        console.log(`You clicked on ${name}. That's harassment.`);
        if (this.storage.getPlayerID() === this.storage.getOwnerID()) {
            $("#playerOptionsName").html(name);
            $("#kickButton").attr("data-id", id);
            $('#playerOptions').modal('show');
        }
    }

    queueWhiteCard(cardID, blankCard) {
        var cards = this.storage.getSubmitCards();
        var localRound = this.storage.getRound();
        if (localRound.czar !== this.storage.getPlayerID()) {
            if (!cards || (cards.length < localRound.blackCard.pick && !cards.some(card => card == cardID))) {
                $("#wc" + cardID).removeClass("bg-white");
                $("#wc" + cardID).removeClass("border-primary");
                $("#wc" + cardID).addClass("bg-primary");
                $("#wc" + cardID).addClass("border-white");
                if (blankCard == 'true') {
                    $("#blankCardID").val(cardID);
                    $('#blankCardModal').modal('show');
                } else {
                    this.storage.setSubmitCards(cardID);
                }
            }
            this.enableConfirm();
        }
    }

    enableConfirm() {
        var localRound = this.storage.getRound();
        var cards = this.storage.getSubmitCards();
        if (cards.length == localRound.blackCard.pick) {
            $("#confirmSelection").attr("disabled", false);
            $("#mobileConfirmSelection").attr("disabled", false);
        } else if (cards.length > localRound.blackCard.pick) {
            this.clearSelection();
        }
    }

    updateGameBoard(blackCard, whiteCards, status, winner = null) {
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
        whiteCards.forEach(function (candidateCard) {
            candidateCardsHtml += '<div class="mb-4 mt-4 float-left candidateCardHolder">'
                + '<div class="playerCard card bg-white whiteCard '
                + (status == 'submit' ? 'whitePaper' : '') + ' border border-primary" '
                + 'id="playercard' + candidateCard.id + '"'
                + '><div class="card-body candidateCard" id="candidateCard' + candidateCard.player + '">';
            let cardNum = 1;
            candidateCard.cards.forEach(function (card) {
                candidateCardsHtml += '<p class="card-text">'
                    + ((status == 'submit') ? '<span style="position: absolute; font-size:20px; bottom:10px; right:10px;"><i class="fas fa-clone"></i> DeNCAH</span>'
                        : (candidateCard.cards.length > 1
                            ? '<span class="badge badge-secondary mr-1">' + cardNum + '</span>' : '')
                        + card + (candidateCard.cards.length > 1 && candidateCard.cards.length > cardNum ? '<hr/>' : '')) + '</p>';
                cardNum++;
            });
            candidateCardsHtml += ((candidateCard.winner) ? ' <span class="badge badge-success"><i class="fas fa-award fa-lg"></i> &nbsp;' + winner + '</span>' : '') + '</div></div></div>';
        });
        $("#blackCardHolder").html(blackCardHtml);
        $("#gameBoard").html(candidateCardsHtml);
        const myself = this;
        whiteCards.forEach(function (candidateCard) {
            document.getElementById(`playercard${candidateCard.id}`).addEventListener('click', function () {
                myself.selectCandidateCard(candidateCard.player)
            });
        });

        var localRound = this.storage.getRound();
        $("#candidateCount").html(whiteCards.length.toString() + "/" + (localRound.players.length - 1).toString());
    }

    selectCandidateCard(player) {
        let localRound = this.storage.getRound();
        let playerID = this.storage.getPlayerID();
        if (localRound.czar === playerID) {
            $("#czarBox").html("Click here to confirm!");
            $("#czarBox").attr("disabled", false);

            let candidateCards = document.getElementsByClassName("candidateCard");
            //remove highlighting
            for(const card of candidateCards) {
                if(card.id !== "" ) {
                    $("#" + card.id).addClass("bg-white")
                        .addClass("border-primary")
                        .removeClass("bg-primary")
                        .removeClass("border-white");
                }
            }
            //add highlighting to selected
            $("#candidateCard" + player).removeClass("bg-white")
                .removeClass("border-primary")
                .addClass("bg-primary")
                .addClass("border-white")

            console.log("Selected Candidate Card.");
            this.storage.setCzarCard(player);
        }
    }

    gameOver(name) {
        this.storage.setGameOver();
        $("#gameDetails").html(name + " HAS WON THE GAME!");
        $("#nextRound").addClass("d-none");
        $("#mobileNextRound").addClass("d-none");
        $("#selectionButtons").addClass("d-none");
        $("#mobileSelectionButtons").addClass("d-none");
        $("#winnerDisplay").removeClass("d-none");
        $("#winnerDisplay").html('<i class="fas fa-trophy"></i> ' + name + " HAS WON THE GAME! " + '<i class="fas fa-trophy"></i>');
        $("#mobileWinnerDisplay").removeClass("d-none");
        $("#mobileWinnerDisplay").html('<i class="fas fa-trophy"></i> ' + name + " HAS WON THE GAME! " + '<i class="fas fa-trophy"></i>');

        const myself = this;
        document.getElementById("winnerDisplay").addEventListener("click", function(){myself.celebrate()});

        this.celebrate();
    }

    clearSelection() {
        $(".whiteCard").each(function () {
            $(this).removeClass("bg-primary");
            $(this).removeClass("border-white");
            //$(this).removeClass("bluePaper");
            $(this).addClass("bg-white");
            //$(this).addClass("whitePaper");
            $(this).addClass("border-primary");
        });
        $(".candidateCard").each(function () {
            $(this).removeClass("bg-primary");
            $(this).removeClass("border-white");
            //$(this).removeClass("bluePaper");
            $(this).addClass("bg-white");
            //$(this).addClass("whitePaper");
            $(this).addClass("border-primary");
        });
        $("#confirmSelection").attr("disabled", true);
        $("#mobileConfirmSelection").attr("disabled", true);
        this.storage.delSubmitCards();
        this.storage.delCzarCard();
    }

    toggleFullscreen(event) {
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

    queueCustomText(){
        var cardID = $("#blankCardID").val();
        var cardText = $("#blankCard").val();
        this.storage.setSubmitCards(cardID, cardText);
        $('#blankCardModal').modal('hide');
        $("#blankCardID").val("");
        $("#blankCard").val("");
        this.enableConfirm();
    }

    hideSelectionButtons() {
        $("#selectionButtons").addClass("d-none");
        $("#mobileSelectionButtons").addClass("d-none");
    }

    celebrate() {
        this.shootConfetti();
        setTimeout(this.shootConfetti, 500);
        setTimeout(this.shootConfetti, 1000);
        setTimeout(this.shootConfetti, 1500);
        setTimeout(this.shootConfetti, 2000);
    }

    shootConfetti(){
        const confetti_config = {
            particleCount: 100,
            startVelocity: 30,
            spread: 360,
            origin: {
                x: Math.random(),
                // since they fall down, start a bit higher than random
                y: Math.random() - 0.2
            }
        };

        confetti(confetti_config);
    }
}
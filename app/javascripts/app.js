import '../stylesheets/app.css'

import {
    default as Web3
} from 'web3'
import {
    default as contract
} from 'truffle-contract'
import {
    sha3withsize
} from 'solidity-sha3'
import {
    default as HookedWeb3Provider
} from 'hooked-web3-provider'
import {
    default as lightwallet
} from 'eth-lightwallet'


import registrar_artifacts from '../../build/contracts/Registrar.json'
import voting_artifacts from '../../build/contracts/Voting.json'
import creator_artifacts from '../../build/contracts/Creator.json'


var Registrar = contract(registrar_artifacts)
var Voting = contract(voting_artifacts)
var Creator = contract(creator_artifacts)
const input1 = 1
const input2 = 0
var timestamp
var cVote


var ballotID

let candidates = {}

//Set Web3 on page load

$(document).ready(function() {

    /*var provider = new HookedWeb3Provider({
        host: "http://localhost:8545",
        transaction_signer: ks
    });*/

    //window.web3 = provider;
    //window.web3.setProvider(provider);
    //window.web3 = new Web3(provider);

    if (typeof web3 !== "undefined") {
        window.web3 = new Web3(web3.currentProvider)
    } else {
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
    }

    Registrar.setProvider(web3.currentProvider)
    Voting.setProvider(web3.currentProvider)
    Creator.setProvider(web3.currentProvider)

    //Register.setProvider(provider);
    //Voting.setProvider(provider);

})

//End page load setup

//Load ballot using user input ballot ID

window.loadBallot = function() {
    $("#candidate-rows tr").remove()
    ballotID = $("#ballotid").val()
    candidates = {}

    Registrar.deployed().then(function(contract) {
        contract.getAddress.call(ballotID).then(function(v) {
            var votingAddress = v.toString();
            if (votingAddress == 0) {
                window.alert("Invalid ballot ID!")
                //$("#msg4").html("Invalid ballot ID!")
                throw new Error()
            } else {
                $("#msg4").html("Setting up ballot...")
                //$("#ballotid").val("")
                getCandidates(votingAddress, ballotID)
            }
        })
    })
}

//End load ballot

//Register voter using ballot id and e-mail address

window.registerToVote = function() {
    //var t0 = performance.now()
    let idNumber = $("#idnum").val()
    let email = $("#email").val()
    let permreq = $("input[name=permreq]:checked").val()

    if (permreq != 1) {
        permreq = 0;
    }

    var domain = email.replace(/.*@/, "")

    Registrar.deployed().then(function(contract) {
        contract.domainCheck.call(domain).then(function(v) {
            var domainValid = v.toString()

            if (domainValid == "false") {
                window.alert("Invalid e-mail address!")
                //$("#msg2").html("Invalid e-mail address!")
                throw new Error()
            }

            contract.checkReg.call(email, idNumber).then(function(v) {
                var emailValid = v.toString()

                if (emailValid == "false") {
                    window.alert("E-mail/ID Number already registered to vote!")
                    //$("#msg2").html("E-mail already registered to vote!")
                    throw new Error()
                }

                $("#idnum").val("")
                $("#email").val("")

                contract.registerVoter(email, idNumber, domain, permreq, {
                    gas: 2500000,
                    from: web3.eth.accounts[0]
                }).then(function() {
                    //$("#msg2").html("Account ready to vote!")
                    window.alert("Account ready to vote!")
                    /*var t1 = performance.now()
                    window.alert('It took' + (t1 - t0) + 'ms to finish')*/
                })
            })
        })
        $("#msg2").html("Registration attempt successful! Please wait for verification.")
    })
}

//End voter registration

//Vote for user input choice

window.voteForCandidate = function(candidate) {
    let candidateName = $("#candidate").val()
    let email = $("#e-mail").val()
    $("#msg2").html("")
    $("#msg4").html("")

    var domain = email.replace(/.*@/, "")
    var cHash = sha3withsize(candidateName, 32)

    var votesArray = []

    Registrar.deployed().then(function(contract) {
        contract.checkVoter(email, {
            gas: 2500000,
            from: web3.eth.accounts[0]
        }).then(function(v) {
            var voterCheck = v.toString()

            if (voterCheck == 1) {
                window.alert("E-mail address not registered!")
                //$("#msg").html("E-mail address not registered!")
                throw new Error()
            } else if (voterCheck == 2) {
                window.alert("E-mail address and Ethereum address mismatch!")
                //$("#msg").html("E-mail address and Ethereum address mismatch!")
                throw new Error()
            }

            contract.getAddress.call(ballotID).then(function(v) {
                var votingAddress = v.toString();
                Voting.at(votingAddress).then(function(contract) {
                    contract.getBallotType.call().then(function(v) {
                        let bt = v.toString()
                        contract.getVotesToWin.call().then(function(v) {
                            let vtw = v.toString()
                            contract.checkWhitelist.call().then(function(v) {
                                let wc1 = v.toString()
                                contract.checkifWhitelisted.call(email).then(function(v) {
                                    let wc2 = v.toString()
                                    if (wc1 == "true" && wc2 == "false") {
                                        window.alert("You're are not authorized to vote on this ballot!")
                                        //$("#msg").html("You're are not authorized to vote on this ballot!")
                                        throw new Error()
                                    } else {
                                        contract.validCandidate.call(cHash).then(function(v) {
                                            var candValid = v.toString()

                                            if (candValid == "false") {
                                                window.alert("Invalid Candidate!")
                                                //$("#msg").html("Invalid Candidate!")
                                                throw new Error()
                                            } else {
                                                contract.checkVoteattempts.call().then(function(v) {
                                                    var attempCheck = v.toString()

                                                    if (attempCheck == "false") {
                                                        window.alert("You have reached your voting limit for this ballot/poll!")
                                                        //$("#msg").html("You have reached your voting limit for this ballot/poll!")
                                                        throw new Error()
                                                    } else {
                                                        contract.getBallotStatus.call().then(function(v) {
                                                            var cont = v.toString()

                                                            if (cont == 1) {
                                                                window.alert("This ballot has closed because one of the choices/candidates reached the required number of votes to win!")
                                                                throw new Error()
                                                            } else {
                                                                //window.alert("got here!")
                                                                //$("#msg").html("Your vote attempt has been submitted. Please wait for verification.")
                                                                $("#candidate").val("")
                                                                $("#e-mail").val("")
                                                                if (bt == 2) {
                                                                    contract.candidateList.call(ballotID).then(function(candidateArray) {
                                                                        for (let i = 0; i < candidateArray.length; i++) {
                                                                            let hcand = (web3.toUtf8(candidateArray[i]))
                                                                            let hcHash = sha3withsize(hcand, 32)

                                                                            contract.totalVotesFor.call(hcHash).then(function(v) {
                                                                                var convVote = v.toString()
                                                                                convVote = scientificToDecimal(convVote)
                                                                                //window.alert("got here!")

                                                                                verifyDecrypt(convVote).done(function(cv) {
                                                                                    //$("#msg").html("Voting c " + cv)
                                                                                    if (vtw == cv) {
                                                                                        cont = 1
                                                                                        contract.changeBallotStatus({
                                                                                            gas: 100000,
                                                                                            from: web3.eth.accounts[0]
                                                                                        }).then(function() {
                                                                                            window.alert("This ballot has closed because one of the choices/candidates reached the required number of votes to win!")
                                                                                            throw new Error()
                                                                                        })
                                                                                    }
                                                                                })
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                                if (cont == 0) {
                                                                    contract.candidateList.call(ballotID).then(function(candidateArray) {
                                                                        for (let i = 0; i < candidateArray.length; i++) {
                                                                            let hcand = (web3.toUtf8(candidateArray[i]))
                                                                            let hcHash = sha3withsize(hcand, 32)

                                                                            if (hcHash == cHash) {
                                                                                encrypt(hcHash, input1, i, candidateArray, email, votingAddress, votesArray)
                                                                            } else {
                                                                                encrypt(hcHash, input2, i, candidateArray, email, votingAddress, votesArray)
                                                                            }
                                                                        }
                                                                    })
                                                                }

                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            })
                        })
                    })
                })
            })
        })
    })
}

//logical voting

window.logicVoteForCandidate = function(candidate) {
    let email = $("#e-mail2").val()
    $("#msg2").html("")
    $("#msg4").html("")
    let evoter = email
    var domain = email.replace(/.*@/, "")

    var votesArray = []

    Registrar.deployed().then(function(contract) {
        contract.checkVoter(email, {
            gas: 2500000,
            from: web3.eth.accounts[0]
        }).then(function(v) {
            var voterCheck = v.toString()

            if (voterCheck == 1) {
                window.alert("E-mail address not registered!")
                //$("#msg").html("E-mail address not registered!")
                throw new Error()
            } else if (voterCheck == 2) {
                window.alert("E-mail address and Ethereum address mismatch!")
                //$("#msg").html("E-mail address and Ethereum address mismatch!")
                throw new Error()
            }

            contract.getAddress.call(ballotID).then(function(v) {
                var votingAddress = v.toString();
                Voting.at(votingAddress).then(function(contract) {
                    contract.candidateList.call(ballotID).then(function(candidateArray) {
                        //let candHash = getcandHash(candidateArray, votingAddress)
                        //$("#msg").html("RunnerUp Cand " + candHash)
                        //logicallyVote(evoter, candHash)
                        getcandHash(candidateArray, votingAddress, evoter)
                    })
                })
            })
        })
    })
}

function getcandHash(candidateArray, votingAddress, evoter) {
    let largestVote = 0
    let runnerupVote = 0
    let lastVote = 999999
    let logictype = $("input[name=logicvote]:checked").val()
    let whentovote = $("input[name=votetime]:checked").val()
    let largestCand = null
    let runnerupCand = null
    let lastCand = null
    let logicHash = null

    Voting.at(votingAddress).then(function(contract) {
    if (whentovote == 1) {
        if (logictype == 0) {
            contract.addVoteForWinning(evoter, {
                gas: 2500000,
                from: web3.eth.accounts[0]
            }).then(function() {
                window.alert("Your vote will be counted towards the end of the ballot time!")
            })
        } else if (logictype == 1) {
            contract.addVoteForRunnerUp(evoter, {
                gas: 2500000,
                from: web3.eth.accounts[0]
            }).then(function() {
                window.alert("Your vote will be counted towards the end of the ballot time!")
            })
        } else if (logictype == 2) {
            contract.addVoteForLosing(evoter, {
                gas: 2500000,
                from: web3.eth.accounts[0]
            }).then(function() {
                window.alert("Your vote will be counted towards the end of the ballot time!")
            })
        }
    } else if (whentovote == 0) {
        for (let i = 0; i < candidateArray.length; i++) {
            let hcand = (web3.toUtf8(candidateArray[i]))
            let hcHash = sha3withsize(hcand, 32)

            //$("#msg").html("RunnerUp Vote " + hcand)

            //contract.totalVotesFor.call(hcHash).then(function(v) {
            //var convVote = v.toString()

            //var convVote = getCurrentVotes(hcHash)
            //convVote = scientificToDecimal(convVote)
            //let checkvote = getCurrentVotes(hcHash, votingAddress)

            //verifyDecrypt(convVote).done(function(cv) {
            //Voting.at(votingAddress).then(function(contract) {
                contract.totalVotesFor.call(hcHash).then(function(v) {
                    var convVote = v.toString()
                    convVote = scientificToDecimal(convVote)

                    verifyDecrypt(convVote).done(function(cv) {
                        //window.alert("got here!")
                        //$("#msg").html("RunnerUp 2Vote " + cv)
                        let checkvote = cv

                    // $("#msg").html("RunnerUp Vote " + checkvote)
                        //window.alert("got here!")

                        if (checkvote >= largestVote) {
                            runnerupVote = largestVote
                            largestVote = checkvote
                            runnerupCand = largestCand
                            largestCand = hcHash
                        } else if (checkvote > runnerupVote) {
                            runnerupVote = checkvote
                            runnerupCand = hcHash
                        }

                        if (checkvote < lastVote) {
                            lastVote = checkvote
                            lastCand = hcHash
                        } else if (checkvote == lastVote) {
                            let randChoice = Math.floor(Math.random() * 2)

                            if (randChoice == 1) {
                                lastCand = hcHash
                            }
                        }

                        if (i == candidateArray.length-1) {
                            $("#msg").html("Winning " + largestVote + " Runner-Up " + runnerupVote + " Losing " + lastVote)

                            if (logictype == 0) {
                                if (runnerupVote == largestVote) {
                                    let randChoice = Math.floor(Math.random() * 2)

                                    if (randChoice == 1) {
                                        logicHash = runnerupCand
                                    } else {
                                        logicHash = largestCand
                                    }
                                } else {
                                    logicHash = largestCand
                                }
                            } else if (logictype == 1) {
                                if (runnerupVote == largestVote) {
                                    let randChoice = Math.floor(Math.random() * 2)

                                    if (randChoice == 1) {
                                        logicHash = largestCand
                                    } else {
                                        logicHash = runnerupCand
                                    }
                                } else if (runnerupVote == lastVote) {
                                    let randChoice = Math.floor(Math.random() * 2)

                                    if (randChoice == 1) {
                                        logicHash = lastCand
                                    } else {
                                        logicHash = runnerupCand
                                    }
                                } else {
                                    logicHash = runnerupCand
                                }
                            } else if (logictype = 2) {
                                logicHash = lastCand
                            }

                            logicallyVote(evoter, logicHash)

                        }

                    })
                })
        }
    }
    })

}

function getCurrentVotes(hcHash, votingAddress) {
    Voting.at(votingAddress).then(function(contract) {
        contract.totalVotesFor.call(hcHash).then(function(v) {
            var convVote = v.toString()
            convVote = scientificToDecimal(convVote)

            verifyDecrypt(convVote).done(function(cv) {
                //window.alert("got here!")
                //$("#msg").html("RunnerUp 2Vote " + cv)
                return cv
            })
        })
    })
}


function logicallyVote(evoter, candHash) {
    let email = evoter;
    $("#msg2").html("")
    $("#msg4").html("")

    var domain = email.replace(/.*@/, "")
    var cHash = candHash

    var votesArray = []

    Registrar.deployed().then(function(contract) {
        contract.checkVoter(email, {
            gas: 2500000,
            from: web3.eth.accounts[0]
        }).then(function(v) {
            var voterCheck = v.toString()

            if (voterCheck == 1) {
                window.alert("E-mail address not registered!")
                //$("#msg").html("E-mail address not registered!")
                throw new Error()
            } else if (voterCheck == 2) {
                window.alert("E-mail address and Ethereum address mismatch!")
                //$("#msg").html("E-mail address and Ethereum address mismatch!")
                throw new Error()
            }

            contract.getAddress.call(ballotID).then(function(v) {
                var votingAddress = v.toString();
                Voting.at(votingAddress).then(function(contract) {
                    contract.getBallotType.call().then(function(v) {
                        let bt = v.toString()
                        contract.getVotesToWin.call().then(function(v) {
                            let vtw = v.toString()
                            contract.checkWhitelist.call().then(function(v) {
                                let wc1 = v.toString()
                                contract.checkifWhitelisted.call(email).then(function(v) {
                                    let wc2 = v.toString()
                                    if (wc1 == "true" && wc2 == "false") {
                                        window.alert("You're are not authorized to vote on this ballot!")
                                        //$("#msg").html("You're are not authorized to vote on this ballot!")
                                        throw new Error()
                                    } else {
                                        contract.validCandidate.call(cHash).then(function(v) {
                                            var candValid = v.toString()

                                            if (candValid == "false") {
                                                window.alert("Invalid Candidate!")
                                                //$("#msg").html("Invalid Candidate!")
                                                throw new Error()
                                            } else {
                                                contract.checkVoteattempts.call().then(function(v) {
                                                    var attempCheck = v.toString()

                                                    if (attempCheck == "false") {
                                                        window.alert("You have reached your voting limit for this ballot/poll!")
                                                        //$("#msg").html("You have reached your voting limit for this ballot/poll!")
                                                        throw new Error()
                                                    } else {
                                                        contract.getBallotStatus.call().then(function(v) {
                                                            var cont = v.toString()

                                                            if (cont == 1) {
                                                                window.alert("This ballot has closed because one of the choices/candidates reached the required number of votes to win!")
                                                                throw new Error()
                                                            } else {
                                                                //window.alert("got here!")
                                                                //$("#msg").html("Your vote attempt has been submitted. Please wait for verification.")
                                                                $("#candidate").val("")
                                                                $("#e-mail").val("")
                                                                if (bt == 2) {
                                                                    contract.candidateList.call(ballotID).then(function(candidateArray) {
                                                                        for (let i = 0; i < candidateArray.length; i++) {
                                                                            let hcand = (web3.toUtf8(candidateArray[i]))
                                                                            let hcHash = sha3withsize(hcand, 32)

                                                                            contract.totalVotesFor.call(hcHash).then(function(v) {
                                                                                var convVote = v.toString()
                                                                                convVote = scientificToDecimal(convVote)
                                                                                //window.alert("got here!")

                                                                                verifyDecrypt(convVote).done(function(cv) {
                                                                                    //$("#msg").html("Voting c " + cv)
                                                                                    if (vtw == cv) {
                                                                                        cont = 1
                                                                                        contract.changeBallotStatus({
                                                                                            gas: 100000,
                                                                                            from: web3.eth.accounts[0]
                                                                                        }).then(function() {
                                                                                            window.alert("This ballot has closed because one of the choices/candidates reached the required number of votes to win!")
                                                                                            throw new Error()
                                                                                        })
                                                                                    }
                                                                                })
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                                if (cont == 0) {
                                                                    contract.candidateList.call(ballotID).then(function(candidateArray) {
                                                                        for (let i = 0; i < candidateArray.length; i++) {
                                                                            let hcand = (web3.toUtf8(candidateArray[i]))
                                                                            let hcHash = sha3withsize(hcand, 32)

                                                                            if (hcHash == cHash) {
                                                                                encrypt(hcHash, input1, i, candidateArray, email, votingAddress, votesArray)
                                                                            } else {
                                                                                encrypt(hcHash, input2, i, candidateArray, email, votingAddress, votesArray)
                                                                            }
                                                                        }
                                                                    })
                                                                }

                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            })
                        })
                    })
                })
            })
        })
    })
}


function encrypt(hcHash, vnum, i, candidateArray, email, votingAddress, votesArray) {
    var einput1
    $.ajax({
        type: "GET",
        url: "http://localhost:3000/encrypt/" + vnum,
        success: function(eoutput1) {
            Voting.at(votingAddress).then(function(contract) {
                contract.votesFor.call(hcHash).then(function(v) {
                    einput1 = v.toString()
                    einput1 = scientificToDecimal(einput1)

                    if (einput1 != 0) {
                        add(eoutput1, einput1, i, candidateArray, email, votingAddress, votesArray)
                    }
                })
            })
        }
    })
}

function add(eoutput1, einput1, i, candidateArray, email, votingAddress, votesArray) {
    $.ajax({
        type: "GET",
        url: "http://localhost:3000/add/" + eoutput1 + "/" + einput1,
        success: function(eadd1) {
            verifyBallot(eadd1, i, candidateArray, email, votingAddress, votesArray)
        }
    })
}

function verifyBallot(eadd1, i, candidateArray, email, votingAddress, votesArray) {
    Voting.at(votingAddress).then(function(contract) {
        contract.checkTimelimit.call().then(function(v) {
            var timecheck = v.toString()
            if (timecheck == "false") {
                contract.getTimelimit.call().then(function(v) {
                    var endtime = v.toString()
                    //Testnet is plus 7 hours, uncomment this line if testing on testnet
                    //endtime = endtime - 21600
                    endtime = new Date(endtime * 1000)
                    getVotes(votingAddress)
                    //window.alert("Voting period for this ballot has ended on " +endtime)
                    $("#msg").html("Voting period for this ballot has ended on " + endtime)
                    throw new Error()
                })
            } else {
                votesArray[i] = eadd1
                if (i == candidateArray.length - 1) {
                    vote(i, candidateArray, email, votingAddress, votesArray)
                }
            }
        })
    })
}

function vote(i, candidateArray, email, votingAddress, votesArray) {
    Voting.at(votingAddress).then(function(contract) {
        contract.voteForCandidate(votesArray, email, candidateArray, {
            gas: 2500000,
            from: web3.eth.accounts[0]
        }).then(function() {
            getVotes(votingAddress)
            $("#msg").html("")
            window.alert("Your vote has been verified!")
        })
    })
}

//End voting process

//Start ballot creation process using user input data

window.ballotSetup = function() {
    let cemail = $("#cemail").val()

    Registrar.deployed().then(function(contract) {
        contract.checkVoter.call(cemail).then(function(v) {
            var voterCheck = v.toString()

            if (voterCheck == 1) {
                window.alert("E-mail address not registered!")
                //$("#msg").html("E-mail address not registered!")
                throw new Error()
            } else if (voterCheck == 2) {
                window.alert("E-mail address and Ethereum address mismatch!")
                //$("#msg").html("E-mail address and Ethereum address mismatch!")
                throw new Error()
            } else {

                contract.getPermission.call(cemail).then(function(v) {
                    let emailCheck = v.toString()
                    if (emailCheck == 0) {
                        //$("#msg3").html("You are not authorized to create ballots! Please contact admin to request authorization.")
                        window.alert("You are not authorized to create ballots! Please contact admin to request authorization.")
                        throw new Error()
                    } else {
                        let date = $("#date").val()
                        var enddate = (Date.parse(date).getTime() / 1000)
                        let time = $("#time").val()
                        //Testnet is plus 7 hours
                        //-21600 to get original end date and time on testnet
                        var timeArray = time.split(':')
                        //Testnet is plus 7 hours, uncomment this line if testing on testnet
                        //var seconds = ((timeArray[0]*60)*60) + (timeArray[1]*60) + 21600
                        var seconds = ((timeArray[0] * 60) * 60) + (timeArray[1] * 60)
                        enddate += seconds
                        let ballottype = $("input[name=ballottype]:checked").val()
                        let title = $("#vtitle").val()
                        let choices = $("#choices").val()
                        var choicesArray = choices.split(/\s*,\s*/)
                        let votelimit = $("#votelimit").val()
                        let votestowin = $("#votestowin").val()
                        let whitelist = $("input[name=whitelist]:checked").val()
                        let whitelisted = $("#whitelisted").val()
                        var whitelistedArray = whitelisted.split(/\s*,\s*/)
                        let ballotid = Math.floor(Math.random() * 4294967295)

                        if (votestowin <= 0) {
                            votestowin = 99999
                        }

                        Creator.deployed().then(function(contract) {
                            contract.createBallot(enddate, ballottype, votelimit, ballotid, title, whitelist, votestowin, {
                                gas: 2500000,
                                from: web3.eth.accounts[0]
                            }).then(function() {
                                contract.getAddress.call(ballotid).then(function(v) {
                                    var votingAddress = v.toString()
                                    //window.alert(votingAddress)
                                    fillSetup(votingAddress, choicesArray, whitelistedArray, whitelist, ballotid)
                                    registerBallot(votingAddress, ballotid)
                                })
                            })
                        })
                    }
                })
            }
        })
    })
}

function registerBallot(votingaddress, ballotid) {
    Registrar.deployed().then(function(contract) {
        contract.setAddress(votingaddress, ballotid, {
            gas: 2500000,
            from: web3.eth.accounts[0]
        }).then(function() {
            window.alert("Ballot creation successful! Ballot ID: " + ballotid + "\nPlease write the down the Ballot ID because it will be used to load your ballot allowing users to vote")
        })
    })
}

function fillSetup(votingAddress, choicesArray, whitelistedArray, whitelist, ballotid) {
    fillCandidates(votingAddress, choicesArray)
    if (whitelist == 1) {
        fillWhitelisted(votingAddress, whitelistedArray)
    }
}

function fillCandidates(votingAddress, choicesArray) {
    Voting.at(votingAddress).then(function(contract) {
        contract.setCandidates(choicesArray, {
            gas: 2500000,
            from: web3.eth.accounts[0]
        }).then(function() {
            contract.hashCandidates({
                gas: 2500000,
                from: web3.eth.accounts[0]
            }).then(function() {
                //
            })
        })
    })
}

function fillWhitelisted(votingAddress, whitelistedArray) {
    Voting.at(votingAddress).then(function(contract) {
        contract.setWhitelisted(whitelistedArray, {
            gas: 2500000,
            from: web3.eth.accounts[0]
        }).then(function() {
            //
        })
    })
}

//End ballot creation process

function getCandidates(votingAddress, ballotID) {
    Voting.at(votingAddress).then(function(contract) {
        contract.getTitle.call().then(function(title) {
            $("#btitle").html(title)

            contract.candidateList.call(ballotID).then(function(candidateArray) {
                for (let i = 0; i < candidateArray.length; i++) {
                    candidates[web3.toUtf8(candidateArray[i])] = "candidate-" + i
                }

                setupTable()
                getVotes(votingAddress)
            })
        })
    })
}

function setupTable() {
    Object.keys(candidates).forEach(function(candidate) {
        $("#candidate-rows").append("<tr><td>" + candidate + "</td><td id='" + candidates[candidate] + "'></td></tr>");
    })
}

function getVotes(votingAddress) {
    let candidateNames = Object.keys(candidates)
    for (var i = 0; i < candidateNames.length; i++) {
        let name = candidateNames[i]
        let cvHash = sha3withsize(name, 32)

        Voting.at(votingAddress).then(function(contract) {
            contract.totalVotesFor.call(cvHash).then(function(v) {

                var convVote = v.toString()

                if (convVote == 0) {
                    contract.getTimelimit.call().then(function(v) {
                        var endtime = v.toString()
                        //Testnet is plus 7 hours, uncomment this line if testing on testnet
                        //endtime = endtime - 21600
                        endtime = new Date(endtime * 1000);
                        $("#msg").html("Results will be displayed once the voting period has ended (" + endtime + ")")
                        //window.alert("Results will be displayed once the voting period has ended (" + endtime + ")")
                    })
                } else {
                    convVote = scientificToDecimal(convVote)
                    decrypt(convVote, name)
                }
            })
        })
    }
}

//in-complete function
//to-do allow admin to run this function so any left over
//logical votes will be accounted for before ending ballot
window.logicVoteCheck = function() {
    ballotID2 = $("#ballotid2").val()
    candidates2 = {}

    Registrar.deployed().then(function(contract) {
        contract.getAddress.call(ballotID2).then(function(v) {
            var votingAddress = v.toString();
            if (votingAddress == 0) {
                window.alert("Invalid ballot ID!")
                //$("#msg4").html("Invalid ballot ID!")
                throw new Error()
            }
            //in-complete
        })
    })
}

function decrypt(convVote, name) {
    $.ajax({
        type: "GET",
        url: "http://localhost:3000/decrypt/" + convVote,
        success: function(eoutput) {
            var voteNum = eoutput
            $("#" + candidates[name]).html(voteNum.toString())
        }
    })
}

function verifyDecrypt(convVote) {
    return $.ajax({
        type: "GET",
        async: false,
        url: "http://localhost:3000/decrypt/" + convVote,
        /*success: function(eoutput) {
            var voteNum = eoutput
        }*/
    })
}
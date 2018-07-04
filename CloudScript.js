///////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Welcome to your first Cloud Script revision!
//
// Cloud Script runs in the PlayFab cloud and has full access to the PlayFab Game Server API 
// (https://api.playfab.com/Documentation/Server), and it runs in the context of a securely
// authenticated player, so you can use it to implement logic for your game that is safe from
// client-side exploits. 
//
// Cloud Script functions can also make web requests to external HTTP
// endpoints, such as a database or private API for your title, which makes them a flexible
// way to integrate with your existing backend systems.
//
// There are several different options for calling Cloud Script functions:
//
// 1) Your game client calls them directly using the "ExecuteCloudScript" API,
// passing in the function name and arguments in the request and receiving the 
// function return result in the response.
// (https://api.playfab.com/Documentation/Client/method/ExecuteCloudScript)
// 
// 2) You create PlayStream event actions that call them when a particular 
// event occurs, passing in the event and associated player profile data.
// (https://api.playfab.com/playstream/docs)
// 
// 3) For titles using the Photon Add-on (https://playfab.com/marketplace/photon/),
// Photon room events trigger webhooks which call corresponding Cloud Script functions.
// 
// The following examples demonstrate all three options.
//
///////////////////////////////////////////////////////////////////////////////////////////////////////


// This is a Cloud Script function. "args" is set to the value of the "FunctionParameter" 
// parameter of the ExecuteCloudScript API.
// (https://api.playfab.com/Documentation/Client/method/ExecuteCloudScript)
// "context" contains additional information when the Cloud Script function is called from a PlayStream action.
handlers.helloWorld = function (args, context) {
    
    // The pre-defined "currentPlayerId" variable is initialized to the PlayFab ID of the player logged-in on the game client. 
    // Cloud Script handles authenticating the player automatically.
    var message = "Hello " + currentPlayerId + "!" + args.inputValue;

    // You can use the "log" object to write out debugging statements. It has
    // three functions corresponding to logging level: debug, info, and error. These functions
    // take a message string and an optional object.
    log.info(message);
    var inputValue = null;
    if (args && args.inputValue)
        inputValue = args.inputValue;
    log.debug("helloWorld:"+inputValue);

    // The value you return from a Cloud Script function is passed back 
    // to the game client in the ExecuteCloudScript API response, along with any log statements
    // and additional diagnostic information, such as any errors returned by API calls or external HTTP
    // requests. They are also included in the optional player_executed_cloudscript PlayStream event 
    // generated by the function execution.
    // (https://api.playfab.com/playstream/docs/PlayStreamEventModels/player/player_executed_cloudscript)
    return { messageValue: message };
};


//segment

//get player from that  segment
handlers.getSuggestionPlayer = function(args)
{
   var result =	server.GetLeaderboardAroundUser({
    	"StatisticName": "Level",
        "PlayFabId": currentPlayerId,
        "MaxResultsCount": 3
    });
  
  return result;
};

//add friend to both side
handlers.addFriendOnBothSide= function(args,content)
{
	//add friend to requester
 	var result1 = server.addFriend(
    {  
      PlayFabId:  currentPlayerId ,
      FriendPlayFabId:args.friendId
    }   
 	);
	var result2 = server.addFriend(
    {  
      PlayFabId:  currentPlayerId ,
      FriendPlayFabId: args.friendId
    }   
 	);
  
  //set friend tag requester and requestee
   var resultSetFriend = server.SetFriendTags(
    {
        PlayFabId: args.friendId,
    	FriendPlayFabId: currentPlayerId,
      	Tags: [
        "requester"
        ]
    }
  );
  
  var resultSetFriend = server.SetFriendTags(
    {
        PlayFabId: currentPlayerId,
    	FriendPlayFabId: args.friendId,
      	Tags: [
        "requestee"
        ]
    }
  );
  
 
};

handlers.messageToPlayer = function (args) {
  var messageGroupId = args.toPlayerId + "_messages";
  var dataPayload = {};
  var keyString = currentPlayerId;
  dataPayload[keyString] = args.messageText;

  server.UpdateSharedGroupData(
    {
      "SharedGroupId": messageGroupId, "Data" : dataPayload
    }
  );
}

handlers.updateSharedData = function(args,context)
{
  var writerID = args.senderID;
  var content = args.message ;
  var keyString = currentPlayerId;
  var dataPayload = {};
  dataPayload[writerID] = content;
  
	var result = server.UpdateSharedGroupData({
    
      SharedGroupId:args.GroupID,
      "Data" : dataPayload,
      Permission: "Public"
    }
                                              
    );
};

handlers.getShared = function(args,context)
{
  var curContent= server.GetSharedGroupData(
    {
      //Keys :args.senderID,
      SharedGroupId : args.GroupID,
      GetMembers : false
    }
  );
  log.debug(curContent);
};


handlers.updatePlayerSharedDataAddForServer = function(args,context)
{
	var curContent= server.GetSharedGroupData(
    {
      SharedGroupId : currentPlayerId,
      GetMembers : false
    }
  );

  var content;
  if(curContent.Data[args.senderID])
  {
    content = curContent.Data[args.senderID].Value + "," + args.message;
  }
  else
  {
    content = args.message;
  }
  
  log.debug("result content:" + content);
  var dataPayload = {};
  dataPayload[args.senderID] = content;
  
	var result = server.UpdateSharedGroupData({
    
      SharedGroupId:currentPlayerId,
      "Data" : dataPayload,
      Permission: "Public"
    }
                                              
    );
}

//add with the message in the server
handlers.updateSharedDataAdd = function(args,context)
{
  var curContent= server.GetSharedGroupData(
    {
      SharedGroupId : args.GroupID,
      GetMembers : false
    }
  );

  var content;
  if(curContent.Data[args.senderID])
  {
    content = curContent.Data[args.senderID].Value + "," + args.message;
  }
  else
  {
    content = args.message;
  }
  
  log.debug("result content:" + content);
  var dataPayload = {};
  dataPayload[args.senderID] = content;
  
	var result = server.UpdateSharedGroupData({
    
      SharedGroupId:args.GroupID,
      "Data" : dataPayload,
      Permission: "Public"
    }
                                              
    );
};
handlers.collectFurnitureGift = function(args,context)
{
  var furList = args.furList;
  var newMessage = args.cutMessage; 
  //the original sender
  var writerID = args.senderID

	var result = server.GrantItemsToUser({
        PlayFabId: currentPlayerId,
        Annotation: "Gift from Server",
  		ItemIds: furList
  
    });
    	//add money success
      	//remove the message 
  		var dataPayload = {};
  		dataPayload[writerID] = newMessage;
      
  if(newMessage == "")
  {
   var resultUpdate = server.UpdateSharedGroupData({
    
      SharedGroupId:currentPlayerId,
       Permission: "Public",
       KeysToRemove:writerID
    });
  }
  else
  {
   var resultUpdate = server.UpdateSharedGroupData({
    
      SharedGroupId:currentPlayerId,
      "Data" : dataPayload,
       Permission: "Public"
    });
  }
}
handlers.collectCurrnecyGift = function(args,context)
{
  var currencyType = args.cType;
  var amount = args.amount;
  var newMessage = args.cutMessage; 
  //the original sender
  var writerID = args.senderID

	var result = server.AddUserVirtualCurrency({
        PlayFabId: currentPlayerId,
  		VirtualCurrency: currencyType,
  		Amount: amount
    });
    	//add money success
      	//remove the message 
  		var dataPayload = {};
  		dataPayload[writerID] = newMessage;
      
  if(newMessage == "")
  {
   var resultUpdate = server.UpdateSharedGroupData({
    
      SharedGroupId:currentPlayerId,
       Permission: "Public",
       KeysToRemove:writerID
    });
  }
  else
  {
   var resultUpdate = server.UpdateSharedGroupData({
    
      SharedGroupId:currentPlayerId,
      "Data" : dataPayload,
       Permission: "Public"
    });
  }
}

handlers.deleteMessage = function(args,context)
{
  //var currencyType = args.cType;
  //var amount = args.amount;
  var newMessage = args.cutMessage; 
  //the original sender
  var writerID = args.senderID
  
  //add money success
  //remove the message 
  var dataPayload = {};
  dataPayload[writerID] = newMessage;
      
  if(newMessage == "")
  {
   var resultUpdate = server.UpdateSharedGroupData({
    
      SharedGroupId:currentPlayerId,
       Permission: "Public",
       KeysToRemove:writerID
    });
  }
  else
  {
   var resultUpdate = server.UpdateSharedGroupData({
    
      SharedGroupId:currentPlayerId,
      "Data" : dataPayload,
       Permission: "Public"
    });
  }
}

//delete shared group
handlers.deleteShared = function(args,context)
{
	var result =  server.DeleteSharedGroup(
      {
      		SharedGroupId: currentPlayerId
      }    
    );
};

//delete shared group
handlers.createShared = function(args,context)
{
	var result =  server.CreateSharedGroup(
      {
      		SharedGroupId: currentPlayerId
      }    
    );
};


//add money to player
handlers.addMoney = function(args, context) {
    // The server API can add virtual currency safely
    var addGoldResult = server.AddUserVirtualCurrency({
        PlayFabId: currentPlayerId,
        VirtualCurrency: "CO",
        Amount: args.amount
    });
   log.debug("Coin :"+args.amount+" Added");
};

//=========================================================================
//setup the starter lay out and set level to 1
handlers.generateStartingResources = function(args)
{
  
   var request = {
        PlayFabId: currentPlayerId, Statistics: [{
                StatisticName: "Level",
                Value: 1
            }]
    };
    var playerStatResult = server.UpdatePlayerStatistics(request);
  
    var wallLayout = "0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0";
    var tileLayout =	"1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0";
  //ID,TYPE,X,Y,FDIR,Z
  //WINDOW(ID=4) x3
  //DOOR(ID=1) x1
  //CABINET(ID=1) x1
  //CHAIR(ID=1) x5
  //COOKING STATION(ID=1) x2
  //TABLE(ID=2)x4
    var furLayout = "4,8,0,3,3,1|4,8,1,0,2,1|4,8,6,0,2,1|1,7,3,0,2,1|1,6,9,0,2,1|1,4,5,3,1,1|1,4,5,6,1,1|1,4,0,4,0,1|1,4,9,3,3,1|1,4,9,7,0,1|1,2,11,11,2,1|1,2,11,9,2,1|2,3,4,3,2,1|2,3,4,6,2,1|2,3,9,6,2,1|2,3,10,3,2,1";
    var sizeX = "12";
  	var sizeY = "12";
  
    var updateUserDataResult = server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: {
            RL_SizeX_1: sizeX,
            RL_SizeY_1: sizeY,
            RL_Tiles_1: tileLayout,
            RL_Walls_1: wallLayout,
            RL_Furnitures_1: furLayout
        },
      Permission: "Public"
    });
  
      var addGoldResult = server.GrantItemsToUser({
        Annotation: "FREE",
        PlayFabId: currentPlayerId,
        ItemIds: "STARTER_PACK1_FREE"
    });
  
  log.debug("Generated Starting Resources for PlayerID :"+currentPlayerId+"");
  return {RL_SizeX :sizeX ,RL_SizeY: sizeY,RL_Tiles : tileLayout,RL_Walls : wallLayout,RL_Furnitures :furLayout};
};
//=========================================================================

// This is a simple example of making a web request to an external HTTP API.
handlers.makeHTTPRequest = function (args, context) {
    var headers = {
        "X-MyCustomHeader": "Some Value"
    };
    
    var body = {
        input: args,
        userId: currentPlayerId,
        mode: "foobar"
    };

    var url = "http://httpbin.org/status/200";
    var content = JSON.stringify(body);
    var httpMethod = "post";
    var contentType = "application/json";

    // The pre-defined http object makes synchronous HTTP requests
    var response = http.request(url, httpMethod, content, contentType, headers);
    return { responseContent: response };
};

// This is a simple example of a function that is called from a
// PlayStream event action. (https://playfab.com/introducing-playstream/)
handlers.handlePlayStreamEventAndProfile = function (args, context) {
    
    // The event that triggered the action 
    // (https://api.playfab.com/playstream/docs/PlayStreamEventModels)
    var psEvent = context.playStreamEvent;
    
    // The profile data of the player associated with the event
    // (https://api.playfab.com/playstream/docs/PlayStreamProfileModels)
    var profile = context.playerProfile;
    
    // Post data about the event to an external API
    var content = JSON.stringify({ user: profile.PlayerId, event: psEvent.EventName });
    var response = http.request('https://httpbin.org/status/200', 'post', content, 'application/json', null);

    return { externalAPIResponse: response };
};


// Below are some examples of using Cloud Script in slightly more realistic scenarios

// This is a function that the game client would call whenever a player completes
// a level. It updates a setting in the player's data that only game server
// code can write - it is read-only on the client - and it updates a player
// statistic that can be used for leaderboards. 
//
// A funtion like this could be extended to perform validation on the 
// level completion data to detect cheating. It could also do things like 
// award the player items from the game catalog based on their performance.
handlers.completedLevel = function (args, context) {
    var level = args.levelName;
    var monstersKilled = args.monstersKilled;
    
    var updateUserDataResult = server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            lastLevelCompleted: level
        }
    });

    log.debug("Set lastLevelCompleted for player " + currentPlayerId + " to " + level);
    var request = {
        PlayFabId: currentPlayerId, Statistics: [{
                StatisticName: "level_monster_kills",
                Value: monstersKilled
            }]
    };
    server.UpdatePlayerStatistics(request);
    log.debug("Updated level_monster_kills stat for player " + currentPlayerId + " to " + monstersKilled);
};


// In addition to the Cloud Script handlers, you can define your own functions and call them from your handlers. 
// This makes it possible to share code between multiple handlers and to improve code organization.
handlers.updatePlayerMove = function (args) {
    var validMove = processPlayerMove(args);
    return { validMove: validMove };
};


// This is a helper function that verifies that the player's move wasn't made
// too quickly following their previous move, according to the rules of the game.
// If the move is valid, then it updates the player's statistics and profile data.
// This function is called from the "UpdatePlayerMove" handler above and also is 
// triggered by the "RoomEventRaised" Photon room event in the Webhook handler
// below. 
//
// For this example, the script defines the cooldown period (playerMoveCooldownInSeconds)
// as 15 seconds. A recommended approach for values like this would be to create them in Title
// Data, so that they can be queries in the script with a call to GetTitleData
// (https://api.playfab.com/Documentation/Server/method/GetTitleData). This would allow you to
// make adjustments to these values over time, without having to edit, test, and roll out an
// updated script.
function processPlayerMove(playerMove) {
    var now = Date.now();
    var playerMoveCooldownInSeconds = 15;

    var playerData = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: ["last_move_timestamp"]
    });

    var lastMoveTimestampSetting = playerData.Data["last_move_timestamp"];

    if (lastMoveTimestampSetting) {
        var lastMoveTime = Date.parse(lastMoveTimestampSetting.Value);
        var timeSinceLastMoveInSeconds = (now - lastMoveTime) / 1000;
        log.debug("lastMoveTime: " + lastMoveTime + " now: " + now + " timeSinceLastMoveInSeconds: " + timeSinceLastMoveInSeconds);

        if (timeSinceLastMoveInSeconds < playerMoveCooldownInSeconds) {
            log.error("Invalid move - time since last move: " + timeSinceLastMoveInSeconds + "s less than minimum of " + playerMoveCooldownInSeconds + "s.");
            return false;
        }
    }

    var playerStats = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId
    }).Statistics;
    var movesMade = 0;
    for (var i = 0; i < playerStats.length; i++)
        if (playerStats[i].StatisticName === "")
            movesMade = playerStats[i].Value;
    movesMade += 1;
    var request = {
        PlayFabId: currentPlayerId, Statistics: [{
                StatisticName: "movesMade",
                Value: movesMade
            }]
    };
    server.UpdatePlayerStatistics(request);
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            last_move_timestamp: new Date(now).toUTCString(),
            last_move: JSON.stringify(playerMove)
        }
    });

    return true;
}

// This is an example of using PlayStream real-time segmentation to trigger
// game logic based on player behavior. (https://playfab.com/introducing-playstream/)
// The function is called when a player_statistic_changed PlayStream event causes a player 
// to enter a segment defined for high skill players. It sets a key value in
// the player's internal data which unlocks some new content for the player.
handlers.unlockHighSkillContent = function (args, context) {
    var playerStatUpdatedEvent = context.playStreamEvent;
    var request = {
        PlayFabId: currentPlayerId,
        Data: {
            "HighSkillContent": "true",
            "XPAtHighSkillUnlock": playerStatUpdatedEvent.StatisticValue.toString()
        }
    };
    var playerInternalData = server.UpdateUserInternalData(request);
    log.info('Unlocked HighSkillContent for ' + context.playerProfile.DisplayName);
    return { profile: context.playerProfile };
};

// Photon Webhooks Integration
//
// The following functions are examples of Photon Cloud Webhook handlers. 
// When you enable the Photon Add-on (https://playfab.com/marketplace/photon/)
// in the Game Manager, your Photon applications are automatically configured
// to authenticate players using their PlayFab accounts and to fire events that 
// trigger your Cloud Script Webhook handlers, if defined. 
// This makes it easier than ever to incorporate multiplayer server logic into your game.


// Triggered automatically when a Photon room is first created
handlers.RoomCreated = function (args) {
    log.debug("Room Created - Game: " + args.GameId + " MaxPlayers: " + args.CreateOptions.MaxPlayers);
};

// Triggered automatically when a player joins a Photon room
handlers.RoomJoined = function (args) {
    log.debug("Room Joined - Game: " + args.GameId + " PlayFabId: " + args.UserId);
};

// Triggered automatically when a player leaves a Photon room
handlers.RoomLeft = function (args) {
    log.debug("Room Left - Game: " + args.GameId + " PlayFabId: " + args.UserId);
};

// Triggered automatically when a Photon room closes
// Note: currentPlayerId is undefined in this function
handlers.RoomClosed = function (args) {
    log.debug("Room Closed - Game: " + args.GameId);
};

// Triggered automatically when a Photon room game property is updated.
// Note: currentPlayerId is undefined in this function
handlers.RoomPropertyUpdated = function (args) {
    log.debug("Room Property Updated - Game: " + args.GameId);
};

// Triggered by calling "OpRaiseEvent" on the Photon client. The "args.Data" property is 
// set to the value of the "customEventContent" HashTable parameter, so you can use
// it to pass in arbitrary data.
handlers.RoomEventRaised = function (args) {
    var eventData = args.Data;
    log.debug("Event Raised - Game: " + args.GameId + " Event Type: " + eventData.eventType);

    switch (eventData.eventType) {
        case "playerMove":
            processPlayerMove(eventData);
            break;

        default:
            break;
    }
};

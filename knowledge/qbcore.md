# QBCore Framework Documentation

QBCore is a highly flexible and powerful framework for FiveM.

## Core Functions
- `QBCore.Functions.GetPlayer(source)`: Returns the player data for the given source ID.
- `QBCore.Functions.GetPlayers()`: Returns an array of all player sources.
- `QBCore.Functions.Notify(text, type, duration)`: Sends a notification to the client.
- `QBCore.Functions.HasItem(source, item, amount)`: Checks if a player has a specific item.

## Events
- `QBCore:Client:OnPlayerLoaded`: Triggered when the player core data is loaded.
- `QBCore:Server:OnPlayerLoaded`: Triggered on the server when a player is loaded.
- `QBCore:Notify`: Event for sending notifications.

## Metadata
Player metadata can be used to store persistent information like hunger, thirst, health, but also custom attributes like 'eid_gift_claimed_at'.

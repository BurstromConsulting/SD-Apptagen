The base for this Project has been using Elgato's own Stream Deck Plugin Template.

# Stream Deck Plugin Template

The `Stream Deck Plugin Template` is a boilerplate template to let you get started quickly when writing a Javascript plugin for [Stream Deck](https://developer.elgato.com/documentation/stream-deck/).

`Stream Deck Plugin Template` requires Stream Deck 4.1 or later.

# Description
The SD-Apptagen .sdPlugin is a simple Javascript based plugin thats just a rewritten version of SD Template.
This projekt contains two actions:
Login - which takes the IP of the server you're trying to reach
Status - Which takes a message and an status.
To be able to login and set your status, you would need to ensure that you've both filled out your Login action ( you can have multiple login actions on the stream deck, but it references the last logged in one for all Status actions ). If the IP has not been set in one of the Login actions, there will be no status options in the Status action.
All data is stored based off of the Context of the button calling the plugin.

## Features:

Features:
- code written in Javascript
- cross-platform (macOS, Windows)
- localization support
----

## Using the DistributionTool:
So after making changes to the code, such as changing the name, image or anything else of the stream deck plugin. You'll need to make a new file to install the plugin with. This is done through the DistributionTool.exe which is included with the project.

To create a new plugin run the following command from "LOCATION\StreamDeck Plugin\streamdeck-plugintemplate>" in your Command line:
".\DistributionTool.exe -b -i .\Sources\com.elgato.template.sdPlugin\ -o Release"
And it will generate a new plugin for you, assuming there isnt one in the sources folder. 

# Snatch It

A web-based implementation of the competitive word spotting game.

Play the demo here

## About the Game

Snatch-It is game of turning over letter tiles, spotting words, and stealing your opponents’ words by making anagrams. Two or more people can play.

More detailed game instructions are provided within the app-website.

The rules are simple and enforced by the system, so you could just start a game and work it out as you go.


## Snatch-it as a multi-player website

What we have here is a software implementation of the board game. But how can a website be multi-player? In common with lots of online games, snatch-it works with the concept of “virtual rooms”. When the host player creates a new room on the site, they are given a unique token. They share this with other players (outside of the website), allowing the others to join.

Although the software is a website (not smart-phone App) it should be playable on any smart-phone or tablet. You can use your Wi-Fi or 3G (mobile data) connection. In other words, it is a mobile-friendly website, and I have taken care to make it playable using using only a touch-screen. That said, people who play at a desktop computer with a conventional keyboard will be at an advantage. All the letters will be larger and clearer, and the faster text entry will allow more aggressive play!

The scoring is based entirely upon the end-state of the game when all 100 letters have been turned. A player’s score is determined by the set of words they then have. A 3-letter word scores one point. Every letter in the word beyond the first three makes it worth one more point.

One of the features in this software is a graph of scores against time. This reveals extra information which would not normally be captured playing with non-virtual tiles. It makes it possible to see the relative strength of play over the full course of a game. Snatch-it is a game where tables can turn and everything can change right up to the last few turns, so watch out!


## About the Project

I started building Snatch-It in my final couple of weeks of my Fall 2 2015 batch the Recurse Centre, and spent the following 9 months back in London perfecting it (actually it’s still unfinished!). Largely this is a project in Websockets and JavaScript user-interfaces.

### Software Libraries

From this project I learned a lot about building software for web. Two JavaScript libraries I’ve used especially heavily are Fabric JS and Socket IO.

Socket IO provides web-sockets, which are a persistent, real-time communication channel between a loaded web-page (‘client’) and some program running on the server. The channel is bi-directional. This means the server can send messages to a client (or broadcast to all clients), whilst clients can message the server.

So during a game of snatch-it, a client would ping a message to the server saying “I’m taking this word”. If accepted, the server would broadcast a message to all clients saying “this word has been taken”, with a payload of data to identify exactly which copies of which letters have been used. All of this happens in an automatic way without any reloading of the page, which would be tedious. Other messages get exchanged when players join or leave a game, when a player signals they’ve done and are ready for scoring, and when the dictionary-lookup system running on the server has found a word definition.

Fabric JS delivers all the labelled boxes, lettering and coloured rectangles jumping about on your screen. It is a 2D graphics library, with a nice API supporting animation for all the basic graphical elements. So that’s filled-rectangles, rectanglar outlines, bits of lettering etc. Due to an over-readiness to re-build things completely from scratch, I have effectively reinvented a significant portion of CSS using a lower level framework in this project. It was the complexity this entailed that made me decide to rewrite the entire visuals-rendering part of the code half-way through. If I was building it again, I would absolutely use DOM elements styled with CSS. On top of this, I would now also use React to propagate the impact of events upon the visuals - which would make development of all the 2D graphics comparatively effortless!

### Other software libraries

Writing software is a mixture of sourcing ready-made components that provide standard functions, and wrting the custom bits oneself. Other libraries I’ve used are:

(To be Completed….)

For the client

chartjs
flickity
jQuery

For the server
Express

(Python)
Beautiful Soup


## Other projects

Taking what
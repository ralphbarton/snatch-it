# Snatch It

A web-based implementation of the competitive word spotting game.

Play the demo [here](http://www.snatch-it.rocks/).

## About the Game

Snatch-It is game of turning over letter tiles, spotting words, and stealing your opponents’ words by making anagrams. Two or more people can play.

More detailed game instructions are provided within the [app-website](http://www.snatch-it.rocks/).

The rules are simple and enforced by the system. You could just [start a game](http://www.snatch-it.rocks/) and work it out as you go.


## Snatch-it as a multi-player website

What we have here is a software implementation of the board game. But how can a website be multiplayer? In common with lots of online games, *snatch it* works with the concept of *virtual rooms*. When the host player creates a new room on the site they get a unique token. They share this with other players (outside of the website) allowing the others to join.

Although the software is a website (so not smartphone App) it is playable on any smartphone or tablet. For this you can use your Wi-Fi or 3G (mobile data) connection. In other words, it is a mobile-friendly website, and I have taken care to make it playable using using only a touch-screen. That said, people who play at a desktop computer with a conventional keyboard will be at an advantage. All the letters will be larger and clearer, and the faster text entry will allow more aggressive play!

The scoring is based entirely upon the end-state of the game when all 100 letters have been turned. A player’s score is determined by the set of words they then have. A 3-letter word scores one point. Every letter in the word beyond the first three makes it worth one more point.

One of the features in this software is a graph of players' scores against time. This reveals extra information which would not normally be captured, playing with non-virtual tiles. It makes it possible to see the relative strength of play over the full course of a game. Snatch-it is a game where the tables can turn and everything can change right up to the last few moves, so watch out!


## About the Project

I started building Snatch-It in my final couple of weeks of my Fall 2 2015 batch the [Recurse Centre](https://www.recurse.com/), and spent the following 9 months back in London perfecting it (actually it’s still unfinished!). Largely this is a project in [WebSockets](https://www.fullstackpython.com/websockets.html) and JavaScript user-interfaces.

### Software Libraries

From this project I learned a lot about building software for web. Two JavaScript libraries I’ve used especially heavily are Fabric JS and Socket IO.

**[Socket IO](https://socket.io/)** provides web-sockets, which are a persistent, real-time communication channel between a loaded web-page (‘client’) and some program running on the server. The channel is bi-directional. This means the server can send messages to a client (or broadcast to all clients), whilst clients can message the server.

So during a game of snatch-it, a client would ping a message to the server saying “I’m taking this word”. If accepted, the server would broadcast a message to all clients saying “this word has been taken”, with a payload of data to identify exactly which copies of which letters have been used. All of this happens in an automatic way without any reloading of the page, which would be tedious. Other messages get exchanged when players join or leave a game, when a player signals they’ve done and are ready for scoring, and when the dictionary-lookup system running on the server has found a word definition.

**[Fabric JS](http://fabricjs.com/) delivers all the labelled boxes, lettering and coloured rectangles jumping about on your screen. It is a 2D graphics library, with a nice API allowing animation on all these basic graphical elements. So that’s filled-rectangles, rectanglar outlines, bits of lettering etc. Due to *an over-readiness to re-build things completely from scratch*, I have effectively reinvented a significant portion of [CSS](https://en.wikipedia.org/wiki/Cascading_Style_Sheets)'s layout logic using this lower level framework, in this project. It was the complexity this entailed that made me decide to rewrite the entire visuals-rendering part of the code half-way through. If I was building this software again now, I would absolutely use DOM elements styled with CSS. On top of this, I would now also use [React](https://reactjs.org/) to propagate the impact of all of the events into all of the visuals - which would make development of all the 2D graphics comparatively effortless!

### Other software libraries

Writing software is a mixture of sourcing ready-made components that provide standard functions, and writing the custom bits oneself. And weaving it all together. Other libraries I’ve used are:

#### On the client-side:

**[jQuery](https://jquery.com/)** – whilst most of the game happens all within a single full-screen HTML5 canvas, animated and manipulated using fabric JS, there are few DOM element overlays on this. This includes the little messages (“Toasts”) which fade in and out, the options menu, the scores popout. DOM elements are dynamically created using jQuery.


**[Flickity](https://flickity.metafizzy.co/)** – here is a library which provides touch-responsive, flickable “carousels”. A good way to jazz up one’s apps! Go to the Snatch-It Instructions (‘options’ button is in the upper-right) to see it in use.

**[Chart.js](http://www.chartjs.org/) – there are various libraries for generating graphs of live-data, and embedding it in a website. Chart.js provides the *scores graph* (itself inside another flickity carousel).

**[Multi-coloured push Buttons](http://www.cssflow.com/snippets/multi-colored-push-buttons/demo)** (CSS only) – I used to buy push buttons from Maplins.

**[Spinner](https://projects.lukehaas.me/css-loaders/)** (CSS only) – this fixed animation is most likely to an appearance if you’re playing over a 3G! If there is latency in the connection then the game has to indicate it. If the server is not responding then what you’re seeing on your screen your may not reflect the other players’ most recent moves.


#### On the server-side:

**[Express](https://expressjs.com/)** – this is at the core of a web-app built in [Node.JS](https://nodejs.org/en/). Among other things, express manages the task of serving the web-pages of the website.

**_[(Python)](https://en.wikipedia.org/wiki/Python_(programming_language))_**

**[Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/)** – this forms a part of the game you don’t see directly but is working in the background. Try hovering the mouse over a word. After a second or so the definition of the word will appear. Am I hosting a massive database with definitions of all possible words? No. I am running a module of code on the server which can actually visit web-pages and digest the HTML code to extract bits of information. This part is actually written in Python, and Beautiful Soup is a library that facilitates web scraping .

**[Autobahn](https://crossbar.io/autobahn/)** – the python application which runs on the server and gets the definitions of words by ‘scraping’ http://www.dictionary.com/ is a distinct program from the Node application which runs the snatch-it games. So how do they communicate? The answer is using sockets, in this case WebSockets are a standard allowing a local (i.e. not over the internet but within the same machine) exchange of messages encoded in [JSON](https://en.wikipedia.org/wiki/JSON).


## Other projects

Using what I learned building *snatch it*, I am now (since Dec '16) building a web-based patterns design system. The Goal it a piece of intuitive software that will let uses create abstract artwork [like this](http://ralphbarton.co.uk/patterns). Work is ongoing.
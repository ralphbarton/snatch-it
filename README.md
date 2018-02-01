# Snatch It

A web-based implementation of the competitive word spotting game.

Demo [here](http://www.snatch-it.rocks/)

## About the Game

**Snatch it** is game of turning over letter tiles, spotting words, and stealing your opponents’ words by making anagrams. Two people or more can play.

Full instructions are provided within [the 'app'/website](http://www.snatch-it.rocks/).

The rules are simple and enforced by the system. You could just [start a game](http://www.snatch-it.rocks/) and work it out as you go.


## Snatch-it as a multi-player website

What we have here is a software implementation of the board game. But how can a website be multiplayer? In common with lots of online games, **snatch it** works with the concept of *virtual rooms*. When the host player creates a new room on the site he or she is given a unique token. Sharing this with other players allows them to join the same game.

Although the software is a website (i.e. not smartphone App) it is playable on any smartphone or tablet. For this you can use your Wi-Fi or 3G (mobile data) connection. In other words, it is a mobile-friendly website, and I have taken care to make it playable using using only the touch-screen. That said, people who play at a desktop computer with a conventional keyboard will be at an advantage. All the letters will be larger and clearer, and the faster text entry will allow more aggressive play!

The scoring is based entirely upon the end-state of the game when all 100 letter-tiles have been turned. Each player’s score is determined by the set of words they then have. A 3-letter word scores one point. Every letter of the word beyond the first three makes it worth one more point.

One of the features in this software is a graph of players' scores against time. This reveals extra information which would not normally be captured, playing with non-virtual tiles. It makes it possible to see the relative strength of play over the full course of a game. **Snatch it** is a game where the tables can turn quickly, right up untill the last few moves... so watch out!


## About the Project

I started building **snatch it** in my final couple of weeks of my Fall 2 2015 batch the [Recurse Centre](https://www.recurse.com/). I spent 9 following months back in London perfecting it (actually it’s still unfinished!). Largely this is a project in [WebSockets](https://www.fullstackpython.com/websockets.html) and JavaScript user-interfaces.

### Software Libraries

From this project I have learned a lot about building software for web. Two JavaScript libraries I’ve used especially heavily are **Fabric JS** and **Socket IO**.

**[Socket IO](https://socket.io/)** provides the WebSockets. A WebSocket is a persistent, real-time communication channel between a loaded web-page (client) and some permanently-running program on the server. The channel is bi-directional. This means the server can send messages to a client (or *broadcast* a message to *all clients* (in a *room*)), and clients can send messages to the server.

So during a game of **snatch it**, a client would ping a message to the server saying “I’m taking this word”. If accepted, the server would broadcast a message to all clients saying “this word has been taken”, along with a *payload* of data (identifing exactly which copies of which of the letter tiles have just been used). All of this happens in an automatic way without any 'Submit' button or reloading of the page which would be tedious. Other messages get exchanged when players join or leave a game, when a player signals they’re done and are ready for scoring, and when the dictionary-lookup system running on the server has found a word definition.

**[Fabric JS](http://fabricjs.com/)** delivers all the labelled boxes, lettering and coloured rectangles that jump about on your screen during a game. It is a 2D graphics library, with a nice API that allows the animation of all these elementry graphical elements (filled-rectangles; rectanglar outlines; bits of lettering etc.). Due to [an over-readiness to just build things from scratch](https://media.licdn.com/media/AAEAAQAAAAAAAAZSAAAAJDRlMWFlMzAyLWIyZmItNDY3ZS04ZjM0LTAzYTA0MTI4MmViMw.png), I have effectively reinvented a portion of [CSS](https://en.wikipedia.org/wiki/Cascading_Style_Sheets)'s layout functionality using this lower level library. It was the complexity entailed by this that caused me to decide to rewrite the entire visuals-rendering part of the code about half-way through the project. If I was building this software again now, I would absolutely use DOM elements styled with CSS. On top of this, I would now also use [React](https://reactjs.org/) to propagate the impact of all of the *game events* into all of the visuals - which would make development of all the 2D graphics comparatively effortless!

### Other software libraries

Writing software is a mixture of sourcing ready-made components that provide standard functions, and writing the custom bits oneself. And weaving it all together. Other libraries I’ve used are:

#### On the client-side:

**[jQuery](https://jquery.com/)** – although much of the **snatch it** game happens all within a single full-screen *HTML5 canvas* (animated and manipulated using fabric JS) there are few DOM elements that sometimes overlay this. This includes the little notification (“Toasts”) which fade in and out, the options menu, the scores popout. DOM elements are dynamically created using jQuery.


**[Flickity](https://flickity.metafizzy.co/)** – here is a library which provides *touch-responsive, flickable “carousels”*. A good way to jazz up one’s apps! Go to the **snatch it** instructions (‘options’ button, upper-right) to see how I have used flickity.

**[Chart.js](http://www.chartjs.org/)** – various JavaScript libraries can turn raw data into graphs for embedding into a website. Here, I chose Chart.js to render the *scores graph* (itself inside another flickity carousel).

**[Multi-coloured push Buttons](http://www.cssflow.com/snippets/multi-colored-push-buttons/demo)** (CSS only) – I used to buy my push buttons from Maplins.

**[Spinner](https://projects.lukehaas.me/css-loaders/)** (CSS only) – this fixed animation is most likely to make an appearance if you’re playing over a 3G! If there is latency in the connection then the game has to warn you of this. If messages are not being recieved from the server, then what you are seeing on your screen may not reflect the other players’ most recent moves.


#### On the server-side:

**[Express](https://expressjs.com/)** – this is at the core of a web-app built in [Node.js](https://nodejs.org/en/). Among other things, Express manages the task of serving the actual web-pages of the website.

**_(bits in [Python](https://en.wikipedia.org/wiki/Python_(programming_language)))_**

**[Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/)** – this forms a part of the game you don’t see directly but is working in the background. Try hovering the mouse over a word. After a second or so the definition of the word will appear. Am I hosting a massive database with all the definitions of all the possible words? No. I am running a module of code on the server which can actually visit other webpages on your behalf, and does so automatically. It will then digest the HTML response to extract particular bits of information. This part is written in Python. Beautiful Soup is a library that facilitates [web scraping](https://en.wikipedia.org/wiki/Web_scraping) by converting the served html file into a ['Tree data structure'](https://en.wikipedia.org/wiki/Tree_(data_structure)).

**[Autobahn](https://crossbar.io/autobahn/)** – the Python application which scrapes the word definitions from [www.dictionary.com](http://www.dictionary.com/) is a distinct program running on the server to the Node application running all the concurrent **snatch it** games. So how do they communicate? The answer is using sockets. WebSockets are an abstraction-layer built on top of TCP sockets and here I am using the WebSocket standard for local (i.e. not over the internet but within the same machine) exchange of messages encoded in [JSON](https://en.wikipedia.org/wiki/JSON) between two distinct processes. The Python side of the Websocket is Autobahn.


## Other projects

Using what I have learned building **snatch it**, I am now (since Dec '16) building a [web-based patterns design system](https://github.com/ralphbarton/pattern-generation). The goal of this project is an intuitive-to-use system that will allow you to create [Abstract Patterns](http://ralphbarton.co.uk/patterns).

Work is ongoing
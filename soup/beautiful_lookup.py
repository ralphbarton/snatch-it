# -*- coding: utf-8 -*-
from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory

#from pyquery import PyQuery as pq

from twisted.web import client
from twisted.internet import reactor

import bs4, json


#def json_reply(html_string)

#def async_lookup_json_reply(protocol_object, search_word):

#    json_reply


def json_from_whole_page(page_html, search_word):

    soup = bs4.BeautifulSoup(page_html, "html.parser")

    DefinitionHTML_list = []
    main_content_tag = soup.body.find('section', id="source-luna")
    word_actual = '---'
    n_definitions = 0

    if main_content_tag is not None:

        #firstly get the word actually being defined (the dictionary may redirect e.g. remove plurals)
        #this extracts from
        #<h1 class="head-entry"><span class="me" data-syllable="i·tal·i·cize">italicize</span></h1>
        word_actual = soup.body.find('h1', class_="head-entry").span.string
        Defn_Divs = main_content_tag.find_all('div', class_="def-content")

        for defn_div in Defn_Divs:

            n_definitions = n_definitions +1

            if len(DefinitionHTML_list) < 3:
                # rename fragment main tag
                defn_div['class'] = 'definition'
       
                # mod 1. strip any classes from any contained links
                for tag in defn_div.find_all('a'):
                    del tag['class']
                
                # mod 2. remove any span of class pronset
                for tag in defn_div.find_all('span', class_="pronset"):
                    tag.decompose()

                # mod 3. remove wrapping span, if class dbox-roman
                # (this shouldn't affect links of this class, since the classname has already been removed)
                for tag in defn_div.find_all('span', class_="dbox-roman"):
                    tag.unwrap()

                # mod 4. remove wrapping span, if class dbox-example
                for tag in defn_div.find_all('span', class_="dbox-example"):
                    tag.unwrap()

                # mod 5.
                for tag in defn_div.find_all('span'):
                    del tag['data-syllable']
               
                nice_html_frag = defn_div.prettify().replace(u"–",u"-")
                nice_html_frag2 = nice_html_frag.encode('ascii','ignore') #unicode, needs conversion
                DefinitionHTML_list.append(nice_html_frag2)

            return json.dumps({
'word_queried': search_word,
'word_defined': word_actual,
'n_definitions': n_definitions,
'DefnList': DefinitionHTML_list
})


class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        #we're not interested in the messages that are binary, we should never recieve them here...
        if not isBinary:
            my_query = payload.decode('utf8')

            #define a callback to (1) parse webpage (2) respond with result
            def sendme(x):
                print("==webpage retrieved, responding to query "+my_query+"==")
                print ("Parsing HTML then sending WS response to query: " + my_query)
                result_in_json = json_from_whole_page(x, my_query)
                self.sendMessage(result_in_json, False)

            def dictfail(x):
                print("==webpage retrieval FAILED for query "+my_query+"==")
                print(x)

                self.sendMessage(json.dumps({
'word_queried': my_query,
'word_defined': '---',
'n_definitions': 0,
'DefnList': []
}), False)

            # GET webpage, and involke callback upon reciept of data
            grabber = client.getPage('http://www.dictionary.com/browse/' + payload)
            grabber.addCallback(sendme)
            grabber.addErrback(dictfail)


    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))


if __name__ == '__main__':

    import sys

    from twisted.python import log
    from twisted.internet import reactor

    log.startLogging(sys.stdout)

    factory = WebSocketServerFactory(u"ws://127.0.0.1:9000")
    factory.protocol = MyServerProtocol
    # factory.setProtocolOptions(maxConnections=2)

    reactor.listenTCP(9000, factory)
    reactor.run()

from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory

import bs4, urllib, re


def www_word_lookup(search_word):

    r = urllib.urlopen('http://www.dictionary.com/browse/' + search_word).read()
    soup = bs4.BeautifulSoup(r, "html.parser")

    Y = soup.body.find(id="source-luna").find_all('div')

    n_definitions = 0
    topdef = None
    for y in Y:
        if 'class' in y.attrs:
            if y['class'][0] == 'def-content':
                n_definitions = n_definitions +1
                if not y.string is None:
                    topdef = re.sub(r'[^a-zA-Z,.;\(\)\- ]','', y.string).strip() 
                    break

    if topdef == None:
        return 'no definition found'
    else:
        return topdef


class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        #we're not interested in the messages that are binary, we should never recieve them here...
        if not isBinary:

            my_query = payload.decode('utf8')
            
            #this is a blocking function call
            my_definition = www_word_lookup(my_query)
            print my_definition
            u_def = unicode(my_definition)
            str_def = my_definition.encode('ascii','ignore')

            print type(payload)
            print type(payload) == bytes

            print type(my_definition)
            print type(my_definition) == bytes

            print type(str_def)
            print type(str_def) == bytes
            self.sendMessage(payload, isBinary)
            self.sendMessage(str_def, isBinary)


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

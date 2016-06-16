from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory

import bs4, urllib, re, json


def www_word_lookup(search_word):

    r = urllib.urlopen('http://www.dictionary.com/browse/' + search_word).read()
    soup = bs4.BeautifulSoup(r, "html.parser")

    A = soup.body.find(id="source-luna")
    if A is not None:

        Y = A.find_all('div')

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
    else:
        return 'unexpected page structure on dictionary.com'

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
            my_definition = www_word_lookup(my_query) #returns unicode, needs conversion
            str_def = my_definition.encode('ascii','ignore')

            print("Looked up: " + my_query)
            print("Found: " + str_def)
            result_in_json = json.dumps({'word': my_query, 'defn':str_def})
            self.sendMessage(result_in_json, False)


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

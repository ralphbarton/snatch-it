# -*- coding: utf-8 -*-
from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory

from twisted.web import client
from twisted.internet import reactor
import bs4, json


# here are the font formatting classes (that I adopt)
# "dbox-italic"
# "dbox-bold"
# "def-block"
        

def collinsdictionary_com__digest(page_html, search_word):
    soup = bs4.BeautifulSoup(page_html, "html.parser")
    main_content_tag = soup.select('div.content.definitions.ced')[0]
    DefinitionHTML_list = []

    GG_array = []
    defn_html_frag_dict = {}

    # 'hom' spans are containers for each gramatical group...
    temp_count = 0
    for direct_child_SENSE_TAG in main_content_tag.select("span.hom > span.sense"):
        # Note: the 'direct_child_SENSE_TAG' is the tag we manipulate the content of, before finally returning...

        gg_main = direct_child_SENSE_TAG.parent.find('span', class_=" gramGrp").get_text()
        gg_sub_tag  = direct_child_SENSE_TAG.find('span', class_=" gramGrp")
        gg_sub = "" if gg_sub_tag == None else " " + gg_sub_tag.get_text()
        gg_descriptor_txt = gg_main + gg_sub

        # 1. TOTAL REMOVAL of tags....
        # 1.1 remove "sensenum" tag (but only the FIRST found)
        direct_child_SENSE_TAG.find('span', class_="sensenum").decompose()
        # 1.2 remove the gramGrp tag
        for x in direct_child_SENSE_TAG.find_all('span', class_="gramGrp"):
            x.decompose()

        # 2. UNWRAPPING of tags...
        # 2.1 all "def" tags...
        for span_def in direct_child_SENSE_TAG.find_all('span', class_="def"):
            span_def.unwrap()
        # 2.2 all "xr" tags
        for x in direct_child_SENSE_TAG.find_all('span', class_="xr"):
            x.unwrap()
        # 2.3 <a> type="def" tags - excessive linkiness...
        for x in direct_child_SENSE_TAG.find_all('a', attrs={"type": "def"}):
            x.unwrap()
        # 2.4 all "form" tags
        for x in direct_child_SENSE_TAG.find_all('span', class_="form"):
            x.unwrap()

        


        # 3. MODIFICATION (class changing) of tags
        # 3.1 all "cit" tags - they are for citations or examples of usage
        for span_cit in direct_child_SENSE_TAG.find_all('span', class_="cit"):
            del span_cit['type'] # typically type="example"
            span_cit['class'] = "def-block"
            ## Also FULLY RECURSIVE UNWRAPPING = replacing string with get_text
            span_cit.string = span_cit.get_text()
        # 3.2 'lbl' tags can mean two things, depending on whether they have a type attribute
        for span_lbl in direct_child_SENSE_TAG.find_all('span', class_="lbl"):
            if 'type' in span_lbl.attrs:
                del span_lbl['type']
                span_lbl['class'] = "dbox-bold"
            else:
                span_lbl['class'] = "dbox-italic"
            ## Also FULLY RECURSIVE UNWRAPPING = replacing string with get_text
            span_lbl.string = span_lbl.get_text()

        # 3.3 'hi' rend="i" tags - a slightly different case of ITALIC
        for x in direct_child_SENSE_TAG.find_all('span', attrs={"class": "hi", "rend": "i"}):
            del x["rend"]
            x['class'] = "dbox-italic"
        # 3.4 'orth' tags - a very deep bold on collins..
        for x in direct_child_SENSE_TAG.find_all('span', class_="orth"):
            x['class'] = "dbox-bold"


        # 4. MERGING of adjacent tags of same type
        # 4.1. "dbox-bold" tags...
        for bold_span in direct_child_SENSE_TAG.find_all('span', class_="dbox-bold"):
            for sibling in bold_span.next_siblings:

                #3 tests: (1) is it a tag (2) has it a class (3) is that class "dbox-bold"?
                if type(sibling) == bs4.element.Tag and 'class' in sibling.attrs and sibling.attrs['class'] == "dbox-bold":
                    bold_span.append(sibling.get_text())
                    sibling.decompose()
                    print ("====chain BUILT")
                else:
                    print ("====chain broken by")
                    print (type(sibling))
                    print(">"+sibling+"<")
                    break # chain broken
        

        #just change the main container (span to div)
        direct_child_SENSE_TAG.name = 'div'
        direct_child_SENSE_TAG['class'] = 'definition'
        del direct_child_SENSE_TAG['id']

        # inject the gram-grp div actually into the fragment
        new_tag = soup.new_tag("span")
        new_tag['class'] = 'gram-grp'
        new_tag.string = gg_descriptor_txt
        direct_child_SENSE_TAG.insert(0, new_tag)
                
        #standardise the other fonts tags.

        #TODO: do this....


        temp_count = temp_count + 1
        if temp_count > 17:
            break

        # build a dictionary of lists, and a list of keys
        if gg_descriptor_txt not in GG_array:
            GG_array.append(gg_descriptor_txt)
            defn_html_frag_dict[gg_descriptor_txt] = []
        defn_html_frag_dict[gg_descriptor_txt].append(direct_child_SENSE_TAG.prettify())



        print ("=========================")
        print(direct_child_SENSE_TAG.prettify())

    # .... generate the JSON from the otherwise-ordered extracted data.



def collinsdictionary_com__digestV2(page_html, search_word):
    soup = bs4.BeautifulSoup(page_html, "html.parser")
    main_content_tag = soup.select('div.content.definitions.ced')[0]

    # 'hom' spans are containers for each gramatical group...
    Hom_Spans = main_content_tag.find_all('span', class_="hom")
    for hom_span in Hom_Spans:
        print ("==================")
        #print(hom_span)
        gg_descriptor_txt = hom_span.find('span', class_=" gramGrp").get_text()
        Sense_spans = hom_span.find_all('span', class_="sense")

        for D_tag in hom_span.children:
            print(possible_sense_span['class'])
            # each of these is ONE definition...
            if possible_sense_span['class'] == 'sense':
                D_tag = possible_sense_span #rename variable 

            print ("==================")
            defn_txt = defn_span.prettify()
            print(">>>>" + defn_txt)


def dictionary_com__digest(page_html, search_word):
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

            null_response = json.dumps({
'word_queried': my_query,
'word_defined': '---',
'n_definitions': 0,
'DefnList': []
})

            #define a callback to (1) parse webpage (2) respond with result
            def dictionary_com__handler(html_string):
                print("==webpage retrieved (dictionary.com), responding to query "+my_query+"==")
                print ("Parsing HTML then sending WS response to query: " + my_query)
                jsn = dictionary_com__digest(html_string, my_query)
                self.sendMessage(jsn, False)

            def collinsdictionary_com__handler(html_string):
                print("==webpage retrieved (collinsdictionary.com), responding to query "+my_query+"==")
                print ("Parsing HTML then sending WS response to query: " + my_query)
                jsn = collinsdictionary_com__digest(html_string, my_query)
                #not ready for this.
                #self.sendMessage(jsn, False)

            def dictionary_com__fail(error_obj):
                print("==webpage retrieval FAILED (dictionary.com) for query "+my_query+"==")
                print(error_obj)
                self.sendMessage(x, False)

            def collinsdictionary_com__fail(error_obj):
                print("==webpage retrieval FAILED (collinsdictionary.com) for query "+my_query+"==")
                print(error_obj)
                self.sendMessage(x, False)

            # GET webpage, and involke callback upon reciept of data
            #grabber_1 = client.getPage('http://www.dictionary.com/browse/' + payload)
            #grabber_1.addCallback(dictionary_com__handler)
            #grabber_1.addErrback(dictionary_com__fail)

            # GET webpage, and involke callback upon reciept of data
            grabber_2 = client.getPage('http://www.collinsdictionary.com/dictionary/english/' + payload)
            grabber_2.addCallback(collinsdictionary_com__handler)
            grabber_2.addErrback(collinsdictionary_com__fail)



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

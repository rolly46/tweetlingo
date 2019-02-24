# compute_input.py

import sys
import json
import numpy as np
from TwitterSearch import *
import re

# Read data from stdin


def read_in():
    lines = sys.stdin.readline()
    # Since our input would only be having one line, parse our JSON data from that
    return lines


def main():
    profilewords = ""
    number = 0
    # get our data as an array from read_in()
    lines = read_in()

    try:
        tuo = TwitterUserOrder(lines)  # create a TwitterUserOrder

        # it's about time to create a TwitterSearch object with our secret tokens
        ts = TwitterSearch(
            consumer_key='L9khFUeK24k1Vxre6EEGSwl3U',
            consumer_secret='Vhm1lzZF58DstT43PUGKmWcrFDdgTHNni4OidTQ3IoYHultyoO',
            access_token='1080045656947867649-TWUvH5NESuJpiPWYB9LBwyILEBGDXW',
            access_token_secret='3qp0NvV07T4Y2xYGf7ksPE34ikJBBXqyOMovnCKFuBhyQ'
        )

        tweets = ts.search_tweets_iterable(tuo)

        # start asking Twitter about the timeline
        for tweet in ts.search_tweets_iterable(tuo):
            number = number+1
            profilewords += " " + tweet['text']
            #only get last 100 tweets
            if number == 150:
                break       
            
        # get rid of the pesky twittr links
        text = re.sub(r'http\S+', '', profilewords)
        # and peroids/commas
        text = (re.sub(r'[^\w\s]','',text))
        # and new lines
        text = re.sub("\n|\r", "", text)

       

        print(text)


    except TwitterSearchException as e:  # catch all those ugly errors
        print(e)



# start process
if __name__ == '__main__':
    main()
